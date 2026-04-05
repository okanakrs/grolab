import asyncio
import hashlib
import hmac
import json
import logging
import os
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel

from services.billing_service import apply_plan_credits, get_credit_snapshot

router = APIRouter(tags=["billing"])
logger = logging.getLogger("grolab.router.billing")


class CreditsResponse(BaseModel):
    user_id: str
    plan: str
    credits_remaining: int
    credits_total: int


def _get_user_id(x_user_id: Optional[str]) -> str:
    if not x_user_id:
        return "demo-user"
    return x_user_id.strip() or "demo-user"


def _verify_paddle_signature(payload: bytes, signature_header: str, secret: str) -> bool:
    """Paddle webhook signature verification (HMAC-SHA256)."""
    try:
        parts = dict(part.split("=", 1) for part in signature_header.split(";"))
        ts = parts.get("ts", "")
        h1 = parts.get("h1", "")
        signed_payload = f"{ts}:{payload.decode('utf-8')}"
        expected = hmac.new(secret.encode("utf-8"), signed_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, h1)
    except Exception:
        return False


def _plan_from_price_id(price_id: str) -> str:
    """Map Paddle price ID to internal plan name."""
    if price_id in {os.getenv("PADDLE_PRICE_PRO", ""), os.getenv("PADDLE_PRICE_PRO_YEARLY", "")}:
        return "pro"
    if price_id in {os.getenv("PADDLE_PRICE_ENTERPRISE", ""), os.getenv("PADDLE_PRICE_ENTERPRISE_YEARLY", "")}:
        return "enterprise"
    return "free"


async def _upsert_subscription(
    user_id: str,
    plan: str,
    paddle_customer_id: Optional[str],
    paddle_subscription_id: Optional[str],
) -> None:
    from services.supabase_client import get_supabase

    sb = get_supabase()

    def _upsert() -> None:
        sb.table("paddle_subscriptions").upsert(
            {
                "user_id": user_id,
                "plan": plan,
                "status": "active",
                "paddle_customer_id": paddle_customer_id,
                "paddle_subscription_id": paddle_subscription_id,
            },
            on_conflict="paddle_subscription_id",
        ).execute()

    try:
        await asyncio.to_thread(_upsert)
    except Exception:
        logger.warning(f"upsert_subscription_failed user_id={user_id}")


@router.get("/credits", response_model=CreditsResponse)
async def get_credits(x_user_id: Optional[str] = Header(default=None)) -> CreditsResponse:
    snapshot = await get_credit_snapshot(_get_user_id(x_user_id))
    return CreditsResponse(
        user_id=snapshot.user_id,
        plan=snapshot.plan,
        credits_remaining=snapshot.credits_remaining,
        credits_total=snapshot.credits_total,
    )


@router.post("/webhook")
async def paddle_webhook(request: Request) -> dict[str, bool]:
    webhook_secret = os.getenv("PADDLE_WEBHOOK_SECRET")
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Missing PADDLE_WEBHOOK_SECRET")

    payload = await request.body()
    signature_header = request.headers.get("paddle-signature", "")

    if not _verify_paddle_signature(payload, signature_header, webhook_secret):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event = json.loads(payload)
    except json.JSONDecodeError as error:
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from error

    event_type = event.get("event_type", "")
    logger.info(f"paddle_webhook event_type={event_type}")

    # Handle completed transaction (one-time or first subscription payment)
    if event_type == "transaction.completed":
        data = event.get("data", {})
        custom_data = data.get("custom_data") or {}
        user_id = custom_data.get("user_id", "demo-user")

        # Get plan from the first line item's price ID
        items = data.get("items", [])
        price_id = items[0].get("price", {}).get("id", "") if items else ""
        plan = _plan_from_price_id(price_id)

        snapshot = await apply_plan_credits(user_id, plan)
        logger.info(
            "transaction_completed user_id=%s plan=%s credits=%s",
            snapshot.user_id,
            snapshot.plan,
            snapshot.credits_remaining,
        )

        if user_id != "demo-user":
            await _upsert_subscription(
                user_id=user_id,
                plan=plan,
                paddle_customer_id=data.get("customer_id"),
                paddle_subscription_id=data.get("subscription_id"),
            )

    # Handle subscription renewal
    elif event_type == "subscription.activated":
        data = event.get("data", {})
        custom_data = data.get("custom_data") or {}
        user_id = custom_data.get("user_id", "demo-user")
        items = data.get("items", [])
        price_id = items[0].get("price", {}).get("id", "") if items else ""
        plan = _plan_from_price_id(price_id)
        await apply_plan_credits(user_id, plan)

    return {"received": True}
