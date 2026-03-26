from datetime import datetime, timezone
import logging

from fastapi import APIRouter

from services.discovery_service import discover_backend_references

router = APIRouter(tags=["discovery"])
logger = logging.getLogger("grolab.router.discovery")


@router.get("/mcp/discovery")
async def mcp_discovery() -> dict[str, object]:
    references = discover_backend_references()
    return {
        "references": references,
        "scanned_at": datetime.now(timezone.utc).isoformat(),
    }
