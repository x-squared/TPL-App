from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import Base, SessionLocal, engine
from .routers import register_routers
from .seed import (
    sync_catalogues,
    sync_colloqiums,
    sync_codes,
    sync_medical_value_templates,
    sync_patients,
    sync_task_templates,
    sync_tasks,
    sync_users,
)


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
    db = SessionLocal()
    try:
        sync_codes(db)
        sync_catalogues(db)
        sync_users(db)
        sync_colloqiums(db)
        sync_patients(db)
        sync_medical_value_templates(db)
        sync_task_templates(db)
        sync_tasks(db)
    finally:
        db.close()
    yield


app = FastAPI(title="TPL App", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_routers(app)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
