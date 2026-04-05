"""
Local test script for services/researcher.py
Usage: python test_researcher.py [topic]
"""
import asyncio
import json
import sys

from services.researcher import research_market


async def main():
    topic = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "email automation"
    print(f"\n=== Researching: '{topic}' ===\n")

    async def on_progress(step: str, label: str, count: int):
        print(f"  [{label}] done — {count} results")

    ctx = await research_market(topic, on_progress=on_progress, plan="pro")

    print(f"\n--- Product Hunt ({len(ctx.product_hunt_products)}) ---")
    for p in ctx.product_hunt_products[:5]:
        print(f"  {p.votes_count:>5} votes  {p.name} — {p.tagline[:60]}")

    print(f"\n--- Reddit ({len(ctx.reddit_needs)}) ---")
    for r in ctx.reddit_needs[:5]:
        print(f"  {r.score:>6}  r/{r.subreddit}  {r.title[:70]}")

    print(f"\n--- Hacker News ({len(ctx.hn_posts)}) ---")
    for h in ctx.hn_posts[:5]:
        print(f"  {h.score:>5} pts  {h.title[:70]}")

    print(f"\n--- Google Trends ({len(ctx.trend_keywords)}) ---")
    for t in ctx.trend_keywords[:5]:
        print(f"  {t.value:>10}  {t.keyword}")

    if ctx.source_errors:
        print(f"\n[!] Source errors: {ctx.source_errors}")

    print("\nDone.")


asyncio.run(main())
