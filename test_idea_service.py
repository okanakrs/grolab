"""
Local test script for services/idea_service.py
Usage: python test_idea_service.py [topic]
"""
import asyncio
import sys

from services.idea_service import generate_saas_ideas


async def main():
    topic = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "email automation"
    plan = "pro"
    print(f"\n=== Generating ideas for: '{topic}' (plan={plan}) ===\n")

    async def on_progress(step: str, label: str, count: int):
        suffix = f" ({count} results)" if count else ""
        print(f"  [{step}] {label}{suffix}")

    result = await generate_saas_ideas(
        topic=topic,
        request_id="test-local",
        idea_count=3,
        on_progress=on_progress,
        plan=plan,
    )

    print(f"\n{'='*60}")
    print(f"Generated {len(result.ideas)} ideas")
    print(f"{'='*60}")

    for i, idea in enumerate(result.ideas, 1):
        print(f"\n--- Idea {i}: {idea.isim} ---")
        print(f"  MRR Potential : {idea.tahmini_mrr_potansiyeli}")
        print(f"  Problem       : {idea.problem[:120]}")
        print(f"  Solution      : {idea.cozum[:120]}")
        print(f"  Target        : {idea.hedef_kitle}")

    print(f"\n--- Market Evidence ({len(result.market_evidence)}) ---")
    for e in result.market_evidence:
        print(f"  {e}")

    print(f"\n--- Trends ({len(result.trends)}) ---")
    for t in result.trends:
        print(f"  {t}")

    print(f"\n--- Competitors ({len(result.competitors)}) ---")
    for c in result.competitors:
        print(f"  {c}")

    print("\nDone.")


asyncio.run(main())
