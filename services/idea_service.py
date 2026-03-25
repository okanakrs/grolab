import json
import logging
import os
from typing import Literal

import httpx
from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError
from tenacity import AsyncRetrying, retry_if_exception, stop_after_attempt, wait_exponential

from services.researcher import MarketContext, research_market

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
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))

logger = logging.getLogger("grolab.idea_service")


def _build_user_prompt(topic: str, market_context: MarketContext) -> str:
    topic_text = topic.strip() or "AI-driven products"

    product_hunt_briefs = [
        f"- {item.name}: {item.tagline} (votes={item.votes_count})"
        for item in market_context.product_hunt_products[:5]
    ]
    reddit_briefs = [
        f"- r/{item.subreddit}: {item.title} (score={item.score})"
        for item in market_context.reddit_needs[:5]
    ]
    trend_briefs = [
        f"- {item.keyword} (trend={item.value})"
        for item in market_context.trend_keywords[:5]
    ]

    product_hunt_text = "\n".join(product_hunt_briefs) or "- no_data"
    reddit_text = "\n".join(reddit_briefs) or "- no_data"
    trend_text = "\n".join(trend_briefs) or "- no_data"
    source_error_text = ", ".join(market_context.source_errors) or "none"

    return (
        "Asagidaki pazar arastirmasi verilerine dayanarak SaaS fikri uret.\n"
        "Bu verilere dayanarak su problemi cozen bir SaaS fikri uret: "
        f"{topic_text}.\n"
        "Product Hunt sinyalleri:\n"
        f"{product_hunt_text}\n"
        "Reddit problem/need sinyalleri:\n"
        f"{reddit_text}\n"
        "Google Trends sinyalleri:\n"
        f"{trend_text}\n"
        f"Eksik kaynaklar: {source_error_text}.\n"
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


def _derive_market_evidence(market_context: MarketContext) -> tuple[list[str], list[str], list[str]]:
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
            f"Reddit'te problem/need odakli {len(market_context.reddit_needs)} post yakalandi"
        )
    else:
        market_evidence.append("Reddit sinyalleri henuz sinirli")

    for source_error in market_context.source_errors:
        market_evidence.append(f"Kaynak gecici olarak kullanilamadi: {source_error}")

    return market_evidence[:6], trends[:6], competitors[:6]


def _extract_json_text(raw_text: str) -> str:
    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return raw_text
    return raw_text[start : end + 1]

async def _post_with_retry(
    *,
    url: str,
    headers: dict[str, str],
    payload: dict,
    req_logger: logging.Logger,
) -> httpx.Response:
    async with httpx.AsyncClient(timeout=LLM_TIMEOUT_SECONDS) as client:
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(2),
            wait=wait_exponential(multiplier=1, min=1, max=8),
            retry=retry_if_exception(_should_retry),
            reraise=True,
        ):
            with attempt:
                req_logger.info("llm_http_attempt attempt=%s", attempt.retry_state.attempt_number)
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                return response

    raise RuntimeError("LLM request failed after retries")


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
                    "minItems": 3,
                    "maxItems": 3,
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
                "content": "You are a SaaS strategist. Output strict JSON only.",
            },
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_schema", "json_schema": schema},
        "temperature": 0.7,
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
    req_logger.info("llm_call_success provider=openai ideas=%s", len(validated.ideas))
    return validated


async def _call_anthropic(
    topic: str,
    market_context: MarketContext,
    req_logger: logging.Logger,
) -> SaaSIdeaList:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is missing in .env")

    user_prompt = _build_user_prompt(topic, market_context)
    payload = {
        "model": os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        "max_tokens": 4096,
        "temperature": 0.7,
        "system": "You are a SaaS strategist. Output strict JSON only.",
        "messages": [{"role": "user", "content": user_prompt}],
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
    req_logger.info("llm_call_success provider=anthropic ideas=%s", len(validated.ideas))
    return validated


async def generate_saas_ideas(topic: str, request_id: str) -> IdeaGenerationResult:
    provider = os.getenv("LLM_PROVIDER", "openai").strip().lower()
    req_logger = logger

    # // TODO: Add Redis caching for repeated prompts
    req_logger.info("idea_generation_started provider=%s request_id=%s", provider, request_id)

    try:
        market_context = await research_market(topic, request_id)

        if provider == "anthropic":
            response = await _call_anthropic(topic, market_context, req_logger)
        else:
            response = await _call_openai(topic, market_context, req_logger)

        market_evidence, trends, competitors = _derive_market_evidence(market_context)
        req_logger.info(
            "idea_generation_completed ideas=%s request_id=%s",
            len(response.ideas),
            request_id,
        )
        return IdeaGenerationResult(
            ideas=response.ideas,
            market_evidence=market_evidence,
            trends=trends,
            competitors=competitors,
        )
    except httpx.HTTPError as error:
        req_logger.exception("llm_http_error type=%s request_id=%s", type(error).__name__, request_id)
        raise RuntimeError("LLM provider request failed") from error
    except (json.JSONDecodeError, ValidationError) as error:
        req_logger.exception("llm_parse_error type=%s request_id=%s", type(error).__name__, request_id)
        raise RuntimeError("LLM returned invalid structured JSON") from error
    except Exception as error:
        req_logger.exception(
            "idea_generation_unexpected_error type=%s request_id=%s",
            type(error).__name__,
            request_id,
        )
        raise RuntimeError("Unexpected error while generating ideas") from error
