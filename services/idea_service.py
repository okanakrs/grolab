import asyncio
import json
import logging
import os
import random
import uuid
from typing import Literal, Optional

import httpx
from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError
from tenacity import AsyncRetrying, retry_if_exception, stop_after_attempt, wait_exponential

from services.researcher import MarketContext, ProgressCallback, research_market

load_dotenv()


class SaaSIdea(BaseModel):
    isim: str
    problem: str
    cozum: str
    hedef_kitle: str
    tahmini_mrr_potansiyeli: str


class SaaSIdeaList(BaseModel):
    ideas: list[SaaSIdea]


class IdeaGenerationResult(BaseModel):
    ideas: list[SaaSIdea]
    market_evidence: list[str]
    trends: list[str]
    competitors: list[str]


LLMProvider = Literal["openai", "anthropic"]
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "90"))
MARKET_RESEARCH_TIMEOUT_SECONDS = float(os.getenv("MARKET_RESEARCH_TIMEOUT_SECONDS", "30"))
LLM_STAGE_TIMEOUT_SECONDS = float(os.getenv("LLM_STAGE_TIMEOUT_SECONDS", "90"))
ALLOW_FALLBACK_IDEAS = os.getenv("ALLOW_FALLBACK_IDEAS", "0") == "1"

logger = logging.getLogger("grolab.idea_service")


_RANDOM_DOMAINS = [
    "veterinary clinic management software",
    "independent bookstore inventory tools",
    "podcast production workflow automation",
    "food truck scheduling and route optimization",
    "home renovation project management for contractors",
    "language school student tracking platform",
    "craft brewery batch and recipe management",
    "personal trainer client progress tracking",
    "nonprofit grant writing and reporting tools",
    "dental practice patient communication software",
    "wedding planner vendor coordination platform",
    "photography studio booking and delivery tools",
    "auto repair shop diagnostic and billing software",
    "childcare center attendance and billing platform",
    "farmers market vendor and logistics management",
    "music teacher student scheduling and payment tools",
    "local tour operator booking management software",
    "pet grooming salon appointment and loyalty tools",
    "escape room booking and experience management",
    "co-working space desk booking and billing platform",
    "artisan marketplace seller analytics tools",
    "tutoring center session scheduling software",
    "yoga studio membership and class booking tools",
    "construction subcontractor job tracking platform",
    "catering company order and event management tools",
]


def _build_user_prompt(topic: str, market_context: MarketContext) -> str:
    topic_text = topic.strip() or "AI-driven products"
    seed = str(uuid.uuid4())[:8]

    _SOCIAL_BLACKLIST = {"linkedin", "twitter", "instagram", "facebook", "tiktok", "youtube", "social media"}

    def _is_social(text: str) -> bool:
        t = text.lower()
        return any(kw in t for kw in _SOCIAL_BLACKLIST)

    product_hunt_briefs = [
        f"- {item.name}: {item.tagline} (votes={item.votes_count})"
        for item in market_context.product_hunt_products[:12]
        if not _is_social(item.name + " " + item.tagline)
    ]
    reddit_briefs = [
        f"- r/{item.subreddit}: {item.title} (score={item.score})"
        for item in market_context.reddit_needs[:10]
        if not _is_social(item.title)
    ]
    trend_briefs = [
        f"- {item.keyword} (trend={item.value})"
        for item in market_context.trend_keywords[:12]
        if not _is_social(item.keyword)
    ]
    app_store_briefs = [
        f"- [{item.app_name} ★{item.rating}]: {item.review[:150]}"
        for item in getattr(market_context, "app_store_reviews", [])[:10]
    ]
    hn_briefs = [
        f"- {item.title} (score={item.score}, comments={item.comments})"
        for item in getattr(market_context, "hn_posts", [])[:10]
    ]

    product_hunt_text = "\n".join(product_hunt_briefs) or "- no_data"
    reddit_text = "\n".join(reddit_briefs) or "- no_data"
    trend_text = "\n".join(trend_briefs) or "- no_data"
    app_store_text = "\n".join(app_store_briefs) or ""
    hn_text = "\n".join(hn_briefs) or ""
    source_error_text = ", ".join(market_context.source_errors) or "none"

    has_market_data = product_hunt_text != "- no_data" or reddit_text != "- no_data" or trend_text != "- no_data"

    if has_market_data:
        app_store_block = (
            f"App Store düşük puanlı şikâyetler (gerçek kullanıcı pain point'leri):\n{app_store_text}\n"
            if app_store_text else ""
        )
        hn_block = (
            f"Hacker News tartışmaları (founder/developer sinyalleri):\n{hn_text}\n"
            if hn_text else ""
        )
        context_block = (
            "Product Hunt sinyalleri:\n"
            f"{product_hunt_text}\n"
            "Reddit problem/need sinyalleri:\n"
            f"{reddit_text}\n"
            "Google Trends sinyalleri:\n"
            f"{trend_text}\n"
            f"{hn_block}"
            f"{app_store_block}"
        )
    else:
        context_block = (
            f"Pazar verisi mevcut degil. Sadece kendi bilginle {topic_text} alaninda "
            "gercek bir problemi cozen, henuz kalabalik olmayan bir nische SaaS fikri olustur.\n"
        )

    return (
        f"[seed={seed}] "
        f"Su alani kapsayan OZGUN bir SaaS fikri uret: {topic_text}.\n"
        f"{context_block}"
        "Yanit yalnizca gecerli JSON olmali; markdown veya aciklama ekleme.\n"
        "JSON formati su sekilde olmali:\n"
        "{\n"
        '  "ideas": [\n'
        "    {\n"
        '      "isim": "...",\n'
        '      "problem": "...",\n'
        '      "cozum": "...",\n'
        '      "hedef_kitle": "...",\n'
        '      "tahmini_mrr_potansiyeli": "..."\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Tum alanlar dolu olmali."
    )


def _derive_market_evidence(market_context: MarketContext, plan: str = "free") -> tuple[list[str], list[str], list[str]]:
    is_pro = plan in ("pro", "enterprise")

    trends = [
        f"Google Trends: {item.keyword} ({item.value})"
        for item in market_context.trend_keywords[:5]
    ]

    competitors = [
        f"PH: {item.name} ({item.votes_count} vote)"
        for item in market_context.product_hunt_products[:5]
    ]

    market_evidence: list[str] = []
    if market_context.trend_keywords:
        market_evidence.append(
            f"Google'da ilgili alanda {len(market_context.trend_keywords)} yukselen sinyal bulundu"
        )
    if market_context.product_hunt_products:
        market_evidence.append(
            f"Product Hunt'ta benzer {len(market_context.product_hunt_products)} urun tespit edildi"
        )
    if market_context.reddit_needs:
        market_evidence.append(
            f"Reddit'te {len(market_context.reddit_needs)} problem/need sinyali yakalandi"
        )

    if is_pro:
        hn_posts = getattr(market_context, "hn_posts", [])
        if hn_posts:
            market_evidence.append(
                f"Hacker News'te {len(hn_posts)} ilgili tartisma tespit edildi"
            )

        app_store_reviews = getattr(market_context, "app_store_reviews", [])
        if app_store_reviews:
            market_evidence.append(
                f"App Store'da {len(app_store_reviews)} dusuk puanli sikayet analiz edildi"
            )

    return market_evidence[:6], trends[:6], competitors[:6]


def _extract_json_text(raw_text: str) -> str:
    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return raw_text
    return raw_text[start : end + 1]


def _fallback_ideas(topic: str) -> SaaSIdeaList:
    normalized = topic.strip() or "AI SaaS"
    ideas = [
        SaaSIdea(
            isim=f"{normalized} Workflow Copilot",
            problem="Ekipler tekrar eden sureclerde zaman kaybediyor ve standart kaliteyi koruyamiyor.",
            cozum="Tekrarlayan gorevleri adim adim yoneten, otomasyon onerileri sunan web tabanli copilot.",
            hedef_kitle="KOBI operasyon ekipleri ve urun ekipleri",
            tahmini_mrr_potansiyeli="$8K-$20K",
        ),
        SaaSIdea(
            isim=f"{normalized} Insight Monitor",
            problem="Pazar sinyalleri daginik oldugu icin ekipler dogru zamanda aksiyon alamiyor.",
            cozum="Trend, rakip ve topluluk geri bildirimlerini tek panelde toplayan sinyal izleme araci.",
            hedef_kitle="Founder, product manager, growth ekipleri",
            tahmini_mrr_potansiyeli="$10K-$30K",
        ),
        SaaSIdea(
            isim=f"{normalized} Onboarding Studio",
            problem="Yeni kullanicilar urunu hizli benimseyemedigi icin churn artiyor.",
            cozum="Kullanici segmentine gore dinamik onboarding akislari olusturan no-code SaaS modulu.",
            hedef_kitle="B2B SaaS sirketleri",
            tahmini_mrr_potansiyeli="$12K-$40K",
        ),
    ]
    return SaaSIdeaList(ideas=ideas)

async def _post_with_retry(
    *,
    url: str,
    headers: dict[str, str],
    payload: dict,
    req_logger: logging.Logger,
) -> httpx.Response:
    async with httpx.AsyncClient(timeout=httpx.Timeout(connect=10, read=90, write=10, pool=5)) as client:
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(1),
            retry=retry_if_exception(_should_retry),
            reraise=True,
        ):
            with attempt:
                req_logger.info(f"llm_http_attempt attempt={attempt.retry_state.attempt_number}")
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                return response

    raise RuntimeError("LLM request failed")


def _should_retry(error: BaseException) -> bool:
    if isinstance(error, (httpx.TimeoutException, httpx.RequestError)):
        return True

    if isinstance(error, httpx.HTTPStatusError):
        status = error.response.status_code
        return status >= 500 or status in {408, 409, 425, 429}

    return False


async def _call_openai(
    topic: str,
    market_context: MarketContext,
    req_logger: logging.Logger,
    idea_count: int = 3,
) -> SaaSIdeaList:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing in .env")

    user_prompt = _build_user_prompt(topic, market_context)
    schema = {
        "name": "saas_idea_response",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "ideas": {
                    "type": "array",
                    "minItems": idea_count,
                    "maxItems": idea_count,
                    "items": {
                        "type": "object",
                        "properties": {
                            "isim": {"type": "string"},
                            "problem": {"type": "string"},
                            "cozum": {"type": "string"},
                            "hedef_kitle": {"type": "string"},
                            "tahmini_mrr_potansiyeli": {"type": "string"},
                        },
                        "required": [
                            "isim",
                            "problem",
                            "cozum",
                            "hedef_kitle",
                            "tahmini_mrr_potansiyeli",
                        ],
                        "additionalProperties": False,
                    },
                }
            },
            "required": ["ideas"],
            "additionalProperties": False,
        },
    }

    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-4o"),
        "messages": [
            {
                "role": "system",
                "content": "You are a SaaS strategist. Output strict JSON only. Always generate fresh, unique ideas — never repeat previous responses.",
            },
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_schema", "json_schema": schema},
        "temperature": 1.0,
    }

    req_logger.info("llm_call_start provider=openai")
    response = await _post_with_retry(
        url="https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        payload=payload,
        req_logger=req_logger,
    )

    response.raise_for_status()
    data = response.json()
    content = data["choices"][0]["message"]["content"]
    parsed = json.loads(content)
    validated = SaaSIdeaList.model_validate(parsed)
    req_logger.info(f"llm_call_success provider=openai ideas={len(validated.ideas)}")
    return validated


async def _call_anthropic(
    topic: str,
    market_context: MarketContext,
    req_logger: logging.Logger,
    idea_count: int = 3,
) -> SaaSIdeaList:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is missing in .env")

    user_prompt = _build_user_prompt(topic, market_context)
    payload = {
        "model": os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        "max_tokens": 4096,
        "temperature": 1.0,
        "system": "You are a SaaS strategist. Output strict JSON only. Always generate fresh, unique ideas — never repeat previous responses.",
        "messages": [{"role": "user", "content": user_prompt + f"\nLutfen {idea_count} adet farkli SaaS fikri uret ve JSON'daki 'ideas' dizisine ekle."}],
    }

    req_logger.info("llm_call_start provider=anthropic")
    response = await _post_with_retry(
        url="https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        payload=payload,
        req_logger=req_logger,
    )

    response.raise_for_status()
    data = response.json()
    text_chunks = [block.get("text", "") for block in data.get("content", [])]
    json_text = _extract_json_text("".join(text_chunks).strip())
    parsed = json.loads(json_text)
    validated = SaaSIdeaList.model_validate(parsed)
    req_logger.info(f"llm_call_success provider=anthropic ideas={len(validated.ideas)}")
    return validated


async def generate_saas_ideas(
    topic: str,
    request_id: str,
    idea_count: int = 3,
    on_progress: Optional[ProgressCallback] = None,
    plan: str = "free",
) -> IdeaGenerationResult:
    provider = os.getenv("LLM_PROVIDER", "openai").strip().lower()
    req_logger = logger
    is_pro = plan in ("pro", "enterprise")

    # Plan kısıtlaması: free → max 1 fikir
    max_ideas = 3 if is_pro else 1
    idea_count = max(1, min(idea_count, max_ideas))

    raw_topic = topic.strip()
    is_random = not raw_topic
    effective_topic = raw_topic if raw_topic else random.choice(_RANDOM_DOMAINS)
    logger.info(f"idea_generation_started provider={provider} request_id={request_id} idea_count={idea_count} effective_topic={effective_topic!r} is_random={is_random}")

    market_context = MarketContext(
        topic=effective_topic,
        product_hunt_products=[],
        reddit_needs=[],
        trend_keywords=[],
        source_errors=[],
    )

    # Boş topic'te market araştırması atla — her zaman aynı veriyi döndürüp LLM'i etkiliyor
    if not is_random:
        if on_progress:
            await on_progress("research_start", "Pazar araştırması başlıyor...", 0)
        try:
            market_context = await asyncio.wait_for(
                research_market(effective_topic, request_id, on_progress=on_progress, plan=plan),
                timeout=MARKET_RESEARCH_TIMEOUT_SECONDS,
            )
        except Exception as error:
            req_logger.warning(
                f"market_context_fallback type={type(error).__name__} request_id={request_id}"
            )
            market_context.source_errors.append("market_context_timeout_or_error")

    if on_progress:
        label = "Fırsat skoru hesaplanıyor..." if is_pro else "Fikirler oluşturuluyor..."
        await on_progress("llm_start", label, 0)

    try:
        if provider == "anthropic":
            response = await _call_anthropic(effective_topic, market_context, req_logger, idea_count=idea_count)
        else:
            response = await _call_openai(effective_topic, market_context, req_logger, idea_count=idea_count)
    except (asyncio.TimeoutError, httpx.HTTPError, json.JSONDecodeError, ValidationError, RuntimeError) as error:
        if ALLOW_FALLBACK_IDEAS:
            req_logger.warning(
                f"idea_generation_llm_fallback type={type(error).__name__} request_id={request_id}"
            )
            response = _fallback_ideas(topic)
        else:
            req_logger.exception(
                f"idea_generation_llm_failed type={type(error).__name__} request_id={request_id}"
            )
            raise RuntimeError("LLM provider request failed or timed out") from error
    except Exception as error:
        if ALLOW_FALLBACK_IDEAS:
            req_logger.warning(
                f"idea_generation_unexpected_fallback type={type(error).__name__} request_id={request_id}"
            )
            response = _fallback_ideas(topic)
        else:
            req_logger.exception(
                f"idea_generation_unexpected_failed type={type(error).__name__} request_id={request_id}"
            )
            raise RuntimeError("Unexpected error while generating ideas") from error

    # Sadece istenen kadar fikir döndür
    market_evidence, trends, competitors = _derive_market_evidence(market_context, plan=plan)
    logger.info(
        f"idea_generation_completed ideas={len(response.ideas)} request_id={request_id}"
    )
    return IdeaGenerationResult(
        ideas=response.ideas[:idea_count],
        market_evidence=market_evidence,
        trends=trends,
        competitors=competitors,
    )
