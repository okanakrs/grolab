import threading
from dataclasses import dataclass
from typing import Optional, Union

PLAN_TOTAL_CREDITS = {
    "free": 10,
    "pro": 100,
    "enterprise": 1000,
}

_DEFAULT_USER_ID = "demo-user"
_lock = threading.Lock()
_state: dict[str, dict[str, Union[int, str]]] = {}


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


def _ensure_user(user_id: str) -> dict[str, Union[int, str]]:
    with _lock:
        if user_id not in _state:
            _state[user_id] = {
                "plan": "free",
                "credits_total": PLAN_TOTAL_CREDITS["free"],
                "credits_remaining": PLAN_TOTAL_CREDITS["free"],
            }
        return _state[user_id]


def get_credit_snapshot(user_id: Optional[str]) -> CreditSnapshot:
    normalized_user_id = _normalize_user_id(user_id)
    user_data = _ensure_user(normalized_user_id)
    return CreditSnapshot(
        user_id=normalized_user_id,
        plan=str(user_data["plan"]),
        credits_remaining=int(user_data["credits_remaining"]),
        credits_total=int(user_data["credits_total"]),
    )


def consume_credit(user_id: Optional[str], amount: int = 1) -> bool:
    normalized_user_id = _normalize_user_id(user_id)
    with _lock:
        user_data = _ensure_user(normalized_user_id)
        remaining = int(user_data["credits_remaining"])
        if remaining < amount:
            return False
        user_data["credits_remaining"] = remaining - amount
        return True


def apply_plan_credits(user_id: Optional[str], plan: str) -> CreditSnapshot:
    normalized_user_id = _normalize_user_id(user_id)
    plan_key = plan if plan in PLAN_TOTAL_CREDITS else "free"
    total = PLAN_TOTAL_CREDITS[plan_key]

    with _lock:
        user_data = _ensure_user(normalized_user_id)
        user_data["plan"] = plan_key
        user_data["credits_total"] = total
        user_data["credits_remaining"] = total

    return get_credit_snapshot(normalized_user_id)
