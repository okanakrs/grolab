import asyncio
import logging
import os
import re
from typing import Any, Awaitable, Callable, Optional

import httpx
from dotenv import load_dotenv
from pydantic import BaseModel
from serpapi import GoogleSearch

ProgressCallback = Callable[[str, str, int], Awaitable[None]]

load_dotenv()

logger = logging.getLogger("grolab.researcher")


class ProductHuntProduct(BaseModel):
    name: str
    tagline: str
    url: str
    votes_count: int


class RedditNeedPost(BaseModel):
    title: str
    subreddit: str
    url: str
    score: int


class TrendKeyword(BaseModel):
    keyword: str
    value: str


class AppStoreReview(BaseModel):
    app_name: str
    review: str
    rating: int
    app_id: str


class HNPost(BaseModel):
    title: str
    url: str
    score: int
    comments: int


class MarketContext(BaseModel):
    topic: str
    product_hunt_products: list[ProductHuntProduct]
    reddit_needs: list[RedditNeedPost]
    trend_keywords: list[TrendKeyword]
    app_store_reviews: list[AppStoreReview] = []
    hn_posts: list[HNPost] = []
    source_errors: list[str]


async def _fetch_product_hunt(topic: str) -> list[ProductHuntProduct]:
    app_id = os.getenv("PH_ALGOLIA_APP_ID")
    api_key = os.getenv("PH_ALGOLIA_API_KEY")
    index_name = os.getenv("PH_ALGOLIA_INDEX", "Post_production")

    if not app_id or not api_key:
        raise RuntimeError("Product Hunt Algolia credentials are missing")

    endpoint = f"https://{app_id}-dsn.algolia.net/1/indexes/{index_name}/query"
    headers = {
        "X-Algolia-API-Key": api_key,
        "X-Algolia-Application-Id": app_id,
        "Content-Type": "application/json",
    }
    payload = {
        "params": f"query={topic}+saas&hitsPerPage=40",
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(endpoint, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

    topic_tokens = set(re.sub(r"[^a-z0-9 ]", " ", topic.lower()).split())

    def _relevance(name: str, tagline: str) -> int:
        text = f"{name} {tagline}".lower()
        text = re.sub(r"[^a-z0-9 ]", " ", text)
        tokens = set(text.split())
        return len(topic_tokens & tokens)

    products: list[ProductHuntProduct] = []
    for hit in data.get("hits", []):
        name = (hit.get("name") or "Unknown").strip()
        tagline = (hit.get("tagline") or "").strip()
        url = hit.get("redirect_url") or hit.get("discussion_url") or ""
        votes_count = int(hit.get("vote_count") or hit.get("votes_count") or 0)

        # Düşük oy + alakasız ürünleri filtrele
        if votes_count < 10:
            continue
        if _relevance(name, tagline) == 0:
            continue

        products.append(
            ProductHuntProduct(
                name=name,
                tagline=tagline,
                url=url,
                votes_count=votes_count,
            )
        )

    # Oy sayısına göre sırala
    products.sort(key=lambda p: p.votes_count, reverse=True)
    return products[:15]


_APIFY_BASE = "https://api.apify.com/v2"
_APIFY_TIMEOUT = 50  # saniye


async def _apify_run(actor_id: str, payload: dict) -> list[dict]:
    """Apify aktörünü async olarak çalıştır, dataset'i döndür."""
    api_key = os.getenv("APIFY_API_KEY")
    if not api_key:
        raise RuntimeError("APIFY_API_KEY is missing")

    actor_slug = actor_id.replace("/", "~")
    token_param = {"token": api_key}

    async with httpx.AsyncClient(timeout=30) as client:
        # 1. Run başlat
        run_resp = await client.post(
            f"{_APIFY_BASE}/acts/{actor_slug}/runs",
            params=token_param,
            json=payload,
        )
        run_resp.raise_for_status()
        run_data = run_resp.json().get("data", {})
        run_id = run_data["id"]
        dataset_id = run_data["defaultDatasetId"]
        logger.debug(f"apify_run_started actor={actor_id} run_id={run_id}")

        # 2. Tamamlanmasını bekle (poll)
        deadline = asyncio.get_event_loop().time() + _APIFY_TIMEOUT
        while True:
            await asyncio.sleep(3)
            status_resp = await client.get(
                f"{_APIFY_BASE}/actor-runs/{run_id}",
                params=token_param,
            )
            status_resp.raise_for_status()
            status = status_resp.json().get("data", {}).get("status", "")
            logger.debug(f"apify_run_status actor={actor_id} run_id={run_id} status={status}")
            if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
                break
            if asyncio.get_event_loop().time() > deadline:
                raise asyncio.TimeoutError(f"Apify run timed out: {actor_id}")

        if status != "SUCCEEDED":
            raise RuntimeError(f"Apify run {status}: {actor_id}")

        # 3. Dataset'i çek
        items_resp = await client.get(
            f"{_APIFY_BASE}/datasets/{dataset_id}/items",
            params={**token_param, "limit": 50},
        )
        items_resp.raise_for_status()
        return items_resp.json()


async def _fetch_reddit_apify(topic: str) -> list[RedditNeedPost]:
    subreddits = os.getenv("REDDIT_SUBREDDITS", "startups,Entrepreneur,SaaS")
    subreddit_names = [s.strip() for s in subreddits.split(",") if s.strip()]

    queries = [
        f"{topic} need OR wish OR problem",
        f"{topic} looking for tool",
    ]

    items = await _apify_run(
        "practicaltools/apify-reddit-api",
        {
            "searchQueries": queries,
            "subreddits": subreddit_names,
            "sort": "top",
            "time": "month",
            "maxItems": 30,
        },
    )

    out: list[RedditNeedPost] = []
    seen: set[str] = set()
    for item in items:
        title = (item.get("title") or "").strip()
        selftext = (item.get("selfText") or item.get("body") or "").strip()
        url = item.get("url") or item.get("permalink") or ""
        score = int(item.get("score") or item.get("upVotes") or 0)
        subreddit = item.get("subreddit") or item.get("communityName") or ""

        if not title or url in seen:
            continue

        ws = _wish_score(f"{title} {selftext}")
        if ws == 0:
            continue

        seen.add(url)
        out.append(RedditNeedPost(
            title=title,
            subreddit=subreddit,
            url=url,
            score=score * (1 + ws),
        ))

    out.sort(key=lambda x: x.score, reverse=True)
    return out[:15]


async def _fetch_app_store_reviews(topic: str) -> list[AppStoreReview]:
    """Apify supreme_scraper/apple-apps-store-scraper ile konu araması yapıp uygulama listesi çek."""
    items = await _apify_run(
        "supreme_scraper/apple-apps-store-scraper",
        {
            "action": "scrapeAppSearch",
            "scrapeAppSearch.keywords": [topic],
            "scrapeAppSearch.country": "us",
            "count": 10,
        },
    )

    out: list[AppStoreReview] = []
    for item in items:
        app_name = (item.get("title") or item.get("name") or "").strip()
        app_id = str(item.get("id") or item.get("trackId") or "")
        # Rating ve description'ı review olarak kullan
        rating = int(item.get("averageUserRating") or item.get("rating") or 0)
        description = (item.get("description") or item.get("subtitle") or "").strip()
        if not app_name or not description:
            continue
        out.append(AppStoreReview(
            app_name=app_name,
            review=description[:300],
            rating=rating,
            app_id=app_id,
        ))

    return out[:15]


_WISH_PATTERNS = [
    r"\bi (really |desperately |badly |urgently )?need\b",
    r"\bi wish\b",
    r"\bwhy (is there no|isn'?t there|don'?t we have)\b",
    r"\bsomeone should (build|make|create)\b",
    r"\bwould (love|pay) (to have|for)\b",
    r"\bis there (a tool|an app|a service|software) (that|which|to)\b",
    r"\blooking for (a tool|an app|a way|software)\b",
    r"\bstuck (with|on)\b",
    r"\bpain point\b",
    r"\bproblem (is|with)\b",
    r"\bstruggling (with|to)\b",
    r"\bfrustrat(ed|ing)\b",
    r"\bannoying (that|when|how)\b",
]

_WISH_RE = [re.compile(p, re.I) for p in _WISH_PATTERNS]


def _wish_score(text: str) -> int:
    return sum(1 for r in _WISH_RE if r.search(text))


async def _fetch_one_reddit(
    client: httpx.AsyncClient, sub: str, query: str
) -> list[RedditNeedPost]:
    try:
        resp = await client.get(
            f"https://www.reddit.com/r/{sub}/search.json",
            params={"q": query, "sort": "top", "t": "year", "limit": 25, "restrict_sr": 1},
        )
        resp.raise_for_status()
        posts = resp.json().get("data", {}).get("children", [])
    except Exception:
        return []

    out: list[RedditNeedPost] = []
    for post in posts:
        d = post.get("data", {})
        title = (d.get("title") or "").strip()
        selftext = (d.get("selftext") or "").strip()
        permalink = d.get("permalink", "")
        score = int(d.get("score") or 0)
        ws = _wish_score(f"{title} {selftext}")
        if ws == 0:
            continue
        out.append(
            RedditNeedPost(
                title=title,
                subreddit=sub,
                url=f"https://www.reddit.com{permalink}",
                score=score * (1 + ws),
            )
        )
    return out


_HN_WISH_RE = re.compile(
    r"\b(ask hn|is there|anyone (know|use|built)|looking for|need|wish|problem with|alternative to|how do you)\b",
    re.I,
)


async def _fetch_hn(topic: str) -> list[HNPost]:
    """Hacker News Algolia API — ücretsiz, auth gerektirmez."""
    queries = [
        f"Ask HN {topic}",
        f"{topic} tool",
        f"{topic} alternative",
        f"{topic} problem",
    ]

    posts: list[HNPost] = []
    seen: set[str] = set()

    async with httpx.AsyncClient(timeout=15) as client:
        for query in queries:
            try:
                resp = await client.get(
                    "https://hn.algolia.com/api/v1/search",
                    params={
                        "query": query,
                        "tags": "story",
                        "hitsPerPage": 25,
                        "numericFilters": "points>3",
                    },
                )
                resp.raise_for_status()
                hits = resp.json().get("hits", [])
            except Exception:
                continue

            for hit in hits:
                title = (hit.get("title") or "").strip()
                object_id = hit.get("objectID", "")
                url = f"https://news.ycombinator.com/item?id={object_id}"
                score = int(hit.get("points") or 0)
                comments = int(hit.get("num_comments") or 0)

                if not title or url in seen:
                    continue
                if not _HN_WISH_RE.search(title):
                    continue

                seen.add(url)
                posts.append(HNPost(title=title, url=url, score=score, comments=comments))

    posts.sort(key=lambda x: x.score + x.comments, reverse=True)
    return posts[:15]


async def _fetch_reddit(topic: str) -> list[RedditNeedPost]:
    subreddits = os.getenv("REDDIT_SUBREDDITS", "startups,Entrepreneur,SaaS,smallbusiness,webdev,programming")
    subreddit_names = [s.strip() for s in subreddits.split(",") if s.strip()]
    queries = [
        f"{topic} need OR wish OR problem",
        f"{topic} looking for tool OR solution",
        f"{topic} frustrated OR struggling OR annoying",
    ]

    headers = {"User-Agent": "grolab-research-bot/0.1"}
    results: list[RedditNeedPost] = []

    async with httpx.AsyncClient(timeout=10, headers=headers) as client:
        tasks = [
            _fetch_one_reddit(client, sub, query)
            for sub in subreddit_names
            for query in queries
        ]
        batches = await asyncio.gather(*tasks)
        for batch in batches:
            results.extend(batch)

    seen: set[str] = set()
    unique: list[RedditNeedPost] = []
    for r in results:
        if r.url not in seen:
            seen.add(r.url)
            unique.append(r)

    unique.sort(key=lambda x: x.score, reverse=True)
    return unique[:20]


def _fetch_google_trends_sync(topic: str) -> list[TrendKeyword]:
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        raise RuntimeError("SERPAPI_API_KEY is missing")

    params = {
        "engine": "google_trends",
        "q": topic,
        "data_type": "RELATED_QUERIES",
        "api_key": api_key,
    }

    search = GoogleSearch(params)
    data = search.get_dict()

    ranked: list[TrendKeyword] = []
    related_queries = data.get("related_queries", {})
    rising = related_queries.get("rising", [])

    for item in rising:
        keyword = str(item.get("query") or "").strip()
        value = str(item.get("value") or "").strip()
        if not keyword:
            continue
        ranked.append(TrendKeyword(keyword=keyword, value=value))

    # Hem rising hem top sinyalleri al
    top = related_queries.get("top", [])
    for item in top:
        keyword = str(item.get("query") or "").strip()
        value = str(item.get("value") or "").strip()
        if not keyword:
            continue
        if not any(kw.keyword == keyword for kw in ranked):
            ranked.append(TrendKeyword(keyword=keyword, value=value))

    return ranked[:15]


async def _fetch_google_trends(topic: str) -> list[TrendKeyword]:
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_fetch_google_trends_sync, topic),
            timeout=15,
        )
    except asyncio.TimeoutError:
        logger.warning(f"google_trends_timeout topic={topic}")
        return []


def _result_or_raise(result: Any) -> Any:
    if isinstance(result, Exception):
        raise result
    return result


def _use_apify() -> bool:
    return bool(os.getenv("APIFY_API_KEY"))


async def research_market(
    topic: str,
    request_id: Optional[str] = None,
    on_progress: Optional[ProgressCallback] = None,
    plan: str = "free",
) -> MarketContext:
    req_id = request_id or "-"
    is_pro = plan in ("pro", "enterprise")
    logger.info(f"market_research_started topic={topic} request_id={req_id} plan={plan} apify={_use_apify()}")

    reddit_fetcher = _fetch_reddit_apify if _use_apify() else _fetch_reddit
    app_store_fetcher = (_fetch_app_store_reviews if _use_apify() else None) if is_pro else None

    async def _tracked(coro, step: str, label: str):
        result = await coro
        if on_progress:
            count = len(result) if isinstance(result, list) else 0
            await on_progress(step, label, count)
        return result

    all_tasks: tuple = (
        _tracked(_fetch_product_hunt(topic), "producthunt_done", "Product Hunt"),
        _tracked(reddit_fetcher(topic), "reddit_done", "Reddit"),
        _tracked(_fetch_google_trends(topic), "trends_done", "Google Trends"),
        *((_tracked(_fetch_hn(topic), "hn_done", "Hacker News"),) if is_pro else ()),
        *((_tracked(app_store_fetcher(topic), "appstore_done", "App Store"),) if app_store_fetcher else ()),
    )

    results = await asyncio.gather(*all_tasks, return_exceptions=True)
    source_errors: list[str] = []

    product_hunt_products: list[ProductHuntProduct]
    reddit_needs: list[RedditNeedPost]
    trend_keywords: list[TrendKeyword]
    hn_posts: list[HNPost] = []
    app_store_reviews: list[AppStoreReview] = []

    try:
        product_hunt_products = _result_or_raise(results[0])
    except Exception as error:
        logger.warning(f"market_research_producthunt_failed error={error} request_id={req_id}")
        source_errors.append("product_hunt_unavailable")
        product_hunt_products = []

    try:
        reddit_needs = _result_or_raise(results[1])
    except Exception as error:
        logger.warning(f"market_research_reddit_failed error={error} request_id={req_id}")
        source_errors.append("reddit_unavailable")
        reddit_needs = []

    try:
        trend_keywords = _result_or_raise(results[2])
    except Exception as error:
        logger.warning(f"market_research_trends_failed error={error} request_id={req_id}")
        source_errors.append("google_trends_unavailable")
        trend_keywords = []

    # Pro-only sources — indices shift based on how many tasks were added
    next_idx = 3
    if is_pro:
        try:
            hn_posts = _result_or_raise(results[next_idx])
        except Exception as error:
            logger.warning(f"market_research_hn_failed error={error} request_id={req_id}")
            source_errors.append("hn_unavailable")
        next_idx += 1

    if app_store_fetcher and len(results) > next_idx:
        try:
            app_store_reviews = _result_or_raise(results[next_idx])
        except Exception as error:
            logger.warning(f"market_research_appstore_failed error={error} request_id={req_id}")
            source_errors.append("app_store_unavailable")

    context = MarketContext(
        topic=topic,
        product_hunt_products=product_hunt_products,
        reddit_needs=reddit_needs,
        trend_keywords=trend_keywords,
        hn_posts=hn_posts,
        app_store_reviews=app_store_reviews,
        source_errors=source_errors,
    )

    logger.info(
        f"market_research_completed products={len(context.product_hunt_products)} "
        f"reddit={len(context.reddit_needs)} trends={len(context.trend_keywords)} "
        f"hn={len(context.hn_posts)} app_store={len(context.app_store_reviews)} "
        f"source_errors={len(context.source_errors)} request_id={req_id}"
    )
    return context
