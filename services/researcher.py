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

    def _has_full_word_match(name: str, tagline: str) -> bool:
        text = f"{name} {tagline}".lower()
        return any(
            re.search(r"\b" + re.escape(token) + r"\b", text)
            for token in topic_tokens
        )

    products: list[ProductHuntProduct] = []
    for hit in data.get("hits", []):
        name = (hit.get("name") or "Unknown").strip()
        tagline = (hit.get("tagline") or "").strip()
        url = hit.get("redirect_url") or hit.get("discussion_url") or ""
        votes_count = int(hit.get("vote_count") or hit.get("votes_count") or 0)

        # Düşük oy + alakasız ürünleri filtrele
        if votes_count < 5:
            continue
        if _relevance(name, tagline) == 0 and votes_count < 50:
            continue
        if not _has_full_word_match(name, tagline):
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


def _topic_score(text: str, topic: str) -> int:
    tokens = [w for w in re.sub(r"[^a-z0-9 ]", " ", topic.lower()).split() if len(w) >= 4]
    if not tokens:
        return 1
    text_lower = text.lower()
    return sum(1 for t in tokens if t in text_lower)


async def _get_reddit_token() -> str:
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent = os.getenv("REDDIT_USER_AGENT", "grolab-research-bot/0.1")
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=(client_id, client_secret),
            data={"grant_type": "client_credentials"},
            headers={"User-Agent": user_agent},
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def _fetch_one_reddit(
    client: httpx.AsyncClient, sub: str, query: str, token: Optional[str] = None
) -> list[RedditNeedPost]:
    if token:
        base_url = f"https://oauth.reddit.com/r/{sub}/search.json"
        headers = {"Authorization": f"bearer {token}", "User-Agent": "grolab-research-bot/0.1"}
    else:
        base_url = f"https://www.reddit.com/r/{sub}/search.json"
        headers = {}
    try:
        resp = await client.get(
            base_url,
            params={"q": f'"{query}"', "sort": "top", "t": "year", "limit": 25, "restrict_sr": 1},
            headers=headers,
        )
        resp.raise_for_status()
        posts = resp.json().get("data", {}).get("children", [])
    except Exception:
        return []

    logger.debug(f"reddit_fetch sub={sub} query={query!r} fetched={len(posts)} posts")

    out: list[RedditNeedPost] = []
    for post in posts:
        d = post.get("data", {})
        title = (d.get("title") or "").strip()
        selftext = (d.get("selftext") or "").strip()
        permalink = d.get("permalink", "")
        score = int(d.get("score") or 0)
        combined = f"{title} {selftext}"
        ws = _wish_score(combined)
        if ws == 0:
            continue
        final_score = int(score * (1 + ws))
        logger.debug(f"reddit_pass sub={sub} ws={ws} score={final_score} title={title[:80]!r}")
        out.append(
            RedditNeedPost(
                title=title,
                subreddit=sub,
                url=f"https://www.reddit.com{permalink}",
                score=final_score,
            )
        )

    logger.debug(f"reddit_filtered sub={sub} query={query!r} passed={len(out)}/{len(posts)}")
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
                topic_tokens = [w for w in topic.lower().split() if len(w) >= 4]
                if topic_tokens and not any(t in title.lower() for t in topic_tokens):
                    continue

                seen.add(url)
                posts.append(HNPost(title=title, url=url, score=score, comments=comments))

    posts.sort(key=lambda x: x.score + x.comments, reverse=True)
    return posts[:15]


async def _fetch_reddit_direct(topic: str) -> list[RedditNeedPost]:
    subreddits = os.getenv("REDDIT_SUBREDDITS", "SaaS,startups,Entrepreneur")
    subreddit_names = [s.strip() for s in subreddits.split(",") if s.strip()]
    queries = [
        topic,
        f"{topic} tool",
        f"{topic} problem",
    ]

    try:
        token: Optional[str] = await _get_reddit_token()
    except Exception as e:
        logger.warning(f"reddit_token_failed error={e}")
        token = None
    results: list[RedditNeedPost] = []

    async with httpx.AsyncClient(timeout=10, headers={"User-Agent": "grolab-research-bot/0.1"}) as client:
        tasks = [
            _fetch_one_reddit(client, sub, query, token)
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


async def _enrich_reddit_scores(posts: list[RedditNeedPost]) -> list[RedditNeedPost]:
    """Fetch real upvote scores for Reddit posts via the .json API."""
    async def _fetch_score(post: RedditNeedPost) -> RedditNeedPost:
        try:
            async with httpx.AsyncClient(timeout=5, headers={"User-Agent": "grolab-research-bot/0.1"}) as client:
                resp = await asyncio.wait_for(
                    client.get(f"{post.url}.json"),
                    timeout=5,
                )
                resp.raise_for_status()
                score = resp.json()[0]["data"]["children"][0]["data"]["score"]
                return post.model_copy(update={"score": int(score)})
        except Exception:
            return post

    enriched = await asyncio.gather(*[_fetch_score(p) for p in posts], return_exceptions=True)
    return [p if not isinstance(p, Exception) else posts[i] for i, p in enumerate(enriched)]


async def _fetch_reddit(topic: str) -> list[RedditNeedPost]:
    """Search Reddit posts via Google site search using SerpApi."""
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        return await _fetch_reddit_direct(topic)

    def _search_sync():
        from serpapi import GoogleSearch
        results = []
        queries = [
            f'site:reddit.com "{topic}" (need OR problem OR frustrated OR looking for)',
            f'site:reddit.com "{topic}" tool OR software OR alternative',
        ]
        for q in queries:
            search = GoogleSearch({"q": q, "api_key": api_key, "num": 15})
            data = search.get_dict()
            for r in data.get("organic_results", []):
                results.append({
                    "title": r.get("title", ""),
                    "url": r.get("link", ""),
                    "snippet": r.get("snippet", ""),
                })
        return results

    items = await asyncio.to_thread(_search_sync)

    out: list[RedditNeedPost] = []
    seen: set[str] = set()
    for item in items:
        title = item["title"].replace(" : ", " - ")
        url = item["url"]
        if not title or url in seen or "reddit.com" not in url:
            continue
        subreddit = ""
        m = re.search(r"reddit\.com/r/([^/]+)", url)
        if m:
            subreddit = m.group(1)
        seen.add(url)
        out.append(RedditNeedPost(title=title, subreddit=subreddit, url=url, score=0))

    out = await _enrich_reddit_scores(out[:20])
    out.sort(key=lambda x: x.score, reverse=True)
    return out



def _fetch_google_trends_sync(topic: str) -> list[TrendKeyword]:
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        raise RuntimeError("SERPAPI_API_KEY is missing")

    queries = [
        f"{topic} software",
        f"{topic} tool",
        f"best {topic} alternatives",
    ]

    tokens = [w for w in topic.lower().split() if len(w) >= 4]
    seen: set[str] = set()
    results: list[TrendKeyword] = []

    for q in queries:
        search = GoogleSearch({"q": q, "api_key": api_key, "num": 10})
        data = search.get_dict()
        for item in data.get("related_searches", []):
            kw = str(item.get("query") or "").strip()
            if not kw or kw in seen:
                continue
            if tokens and not any(t in kw.lower() for t in tokens):
                continue
            seen.add(kw)
            results.append(TrendKeyword(keyword=kw, value="related"))

        for item in data.get("related_questions", []):
            kw = str(item.get("question") or "").strip()
            if not kw or kw in seen:
                continue
            seen.add(kw)
            results.append(TrendKeyword(keyword=kw, value="question"))

    return results[:15]


async def _fetch_google_trends(topic: str) -> list[TrendKeyword]:
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_fetch_google_trends_sync, topic),
            timeout=25,
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

    app_store_fetcher = (_fetch_app_store_reviews if _use_apify() else None) if is_pro else None

    async def _tracked(coro, step: str, label: str):
        result = await coro
        if on_progress:
            count = len(result) if isinstance(result, list) else 0
            await on_progress(step, label, count)
        return result

    all_tasks: tuple = (
        _tracked(_fetch_product_hunt(topic), "producthunt_done", "Product Hunt"),
        _tracked(_fetch_reddit(topic), "reddit_done", "Reddit"),
        _tracked(_fetch_google_trends(topic), "trends_done", "Google Trends"),
        _tracked(_fetch_hn(topic), "hn_done", "Hacker News"),
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

    try:
        hn_posts = _result_or_raise(results[3])
    except Exception as error:
        logger.warning(f"market_research_hn_failed error={error} request_id={req_id}")
        source_errors.append("hn_unavailable")

    if app_store_fetcher and len(results) > 4:
        try:
            app_store_reviews = _result_or_raise(results[4])
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
