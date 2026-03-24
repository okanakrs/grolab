from datetime import datetime, timezone
from asyncio import sleep
import logging
from dataclasses import dataclass
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from services.billing_service import consume_credit, get_credit_snapshot
from services.discovery_service import discover_backend_references
from services.idea_service import IdeaGenerationResult, SaaSIdea, generate_saas_ideas

router = APIRouter(tags=["discovery"])
logger = logging.getLogger("grolab.router.discovery")


@dataclass
class CreditGuardContext:
    user_id: str
    credits_remaining: int


async def require_credits(x_user_id: Optional[str] = Header(default=None)) -> CreditGuardContext:
    snapshot = get_credit_snapshot(x_user_id)
    if snapshot.credits_remaining <= 0:
        raise HTTPException(status_code=402, detail="No credits remaining")

    return CreditGuardContext(
        user_id=snapshot.user_id,
        credits_remaining=snapshot.credits_remaining,
    )


class IdeaRequest(BaseModel):
    topic: str


class IdeaResponse(BaseModel):
    ideas: list[SaaSIdea]
    market_evidence: list[str]
    trends: list[str]
    competitors: list[str]


@router.get("/mcp/discovery")
async def mcp_discovery() -> dict[str, object]:
    references = discover_backend_references()
    return {
        "references": references,
        "scanned_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/ideas/generate", response_model=IdeaResponse)
async def ideas_generate(
    payload: IdeaRequest,
    request: Request,
    credit_guard: CreditGuardContext = Depends(require_credits),
) -> IdeaResponse:
    await sleep(1.4)
    request_id = getattr(request.state, "request_id", "-")
    logger.info("ideas_generate_started request_id=%s", request_id)
    try:
        generation_result: IdeaGenerationResult = await generate_saas_ideas(payload.topic, request_id)
        logger.info(
            "ideas_generate_success request_id=%s ideas=%s evidence=%s",
            request_id,
            len(generation_result.ideas),
            len(generation_result.market_evidence),
        )

        consume_credit(credit_guard.user_id, amount=1)

        return IdeaResponse(
            ideas=generation_result.ideas,
            market_evidence=generation_result.market_evidence,
            trends=generation_result.trends,
            competitors=generation_result.competitors,
        )
    except RuntimeError as error:
        logger.exception("ideas_generate_failed request_id=%s", request_id)
        raise HTTPException(status_code=503, detail=str(error)) from error
