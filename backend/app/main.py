from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .config import get_config
from .database import Base, SessionLocal, engine
from .routers import register_routers
from .seed import run_seed_profile


def ensure_diagnosis_is_main_column() -> None:
    with engine.begin() as conn:
        columns = conn.execute(text("PRAGMA table_info('DIAGNOSIS')")).mappings().all()
        has_is_main = any(column["name"] == "IS_MAIN" for column in columns)
        if not has_is_main:
            conn.execute(text("ALTER TABLE DIAGNOSIS ADD COLUMN IS_MAIN BOOLEAN NOT NULL DEFAULT 0"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_diagnosis_is_main_column()
    cfg = get_config()
    db = SessionLocal()
    try:
        if cfg.seed_on_startup:
            result = run_seed_profile(db, app_env=cfg.env, seed_profile=cfg.seed_profile)
            print(
                "[seed] env="
                + result["environment"]
                + " categories="
                + ",".join(result["categories"])
                + " jobs="
                + ",".join(result["executed_jobs"])
            )
        else:
            print("[seed] startup seeding disabled (TPL_SEED_ON_STARTUP=false)")
    finally:
        db.close()
    yield


app = FastAPI(title="TPL App", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_config().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_routers(app)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
