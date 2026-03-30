import contextvars
import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response

from routers.billing import router as billing_router
from routers.discovery import router as discovery_router
from routers.ideas import router as ideas_router
from routers.tools import router as tools_router

request_id_ctx_var: contextvars.ContextVar[str] = contextvars.ContextVar(
    "request_id", default="-"
)


_base_record_factory = logging.getLogRecordFactory()


def _request_id_record_factory(*args, **kwargs) -> logging.LogRecord:
    record = _base_record_factory(*args, **kwargs)
    if not hasattr(record, "request_id"):
        record.request_id = request_id_ctx_var.get()
    return record


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [request_id=%(request_id)s] %(name)s - %(message)s",
)
logging.setLogRecordFactory(_request_id_record_factory)
logger = logging.getLogger("grolab.api")

app = FastAPI(title="GroLab API", version="0.1.0")

app.include_router(discovery_router, prefix="/api")
app.include_router(billing_router, prefix="/api")
app.include_router(ideas_router, prefix="/api")
app.include_router(tools_router, prefix="/api")

import os as _os

_cors_extra = _os.getenv("CORS_ORIGINS", "")
_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://grolab.vercel.app",
    "https://grolab.app",
    "https://www.grolab.app",
    *[o.strip() for o in _cors_extra.split(",") if o.strip()],
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"https://grolab.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next) -> Response:
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    token = request_id_ctx_var.set(request_id)
    request.state.request_id = request_id
    start_time = time.perf_counter()

    logger.info(f"request_started method={request.method} path={request.url.path}")
    try:
        response = await call_next(request)
    except Exception:
        logger.exception(f"request_failed method={request.method} path={request.url.path}")
        request_id_ctx_var.reset(token)
        raise

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        f"request_finished method={request.method} path={request.url.path} status={response.status_code} duration_ms={duration_ms}"
    )
    request_id_ctx_var.reset(token)
    return response


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
