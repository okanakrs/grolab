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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(discovery_router, prefix="/api")
app.include_router(billing_router, prefix="/api")
app.include_router(ideas_router, prefix="/api")


@app.middleware("http")
async def request_context_middleware(request: Request, call_next) -> Response:
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    token = request_id_ctx_var.set(request_id)
    request.state.request_id = request_id
    start_time = time.perf_counter()

    logger.info("request_started method=%s path=%s", request.method, request.url.path)
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("request_failed method=%s path=%s", request.method, request.url.path)
        request_id_ctx_var.reset(token)
        raise

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request_finished method=%s path=%s status=%s duration_ms=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    request_id_ctx_var.reset(token)
    return response


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
