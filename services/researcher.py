import asyncio
import html
import logging
import os
import re
import time
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
    year: int = 0


class RedditNeedPost(BaseModel):
    title: str
    subreddit: str
    url: str
    score: int
    snippet: str = ""


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
    kind: str = "story"


class MarketContext(BaseModel):
    topic: str
    product_hunt_products: list[ProductHuntProduct]
    reddit_needs: list[RedditNeedPost]
    trend_keywords: list[TrendKeyword]
    app_store_reviews: list[AppStoreReview] = []
    hn_posts: list[HNPost] = []
    source_errors: list[str]


_PH_API = "https://api.producthunt.com/v2/api/graphql"
_PH_TOKEN_URL = "https://api.producthunt.com/v2/oauth/token"
_PH_CACHE_TTL = 6 * 3600
_ph_cache: dict[str, Any] = {"at": 0.0, "posts": []}

_PH_QUERY = """
query($after: String, $postedAfter: DateTime) {
  posts(first: 20, after: $after, order: VOTES, postedAfter: $postedAfter) {
    edges { node { name tagline votesCount url createdAt } }
    pageInfo { hasNextPage endCursor }
  }
}
"""


async def _ph_access_token(client: httpx.AsyncClient) -> str:
    token = os.getenv("PRODUCT_HUNT_TOKEN")
    if token:
        return token
    client_id = os.getenv("PRODUCT_HUNT_CLIENT_ID")
    client_secret = os.getenv("PRODUCT_HUNT_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise RuntimeError("Product Hunt API credentials are missing")
    resp = await client.post(
        _PH_TOKEN_URL,
        json={"client_id": client_id, "client_secret": client_secret, "grant_type": "client_credentials"},
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


async def _ph_recent_top_posts() -> list[ProductHuntProduct]:
    """Son 1 yilin en cok oy alan Product Hunt postlari (konudan bagimsiz, 6 saat onbellekli)."""
    if _ph_cache["posts"] and time.time() - _ph_cache["at"] < _PH_CACHE_TTL:
        return _ph_cache["posts"]
    if time.time() < _ph_cache.get("retry_after", 0.0):
        raise RuntimeError("Product Hunt API cooling down after a failure")

    from datetime import datetime, timedelta, timezone

    posted_after = (datetime.now(timezone.utc) - timedelta(days=365)).isoformat()
    posts: list[ProductHuntProduct] = []
    async with httpx.AsyncClient(timeout=20) as client:
        headers = {"Authorization": f"Bearer {await _ph_access_token(client)}", "Content-Type": "application/json"}
        cursor: Optional[str] = None
        for _ in range(25):
            resp = await client.post(
                _PH_API,
                headers=headers,
                json={"query": _PH_QUERY, "variables": {"after": cursor, "postedAfter": posted_after}},
            )
            if resp.status_code == 429 and posts:
                # Rate limit: elimizdekini kullan, 10 dk sonra tekrar dene
                logger.warning(f"product_hunt_rate_limited kept={len(posts)}")
                _ph_cache["retry_after"] = time.time() + 600
                break
            if resp.status_code == 429:
                _ph_cache["retry_after"] = time.time() + 600
            resp.raise_for_status()
            data = resp.json()
            if data.get("errors"):
                raise RuntimeError(f"Product Hunt API error: {data['errors'][0].get('message')}")
            page = data["data"]["posts"]
            for edge in page["edges"]:
                node = edge["node"]
                posts.append(
                    ProductHuntProduct(
                        name=(node.get("name") or "").strip(),
                        tagline=(node.get("tagline") or "").strip(),
                        url=node.get("url") or "",
                        votes_count=int(node.get("votesCount") or 0),
                        year=int(str(node.get("createdAt") or "0")[:4] or 0),
                    )
                )
            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]

    _ph_cache.update(at=time.time(), posts=posts)
    return posts


async def _fetch_product_hunt(topic: str) -> list[ProductHuntProduct]:
    if os.getenv("PRODUCT_HUNT_TOKEN") or (os.getenv("PRODUCT_HUNT_CLIENT_ID") and os.getenv("PRODUCT_HUNT_CLIENT_SECRET")):
        try:
            tokens = [w for w in re.sub(r"[^a-z0-9 ]", " ", topic.lower()).split() if len(w) >= 3]
            matched = [
                p for p in await _ph_recent_top_posts()
                if any(re.search(r"\b" + re.escape(t) + r"\b", f"{p.name} {p.tagline}".lower()) for t in tokens)
            ]
            if matched:
                return matched[:15]
        except Exception as error:
            logger.warning(f"product_hunt_api_failed error={error}, falling back to archive")
    return await _fetch_product_hunt_archive(topic)


async def _fetch_product_hunt_archive(topic: str) -> list[ProductHuntProduct]:
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
        url = hit.get("url") or hit.get("shortened_url") or hit.get("redirect_url") or hit.get("discussion_url") or ""
        if url.startswith("/"):
            url = f"https://www.producthunt.com{url}"
        year = int(str(hit.get("created_at") or "0")[:4] or 0)
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
                year=year,
            )
        )

    # Oy sayısına göre sırala
    products.sort(key=lambda p: p.votes_count, reverse=True)
    return products[:15]


_ITUNES_SEARCH = "https://itunes.apple.com/search"
_ITUNES_REVIEWS = "https://itunes.apple.com/us/rss/customerreviews/id={app_id}/sortBy=mostRecent/json"


async def _fetch_app_reviews(client: httpx.AsyncClient, app_id: str, app_name: str) -> list[AppStoreReview]:
    try:
        resp = await client.get(_ITUNES_REVIEWS.format(app_id=app_id), follow_redirects=True)
        resp.raise_for_status()
        entries = resp.json().get("feed", {}).get("entry") or []
    except Exception:
        return []
    if isinstance(entries, dict):
        entries = [entries]

    out: list[AppStoreReview] = []
    for entry in entries:
        try:
            rating = int(entry["im:rating"]["label"])
            title = entry["title"]["label"].strip()
            content = entry["content"]["label"].strip()
        except (KeyError, ValueError, TypeError, AttributeError):
            continue
        if rating > 3:
            continue
        out.append(AppStoreReview(app_name=app_name, review=f"{title}: {content}"[:300], rating=rating, app_id=app_id))
    return out


async def _fetch_app_store_reviews(topic: str) -> list[AppStoreReview]:
    """Gercek dusuk puanli (<=3 yildiz) App Store yorumlari: iTunes Search + customer reviews RSS (ucretsiz)."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            _ITUNES_SEARCH,
            params={"term": topic, "entity": "software", "limit": 6, "country": "us"},
        )
        resp.raise_for_status()
        apps = resp.json().get("results", [])
        batches = await asyncio.gather(
            *[_fetch_app_reviews(client, str(a["trackId"]), a.get("trackName", "")) for a in apps if a.get("trackId")]
        )
    return [review for batch in batches for review in batch][:15]


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


_HN_COMMENT_WISH_RE = re.compile(
    r"\b(i wish|i need|we need|looking for|is there (a|an|any)|anyone (know|use|built)|alternative to|"
    r"pain point|struggl\w+|frustrat\w+|annoying|too expensive|can'?t find|no good|doesn'?t (work|scale))\b",
    re.I,
)
_HN_TAG_RE = re.compile(r"<[^>]+>")


def _hn_clean(text: str) -> str:
    return re.sub(r"\s+", " ", _HN_TAG_RE.sub(" ", html.unescape(text))).strip()


async def _hn_search(client: httpx.AsyncClient, query: str, tags: str, since: int, min_points: int = 0) -> list[dict]:
    filters = f"created_at_i>{since}" + (f",points>{min_points}" if min_points else "")
    try:
        resp = await client.get(
            "https://hn.algolia.com/api/v1/search",
            params={"query": query, "tags": tags, "hitsPerPage": 50, "numericFilters": filters},
        )
        resp.raise_for_status()
        return resp.json().get("hits", [])
    except Exception:
        return []


async def _fetch_hn(topic: str) -> list[HNPost]:
    """Hacker News Algolia API (ucretsiz, auth yok): son 1 yilin ilgili story'leri + gercek kullanici yorumlari."""
    since = int(time.time()) - 365 * 24 * 3600
    tokens = [w for w in re.sub(r"[^a-z0-9 ]", " ", topic.lower()).split() if len(w) >= 3]

    def _on_topic(text: str) -> bool:
        low = text.lower()
        return not tokens or any(t in low for t in tokens)

    async with httpx.AsyncClient(timeout=15) as client:
        stories, asks, comments = await asyncio.gather(
            _hn_search(client, topic, "story", since, min_points=1),
            _hn_search(client, topic, "ask_hn", since),
            _hn_search(client, topic, "comment", since),
        )

    posts: list[HNPost] = []
    seen: set[str] = set()

    for hit in [*stories, *asks]:
        title = (hit.get("title") or "").strip()
        url = f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}"
        if not title or url in seen or not _on_topic(title):
            continue
        seen.add(url)
        posts.append(HNPost(title=title, url=url, score=int(hit.get("points") or 0), comments=int(hit.get("num_comments") or 0)))

    posts.sort(key=lambda x: x.score + x.comments, reverse=True)
    posts = posts[:10]

    # Yorumlar: konu + ihtiyac/sikayet dili iceren gercek kullanici sozleri
    voiced: list[HNPost] = []
    for hit in comments:
        text = _hn_clean(hit.get("comment_text") or "")
        url = f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}"
        if len(text) < 40 or url in seen or not _on_topic(text) or not _HN_COMMENT_WISH_RE.search(text):
            continue
        # "Who is hiring / wants to be hired" is parcalarini ele
        if any(marker in text for marker in ("Location:", "Remote:", "Willing to relocate", "Technologies:", "Résumé", "Resume/CV", "Full-time", "Full time", "| Remote", "Remote (", "is hiring", "We're hiring")):
            continue
        seen.add(url)
        voiced.append(HNPost(title=text[:220], url=url, score=0, comments=0, kind="comment"))

    return posts + voiced[:5]


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
    """Reddit OAuth ile gercek puanlari tek istekte cek. Kimlik bilgisi gecersizse puanlar 0 kalir."""
    ids = {m.group(1): p for p in posts if (m := re.search(r"/comments/([a-z0-9]+)/", p.url))}
    if not ids:
        return posts
    try:
        token = await _get_reddit_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://oauth.reddit.com/api/info",
                params={"id": ",".join(f"t3_{i}" for i in ids)},
                headers={"Authorization": f"bearer {token}", "User-Agent": os.getenv("REDDIT_USER_AGENT", "grolab-research-bot/0.1")},
            )
            resp.raise_for_status()
            scores = {c["data"]["id"]: int(c["data"].get("score") or 0) for c in resp.json()["data"]["children"]}
    except Exception as error:
        logger.warning(f"reddit_score_enrich_failed error={error}")
        return posts
    return [p.model_copy(update={"score": scores.get(i, p.score)}) for i, p in ids.items()] + [
        p for p in posts if p not in ids.values()
    ]


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

    wishful: list[RedditNeedPost] = []
    other: list[RedditNeedPost] = []
    seen: set[str] = set()
    for item in items:
        title = item["title"].replace(" : ", " - ")
        snippet = (item.get("snippet") or "").strip()
        url = item["url"]
        if not title or url in seen or "reddit.com" not in url:
            continue
        subreddit = ""
        m = re.search(r"reddit\.com/r/([^/]+)", url)
        if m:
            subreddit = m.group(1)
        seen.add(url)
        post = RedditNeedPost(title=title, subreddit=subreddit, url=url, score=0, snippet=snippet[:200])
        # Sadece gercek ihtiyac/sikayet dili iceren basliklari one al; puan Reddit'ten alinamadigi icin 0 kalir
        (wishful if _wish_score(f"{title} {snippet}") > 0 else other).append(post)

    picked = (wishful + other)[:15] if len(wishful) < 3 else wishful[:15]
    picked = await _enrich_reddit_scores(picked)
    picked.sort(key=lambda x: x.score, reverse=True)
    return picked



def _trend_candidates(topic: str) -> list[str]:
    """Google Trends dar ifadelerde veri vermez: tam konu, sonra son iki kelime, sonra son kelime (ana isim)."""
    words = [w for w in re.sub(r"[^a-z0-9 ]", " ", topic.lower()).split() if len(w) >= 3]
    candidates = [topic.strip()]
    if len(words) >= 3:
        candidates.append(" ".join(words[-2:]))
    if len(words) >= 2:
        candidates.append(words[-1])
    seen: set[str] = set()
    return [c for c in candidates if c and not (c.lower() in seen or seen.add(c.lower()))]


def _interest_change(timeline: list[dict]) -> Optional[int]:
    """Son 13 haftanin ortalamasi ile ilk 13 haftanin ortalamasi arasindaki yuzde degisim (eksik son hafta haric)."""
    values = [
        int(point["values"][0].get("extracted_value") or 0)
        for point in timeline
        if point.get("values") and not point.get("partial_data")
    ]
    if len(values) < 26:
        return None
    first, last = sum(values[:13]) / 13, sum(values[-13:]) / 13
    if first <= 0:
        return None
    return round((last - first) / first * 100)


def _fetch_google_trends_sync(topic: str) -> list[TrendKeyword]:
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        raise RuntimeError("SERPAPI_API_KEY is missing")

    def _trends(q: str, data_type: str) -> dict:
        return GoogleSearch(
            {"engine": "google_trends", "q": q, "data_type": data_type, "date": "today 12-m", "api_key": api_key}
        ).get_dict()

    results: list[TrendKeyword] = []
    seen: set[str] = set()

    for query in _trend_candidates(topic):
        needed = [w for w in re.sub(r"[^a-z0-9 ]", " ", query.lower()).split() if len(w) >= 3]
        related = _trends(query, "RELATED_QUERIES").get("related_queries") or {}
        if not related:
            continue

        # Sorgulanan kelimelerin hepsini iceren sonuclar alakali sayilir ("lidl near me" gibi gurultu elenir)
        def _relevant(kw: str) -> bool:
            return all(w in kw.lower() for w in needed)

        for item in related.get("rising", []):
            kw = str(item.get("query") or "").strip()
            if kw and kw not in seen and _relevant(kw):
                seen.add(kw)
                results.append(TrendKeyword(keyword=kw, value=f"rising {item.get('value', '')}".strip()))
        for item in related.get("top", []):
            kw = str(item.get("query") or "").strip()
            if kw and kw not in seen and _relevant(kw):
                seen.add(kw)
                results.append(TrendKeyword(keyword=kw, value=f"interest {item.get('value', '')}/100"))

        if results:
            try:
                timeline = _trends(query, "TIMESERIES").get("interest_over_time", {}).get("timeline_data", [])
                change = _interest_change(timeline)
            except Exception:
                change = None
            if change is not None:
                results.insert(
                    0,
                    TrendKeyword(keyword=f'"{query}" 12-month search interest', value=f"{change:+d}% (last 3 months vs first 3 months)"),
                )
            break

    if not results:
        # Gercek trend verisi yok: Google'in ilgili aramalarina dus ve acikca etiketle
        tokens = [w for w in re.sub(r"[^a-z0-9 ]", " ", topic.lower()).split() if len(w) >= 3]
        data = GoogleSearch({"q": f"{topic} software", "api_key": api_key, "num": 10}).get_dict()
        for item in data.get("related_searches", []):
            kw = str(item.get("query") or "").strip()
            if kw and kw not in seen and (not tokens or any(t in kw.lower() for t in tokens)):
                seen.add(kw)
                results.append(TrendKeyword(keyword=kw, value="related search"))

    # Sira: 12 aylik degisim, en cok aranan sorgular, yukselenler
    results.sort(key=lambda r: 0 if "12-month" in r.keyword else 1 if r.value.startswith("interest") else 2)
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


async def research_market(
    topic: str,
    request_id: Optional[str] = None,
    on_progress: Optional[ProgressCallback] = None,
    plan: str = "free",
) -> MarketContext:
    req_id = request_id or "-"
    is_pro = plan in ("pro", "enterprise")
    logger.info(f"market_research_started topic={topic} request_id={req_id} plan={plan}")

    app_store_fetcher = _fetch_app_store_reviews if is_pro else None

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
