import asyncio
import logging
import os
from datetime import datetime, timezone, timedelta
import re

logger = logging.getLogger("grolab.guest_service")

GUEST_MAX_GENERATIONS = 1
TTL_HOURS = 24


def _parse_dt(ts: str) -> datetime:
    """Supabase'den gelen timestamp'i parse et (mikrosaniye tutarsızlıklarını tolere et)."""
    # Noktan sonraki rakamları tam olarak 6 haneye kırp/uzat
    ts = re.sub(r"\.(\d+)", lambda m: "." + (m.group(1) + "000000")[:6], ts)
    ts = ts.replace("Z", "+00:00")
    return datetime.fromisoformat(ts)


def _get_supabase_anon():
    from supabase import create_client
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not url or not key:
        raise RuntimeError("Supabase env vars missing")
    return create_client(url, key)


async def get_guest_count(token: str) -> int:
    try:
        sb = _get_supabase_anon()

        def _fetch():
            result = sb.table("guest_usage").select("count, created_at").eq("token", token).execute()
            rows = result.data or []
            if not rows:
                return 0
            row = rows[0]
            # 24h TTL kontrolü
            created = _parse_dt(row["created_at"])
            if datetime.now(timezone.utc) - created > timedelta(hours=TTL_HOURS):
                return 0  # Süresi dolmuş, yeni token gibi davran
            return row["count"]

        return await asyncio.to_thread(_fetch)
    except Exception as e:
        logger.warning(f"guest_get_count_failed token={token[:8]} error={e}")
        return 0


async def increment_guest_count(token: str) -> int:
    try:
        sb = _get_supabase_anon()

        def _upsert():
            existing = sb.table("guest_usage").select("count, created_at").eq("token", token).execute()
            rows = existing.data or []

            if rows:
                row = rows[0]
                created = _parse_dt(row["created_at"])
                expired = datetime.now(timezone.utc) - created > timedelta(hours=TTL_HOURS)

                if expired:
                    # Süresi dolmuş → sıfırdan başlat
                    sb.table("guest_usage").update({
                        "count": 1,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    }).eq("token", token).execute()
                    return 1
                else:
                    new_count = row["count"] + 1
                    sb.table("guest_usage").update({"count": new_count}).eq("token", token).execute()
                    return new_count
            else:
                sb.table("guest_usage").insert({
                    "token": token,
                    "count": 1,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }).execute()
                return 1

        return await asyncio.to_thread(_upsert)
    except Exception as e:
        logger.warning(f"guest_increment_failed token={token[:8]} error={e}")
        return 1


async def guest_can_generate(token: str) -> bool:
    count = await get_guest_count(token)
    return count < GUEST_MAX_GENERATIONS
