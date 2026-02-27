from contextlib import asynccontextmanager
import datetime as dt

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .config import get_config
from .database import Base, engine
from .routers import register_routers


def ensure_diagnosis_is_main_column() -> None:
    with engine.begin() as conn:
        columns = conn.execute(text("PRAGMA table_info('DIAGNOSIS')")).mappings().all()
        has_is_main = any(column["name"] == "IS_MAIN" for column in columns)
        if not has_is_main:
            conn.execute(text("ALTER TABLE DIAGNOSIS ADD COLUMN IS_MAIN BOOLEAN NOT NULL DEFAULT 0"))


def ensure_episode_organ_columns() -> None:
    with engine.begin() as conn:
        columns = conn.execute(text("PRAGMA table_info('EPISODE_ORGAN')")).mappings().all()
        if not columns:
            return
        existing = {column["name"] for column in columns}
        if "DATE_ADDED" not in existing:
            conn.execute(text("ALTER TABLE EPISODE_ORGAN ADD COLUMN DATE_ADDED DATE"))
        if "COMMENT" not in existing:
            conn.execute(text("ALTER TABLE EPISODE_ORGAN ADD COLUMN COMMENT VARCHAR(512) DEFAULT ''"))
        if "IS_ACTIVE" not in existing:
            conn.execute(text("ALTER TABLE EPISODE_ORGAN ADD COLUMN IS_ACTIVE BOOLEAN NOT NULL DEFAULT 1"))
        if "DATE_INACTIVATED" not in existing:
            conn.execute(text("ALTER TABLE EPISODE_ORGAN ADD COLUMN DATE_INACTIVATED DATE"))
        if "REASON_ACTIVATION_CHANGE" not in existing:
            conn.execute(
                text("ALTER TABLE EPISODE_ORGAN ADD COLUMN REASON_ACTIVATION_CHANGE VARCHAR(128) DEFAULT ''")
            )
        conn.execute(
            text(
                "UPDATE EPISODE_ORGAN "
                "SET DATE_ADDED = COALESCE(DATE_ADDED, (SELECT START FROM EPISODE WHERE EPISODE.ID = EPISODE_ORGAN.EPISODE_ID), DATE('now')) "
                "WHERE DATE_ADDED IS NULL"
            )
        )
        conn.execute(
            text("UPDATE EPISODE_ORGAN SET IS_ACTIVE = 1 WHERE IS_ACTIVE IS NULL")
        )


def ensure_favorite_sort_pos_column() -> None:
    with engine.begin() as conn:
        columns = conn.execute(text("PRAGMA table_info('FAVORITE')")).mappings().all()
        if not columns:
            return
        existing = {column["name"] for column in columns}
        if "SORT_POS" not in existing:
            conn.execute(text("ALTER TABLE FAVORITE ADD COLUMN SORT_POS INTEGER NOT NULL DEFAULT 0"))
        conn.execute(
            text(
                "UPDATE FAVORITE "
                "SET SORT_POS = COALESCE((SELECT COUNT(*) FROM FAVORITE f2 WHERE f2.USER_ID = FAVORITE.USER_ID AND (f2.CREATED_AT < FAVORITE.CREATED_AT OR (f2.CREATED_AT = FAVORITE.CREATED_AT AND f2.ID <= FAVORITE.ID))), 0) "
                "WHERE SORT_POS IS NULL OR SORT_POS = 0"
            )
        )


def ensure_information_valid_from_column() -> None:
    min_valid_from = dt.date.today() + dt.timedelta(days=1)
    while min_valid_from.weekday() >= 5:
        min_valid_from += dt.timedelta(days=1)
    with engine.begin() as conn:
        columns = conn.execute(text("PRAGMA table_info('INFORMATION')")).mappings().all()
        if not columns:
            return
        existing = {column["name"] for column in columns}
        if "VALID_FROM" not in existing:
            conn.execute(text("ALTER TABLE INFORMATION ADD COLUMN VALID_FROM DATE"))
        conn.execute(
            text("UPDATE INFORMATION SET VALID_FROM = COALESCE(VALID_FROM, :min_valid_from)"),
            {"min_valid_from": min_valid_from.isoformat()},
        )


def ensure_information_withdrawn_column() -> None:
    with engine.begin() as conn:
        columns = conn.execute(text("PRAGMA table_info('INFORMATION')")).mappings().all()
        if not columns:
            return
        existing = {column["name"] for column in columns}
        if "WITHDRAWN" not in existing:
            conn.execute(text("ALTER TABLE INFORMATION ADD COLUMN WITHDRAWN BOOLEAN NOT NULL DEFAULT 0"))
        conn.execute(text("UPDATE INFORMATION SET WITHDRAWN = COALESCE(WITHDRAWN, 0)"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_diagnosis_is_main_column()
    ensure_episode_organ_columns()
    ensure_favorite_sort_pos_column()
    ensure_information_valid_from_column()
    ensure_information_withdrawn_column()
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
    env = get_config().env.strip().upper()
    return {
        "status": "ok",
        "env": env,
        "dev_tools_enabled": env in {"DEV", "TEST"},
    }
