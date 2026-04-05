import asyncio
import logging
import threading
from dataclasses import dataclass
from typing import Optional, Union

logger = logging.getLogger("grolab.billing_service")

PLAN_TOTAL_CREDITS = {
    "free": 10,
    "pro": 100,
    "enterprise": 1000,
}

_DEFAULT_USER_ID = "demo-user"
_lock = threading.RLock()
_demo_state: dict[str, dict[str, Union[int, str]]] = {}


@dataclass
class CreditSnapshot:
    user_id: str
    plan: str
    credits_remaining: int
    credits_total: int


def _normalize_user_id(user_id: Optional[str]) -> str:
    if not user_id:
        return _DEFAULT_USER_ID
    return user_id.strip() or _DEFAULT_USER_ID


def _is_demo(user_id: str) -> bool:
    return user_id == _DEFAULT_USER_ID


def _ensure_demo_user(user_id: str) -> dict[str, Union[int, str]]:
    with _lock:
        if user_id not in _demo_state:
            _demo_state[user_id] = {
                "plan": "free",
                "credits_total": PLAN_TOTAL_CREDITS["free"],
                "credits_remaining": PLAN_TOTAL_CREDITS["free"],
            }
        return _demo_state[user_id]


async def get_credit_snapshot(user_id: Optional[str]) -> CreditSnapshot:
    uid = _normalize_user_id(user_id)

    if _is_demo(uid):
        data = _ensure_demo_user(uid)
        return CreditSnapshot(
            user_id=uid,
            plan=str(data["plan"]),
            credits_remaining=int(data["credits_remaining"]),
            credits_total=int(data["credits_total"]),
        )

    try:
        from services.supabase_client import get_supabase
        sb = get_supabase()

        def _fetch() -> dict:
            return sb.table("profiles").select("plan,credits_remaining,credits_total").eq("id", uid).single().execute().data

        row = await asyncio.to_thread(_fetch)
        return CreditSnapshot(
            user_id=uid,
            plan=row["plan"],
            credits_remaining=row["credits_remaining"],
            credits_total=row["credits_total"],
        )
    except Exception:
        logger.warning(f"profiles_fetch_failed user_id={uid}, returning defaults")
        return CreditSnapshot(user_id=uid, plan="free", credits_remaining=10, credits_total=10)


async def consume_credit(user_id: Optional[str], amount: int = 1) -> bool:
    uid = _normalize_user_id(user_id)

    if _is_demo(uid):
        with _lock:
            data = _ensure_demo_user(uid)
            remaining = int(data["credits_remaining"])
            if remaining < amount:
                return False
            data["credits_remaining"] = remaining - amount
            return True

    try:
        from services.supabase_client import get_supabase
        sb = get_supabase()

        def _consume() -> bool:
            result = sb.rpc("consume_credits", {"p_user_id": uid, "p_amount": amount}).execute()
            return bool(result.data)

        return await asyncio.to_thread(_consume)
    except Exception:
        logger.exception(f"consume_credit_failed user_id={uid}")
        return False


async def apply_plan_credits(user_id: Optional[str], plan: str) -> CreditSnapshot:
    uid = _normalize_user_id(user_id)
    plan_key = plan if plan in PLAN_TOTAL_CREDITS else "free"
    total = PLAN_TOTAL_CREDITS[plan_key]

    if _is_demo(uid):
        with _lock:
            data = _ensure_demo_user(uid)
            data["plan"] = plan_key
            data["credits_total"] = total
            data["credits_remaining"] = total
        return await get_credit_snapshot(uid)

    try:
        from services.supabase_client import get_supabase
        sb = get_supabase()

        def _update() -> None:
            from datetime import datetime, timezone
            sb.table("profiles").update(
                {"plan": plan_key, "credits_total": total, "credits_remaining": total, "updated_at": datetime.now(timezone.utc).isoformat()}
            ).eq("id", uid).execute()

        await asyncio.to_thread(_update)
    except Exception:
        logger.warning(f"apply_plan_credits_failed user_id={uid}")
    return await get_credit_snapshot(uid)
