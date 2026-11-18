from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, me
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="Finvora API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(me.router, prefix="/api")
