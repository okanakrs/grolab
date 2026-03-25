import logging
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel

from services.billing_service import consume_credit, get_credit_snapshot
from services.idea_service import IdeaGenerationResult, generate_saas_ideas

router = APIRouter(tags=["ideas"])
logger = logging.getLogger("grolab.router.ideas")


class GenerateRequest(BaseModel):
    topic: str


def _get_user_id(x_user_id: Optional[str]) -> str:
    if not x_user_id:
        return "demo-user"
    return x_user_id.strip() or "demo-user"


@router.post("/ideas/generate", response_model=IdeaGenerationResult)
async def generate_ideas(
    payload: GenerateRequest,
    request: Request,
    x_user_id: Optional[str] = Header(default=None),
) -> IdeaGenerationResult:
    user_id = _get_user_id(x_user_id)
    request_id: str = getattr(request.state, "request_id", "-")

    snapshot = get_credit_snapshot(user_id)
    if snapshot.credits_remaining <= 0:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    try:
        result = await generate_saas_ideas(payload.topic.strip() or "AI SaaS idea", request_id)
    except RuntimeError as error:
        logger.exception("idea_generation_failed user_id=%s request_id=%s", user_id, request_id)
        raise HTTPException(status_code=500, detail=str(error)) from error

    consume_credit(user_id)
    return result
