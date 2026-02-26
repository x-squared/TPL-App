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


def ensure_medical_value_group_schema() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS MEDICAL_VALUE_GROUP (
                  ID INTEGER PRIMARY KEY,
                  KEY VARCHAR(48) NOT NULL UNIQUE,
                  NAME_DEFAULT VARCHAR(128) NOT NULL DEFAULT '',
                  POS INTEGER NOT NULL DEFAULT 0,
                  RENEW_DATE DATE NULL,
                  CHANGED_BY INTEGER NULL,
                  CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP,
                  UPDATED_AT DATETIME NULL
                )
                """
            )
        )
        conn.execute(
            text("CREATE UNIQUE INDEX IF NOT EXISTS ix_medical_value_group_key ON MEDICAL_VALUE_GROUP(KEY)")
        )

        template_columns = conn.execute(text("PRAGMA table_info('MEDICAL_VALUE_TEMPLATE')")).mappings().all()
        template_existing = {column["name"] for column in template_columns}
        if "MEDICAL_VALUE_GROUP_ID" not in template_existing:
            conn.execute(text("ALTER TABLE MEDICAL_VALUE_TEMPLATE ADD COLUMN MEDICAL_VALUE_GROUP_ID INTEGER"))

        value_columns = conn.execute(text("PRAGMA table_info('MEDICAL_VALUE')")).mappings().all()
        value_existing = {column["name"] for column in value_columns}
        if "MEDICAL_VALUE_GROUP_ID" not in value_existing:
            conn.execute(text("ALTER TABLE MEDICAL_VALUE ADD COLUMN MEDICAL_VALUE_GROUP_ID INTEGER"))

        defaults = [
            ("GENERAL", "Medical Values", 10),
            ("CARDIOLOGY", "Cardiological Data", 20),
            ("ORGAN_SPECIFIC", "Organ Specific Data", 30),
            ("USER_CAPTURED", "User Captured Values", 40),
            ("DONOR", "Donor Data", 50),
            ("UNGROUPED", "Ungrouped", 99),
        ]
        for key, name_default, pos in defaults:
            conn.execute(
                text(
                    "INSERT OR IGNORE INTO MEDICAL_VALUE_GROUP(KEY, NAME_DEFAULT, POS) "
                    "VALUES (:key, :name_default, :pos)"
                ),
                {"key": key, "name_default": name_default, "pos": pos},
            )

        conn.execute(
            text(
                "UPDATE MEDICAL_VALUE_TEMPLATE "
                "SET MEDICAL_VALUE_GROUP_ID = (SELECT ID FROM MEDICAL_VALUE_GROUP WHERE KEY = 'UNGROUPED' LIMIT 1) "
                "WHERE MEDICAL_VALUE_GROUP_ID IS NULL"
            )
        )
        conn.execute(
            text(
                "UPDATE MEDICAL_VALUE "
                "SET MEDICAL_VALUE_GROUP_ID = COALESCE("
                "  MEDICAL_VALUE_GROUP_ID,"
                "  (SELECT MEDICAL_VALUE_GROUP_ID FROM MEDICAL_VALUE_TEMPLATE WHERE MEDICAL_VALUE_TEMPLATE.ID = MEDICAL_VALUE.MEDICAL_VALUE_TEMPLATE_ID),"
                "  (SELECT ID FROM MEDICAL_VALUE_GROUP WHERE KEY = 'USER_CAPTURED' LIMIT 1)"
                ") "
                "WHERE MEDICAL_VALUE_GROUP_ID IS NULL"
            )
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_diagnosis_is_main_column()
    ensure_episode_organ_columns()
    ensure_medical_value_group_schema()
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
    env = get_config().env.strip().upper()
    return {
        "status": "ok",
        "env": env,
        "dev_tools_enabled": env in {"DEV", "TEST"},
    }
