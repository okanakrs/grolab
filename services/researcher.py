import asyncio
import logging
import os
import re
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from pydantic import BaseModel
from serpapi import GoogleSearch

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


class MarketContext(BaseModel):
    topic: str
    product_hunt_products: list[ProductHuntProduct]
    reddit_needs: list[RedditNeedPost]
    trend_keywords: list[TrendKeyword]
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
        "params": f"query={topic}+saas&hitsPerPage=8",
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(endpoint, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

    products: list[ProductHuntProduct] = []
    for hit in data.get("hits", []):
        name = (hit.get("name") or "Unknown").strip()
        tagline = (hit.get("tagline") or "").strip()
        url = hit.get("redirect_url") or hit.get("discussion_url") or ""
        votes_count = int(hit.get("votes_count") or 0)
        products.append(
            ProductHuntProduct(
                name=name,
                tagline=tagline,
                url=url,
                votes_count=votes_count,
            )
        )

    return products[:6]


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
            params={"q": query, "sort": "top", "t": "month", "limit": 15, "restrict_sr": 1},
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


async def _fetch_reddit(topic: str) -> list[RedditNeedPost]:
    subreddits = os.getenv("REDDIT_SUBREDDITS", "startups,Entrepreneur,SaaS")
    subreddit_names = [s.strip() for s in subreddits.split(",") if s.strip()]
    queries = [
        f"{topic} need OR wish OR problem",
        f"{topic} looking for tool OR solution",
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
    return unique[:8]


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

    return ranked[:8]


async def _fetch_google_trends(topic: str) -> list[TrendKeyword]:
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_fetch_google_trends_sync, topic),
            timeout=15,
        )
    except asyncio.TimeoutError:
        logger.warning("google_trends_timeout topic=%s", topic)
        return []


def _result_or_raise(result: Any) -> Any:
    if isinstance(result, Exception):
        raise result
    return result


async def research_market(topic: str, request_id: Optional[str] = None) -> MarketContext:
    req_id = request_id or "-"
    logger.info("market_research_started topic=%s request_id=%s", topic, req_id)

    tasks = (
        _fetch_product_hunt(topic),
        _fetch_reddit(topic),
        _fetch_google_trends(topic),
    )

    results = await asyncio.gather(*tasks, return_exceptions=True)
    source_errors: list[str] = []

    product_hunt_products: list[ProductHuntProduct]
    reddit_needs: list[RedditNeedPost]
    trend_keywords: list[TrendKeyword]

    try:
        product_hunt_products = _result_or_raise(results[0])
    except Exception as error:
        logger.warning("market_research_producthunt_failed error=%s request_id=%s", error, req_id)
        source_errors.append("product_hunt_unavailable")
        product_hunt_products = []

    try:
        reddit_needs = _result_or_raise(results[1])
    except Exception as error:
        logger.warning("market_research_reddit_failed error=%s request_id=%s", error, req_id)
        source_errors.append("reddit_unavailable")
        reddit_needs = []

    try:
        trend_keywords = _result_or_raise(results[2])
    except Exception as error:
        logger.warning("market_research_trends_failed error=%s request_id=%s", error, req_id)
        source_errors.append("google_trends_unavailable")
        trend_keywords = []

    context = MarketContext(
        topic=topic,
        product_hunt_products=product_hunt_products,
        reddit_needs=reddit_needs,
        trend_keywords=trend_keywords,
        source_errors=source_errors,
    )

    logger.info(
        "market_research_completed products=%s reddit=%s trends=%s source_errors=%s request_id=%s",
        len(context.product_hunt_products),
        len(context.reddit_needs),
        len(context.trend_keywords),
        len(context.source_errors),
        req_id,
    )
    return context
