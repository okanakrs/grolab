import asyncio
import logging
import os
from typing import Optional

import stripe
from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel

from services.billing_service import apply_plan_credits, get_credit_snapshot

router = APIRouter(tags=["billing"])
logger = logging.getLogger("grolab.router.billing")


class CheckoutRequest(BaseModel):
    plan: str


class CheckoutResponse(BaseModel):
    checkout_url: str


class CreditsResponse(BaseModel):
    user_id: str
    plan: str
    credits_remaining: int
    credits_total: int


def _get_user_id(x_user_id: Optional[str]) -> str:
    if not x_user_id:
        return "demo-user"
    return x_user_id.strip() or "demo-user"


async def _upsert_subscription(
    user_id: str,
    plan: str,
    stripe_customer_id: Optional[str],
    stripe_subscription_id: Optional[str],
) -> None:
    from services.supabase_client import get_supabase

    sb = get_supabase()

    def _upsert() -> None:
        sb.table("stripe_subscriptions").upsert(
            {
                "user_id": user_id,
                "plan": plan,
                "status": "active",
                "stripe_customer_id": stripe_customer_id,
                "stripe_subscription_id": stripe_subscription_id,
            },
            on_conflict="stripe_subscription_id",
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


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    payload: CheckoutRequest,
    x_user_id: Optional[str] = Header(default=None),
) -> CheckoutResponse:
    stripe_secret = os.getenv("STRIPE_SECRET_KEY")
    if not stripe_secret:
        raise HTTPException(status_code=500, detail="Missing STRIPE_SECRET_KEY")

    if payload.plan not in {"pro", "enterprise"}:
        raise HTTPException(status_code=400, detail="Plan must be pro or enterprise")

    price_env_key = "STRIPE_PRICE_PRO" if payload.plan == "pro" else "STRIPE_PRICE_ENTERPRISE"
    price_id = os.getenv(price_env_key)
    if not price_id:
        raise HTTPException(status_code=500, detail=f"Missing {price_env_key}")

    stripe.api_key = stripe_secret

    frontend_url = os.getenv("FRONTEND_BASE_URL", "http://127.0.0.1:3000")
    user_id = _get_user_id(x_user_id)

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{frontend_url}/pricing?checkout=success",
            cancel_url=f"{frontend_url}/pricing?checkout=cancel",
            metadata={
                "user_id": user_id,
                "plan": payload.plan,
            },
        )
    except Exception as error:
        logger.exception(f"checkout_session_create_failed user_id={user_id}")
        raise HTTPException(status_code=500, detail="Failed to create Stripe session") from error

    checkout_url = session.get("url")
    if not checkout_url:
        raise HTTPException(status_code=500, detail="Stripe did not return checkout URL")

    return CheckoutResponse(checkout_url=checkout_url)


@router.post("/webhook")
async def stripe_webhook(request: Request) -> dict[str, bool]:
    stripe_secret = os.getenv("STRIPE_SECRET_KEY")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not stripe_secret or not webhook_secret:
        raise HTTPException(status_code=500, detail="Stripe webhook secrets are missing")

    stripe.api_key = stripe_secret

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from error
    except stripe.error.SignatureVerificationError as error:
        raise HTTPException(status_code=400, detail="Invalid webhook signature") from error

    if event.get("type") == "checkout.session.completed":
        session = event.get("data", {}).get("object", {})
        metadata = session.get("metadata", {})
        user_id = metadata.get("user_id", "demo-user")
        plan = metadata.get("plan", "free")
        snapshot = await apply_plan_credits(user_id, plan)
        logger.info(
            "checkout_completed user_id=%s plan=%s credits=%s",
            snapshot.user_id,
            snapshot.plan,
            snapshot.credits_remaining,
        )

        if user_id != "demo-user":
            await _upsert_subscription(
                user_id=user_id,
                plan=plan,
                stripe_customer_id=session.get("customer"),
                stripe_subscription_id=session.get("subscription"),
            )

    return {"received": True}
