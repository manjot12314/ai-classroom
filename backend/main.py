import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .config import get_settings
from .database import Base, engine, get_db
from .routers import api_router

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("startup")
def on_startup():
    if settings.environment != "development" and settings.jwt_secret_key == "change-me":
        raise RuntimeError("JWT secret key must be set for non-development environments")
    Base.metadata.create_all(bind=engine)
    # Simple connectivity check
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))


@app.get("/health")
def health():
    return {"status": "ok", "env": settings.environment}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)

