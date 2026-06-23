from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(
    title="NexusCRM API",
    version="1.0.0",
    description="Enterprise CRM platform — REST API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "version": "1.0.0"}


# ── routers ───────────────────────────────────────────────────────────────────
from app.routes.auth import router as auth_router
from app.routes.billing import router as billing_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(billing_router, prefix="/api/v1")
