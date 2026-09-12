from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import SessionLocal
from app.routers.ai import router as ai_router
from app.routers.artifacts import router as artifacts_router
from app.routers.auth import router as auth_router
from app.routers.exhibition_areas import (
    router as exhibition_areas_router,
)
from app.routers.exhibition_artifacts import (
    router as exhibition_artifacts_router,
)
from app.routers.exhibitions import (
    router as exhibitions_router,
)
from app.routers.feedback import router as feedback_router
from app.routers.tickets import router as tickets_router
from app.routers.users import router as users_router
from app.routers.visitors import router as visitors_router
from app.services.seed import seed_admin, seed_roles


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()

    try:
        seed_roles(db)
        seed_admin(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://museumai.io.vn",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(artifacts_router)
app.include_router(exhibition_areas_router)
app.include_router(exhibition_artifacts_router)
app.include_router(exhibitions_router)
app.include_router(feedback_router)
app.include_router(visitors_router)
app.include_router(tickets_router)
app.include_router(ai_router)


@app.get("/")
def root():
    return {
        "message": "MuseumAI API is running",
        "version": settings.APP_VERSION,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }