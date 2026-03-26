import asyncio
import json
import logging
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Header, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.billing_service import consume_credit, get_credit_snapshot
from services.idea_service import IdeaGenerationResult, generate_saas_ideas

router = APIRouter(tags=["ideas"])
logger = logging.getLogger("grolab.router.ideas")


class GenerateRequest(BaseModel):
    topic: str
    idea_count: int = 3


def _get_user_id(x_user_id: Optional[str]) -> str:
    if not x_user_id:
        return "demo-user"
    return x_user_id.strip() or "demo-user"


async def _save_ideas(user_id: str, topic: str, result: IdeaGenerationResult) -> None:
    try:
        from services.supabase_client import get_supabase
        sb = get_supabase()

        def _insert() -> None:
            sb.table("generated_ideas").insert({
                "user_id": user_id,
                "topic": topic,
                "ideas": [idea.model_dump() for idea in result.ideas],
                "market_evidence": result.market_evidence,
                "trends": result.trends,
                "competitors": result.competitors,
            }).execute()

        await asyncio.to_thread(_insert)
    except Exception:
        logger.warning(f"save_ideas_failed user_id={user_id}")


class SavedIdea(BaseModel):
    id: str
    topic: str
    ideas: list
    market_evidence: list
    trends: list
    competitors: list
    created_at: str


@router.get("/ideas/history", response_model=list[SavedIdea])
async def get_idea_history(
    x_user_id: Optional[str] = Header(default=None),
) -> list[SavedIdea]:
    user_id = _get_user_id(x_user_id)
    if user_id == "demo-user":
        return []

    try:
        from services.supabase_client import get_supabase
        sb = get_supabase()

        def _fetch():
            return (
                sb.table("generated_ideas")
                .select("id, topic, ideas, market_evidence, trends, competitors, created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(50)
                .execute()
            )

        result = await asyncio.to_thread(_fetch)
        return [SavedIdea(**row) for row in (result.data or [])]
    except Exception:
        logger.warning(f"get_idea_history_failed user_id={user_id}")
        raise HTTPException(status_code=500, detail="Could not fetch idea history")


@router.get("/ideas/stream")
async def stream_ideas(
    topic: str = Query(default=""),
    idea_count: int = Query(default=3, ge=1, le=3),
    x_user_id: Optional[str] = Header(default=None),
) -> StreamingResponse:
    user_id = _get_user_id(x_user_id)
    request_id = str(uuid4())
    idea_count = max(1, min(idea_count, 3))

    snapshot = await get_credit_snapshot(user_id)
    if snapshot.credits_remaining < idea_count:
        async def _error():
            yield f"data: {json.dumps({'step': 'error', 'message': 'Insufficient credits', 'status': 402})}\n\n"
        return StreamingResponse(_error(), media_type="text/event-stream")

    queue: asyncio.Queue = asyncio.Queue()

    async def _on_progress(step: str, message: str, count: int) -> None:
        await queue.put({"step": step, "message": message, "count": count})

    async def _run() -> None:
        try:
            result = await generate_saas_ideas(
                topic.strip() or "AI SaaS idea",
                request_id,
                idea_count,
                on_progress=_on_progress,
            )
            await consume_credit(user_id, amount=idea_count)
            if user_id != "demo-user":
                await _save_ideas(user_id, topic, result)
            await queue.put({"step": "done", **result.model_dump()})
        except Exception as error:
            logger.exception(f"stream_ideas_failed user_id={user_id}")
            await queue.put({"step": "error", "message": str(error), "status": 500})
        finally:
            await queue.put(None)

    asyncio.create_task(_run())

    async def _event_stream():
        while True:
            item = await queue.get()
            if item is None:
                break
            yield f"data: {json.dumps(item, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        _event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/ideas/generate", response_model=IdeaGenerationResult)
async def generate_ideas(
    payload: GenerateRequest,
    request: Request,
    x_user_id: Optional[str] = Header(default=None),
) -> IdeaGenerationResult:
    user_id = _get_user_id(x_user_id)
    request_id: str = getattr(request.state, "request_id", "-")

    idea_count = max(1, min(payload.idea_count, 3))
    snapshot = await get_credit_snapshot(user_id)
    if snapshot.credits_remaining < idea_count:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    try:
        result = await generate_saas_ideas(payload.topic.strip() or "AI SaaS idea", request_id, idea_count)
    except RuntimeError as error:
        logger.exception(f"idea_generation_failed user_id={user_id} request_id={request_id}")
        raise HTTPException(status_code=500, detail=str(error)) from error

    await consume_credit(user_id, amount=idea_count)

    if user_id != "demo-user":
        await _save_ideas(user_id, payload.topic, result)

    return result
