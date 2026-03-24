import asyncio
import logging
import os
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


def _fetch_reddit_sync(topic: str) -> list[RedditNeedPost]:
    import praw

    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent = os.getenv("REDDIT_USER_AGENT", "grolab-research-bot/0.1")

    if not client_id or not client_secret:
        raise RuntimeError("Reddit API credentials are missing")

    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent,
    )

    subreddits = os.getenv("REDDIT_SUBREDDITS", "startups,Entrepreneur,SaaS")
    subreddit_names = [item.strip() for item in subreddits.split(",") if item.strip()]
    keywords = ["problem", "need", "pain", "struggle", "frustration"]

    results: list[RedditNeedPost] = []
    query = f"{topic} problem OR need OR pain"

    for subreddit_name in subreddit_names:
        subreddit = reddit.subreddit(subreddit_name)
        for post in subreddit.search(query, sort="top", time_filter="month", limit=15):
            text = f"{post.title} {getattr(post, 'selftext', '')}".lower()
            if not any(keyword in text for keyword in keywords):
                continue
            results.append(
                RedditNeedPost(
                    title=post.title,
                    subreddit=subreddit_name,
                    url=f"https://www.reddit.com{post.permalink}",
                    score=int(post.score or 0),
                )
            )

    results.sort(key=lambda item: item.score, reverse=True)
    return results[:8]


async def _fetch_reddit(topic: str) -> list[RedditNeedPost]:
    return await asyncio.to_thread(_fetch_reddit_sync, topic)


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
    return await asyncio.to_thread(_fetch_google_trends_sync, topic)


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
