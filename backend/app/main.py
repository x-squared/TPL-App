from contextlib import asynccontextmanager
import datetime as dt

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm.exc import StaleDataError

from .config import get_config
from .database import Base, engine
from .enums import CoordinationStatusKey, FavoriteTypeKey, PriorityKey, TaskScopeKey, TaskStatusKey
from . import models
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


def ensure_row_version_columns() -> None:
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if "ROW_VERSION" not in table.columns:
                continue
            columns = conn.execute(text(f"PRAGMA table_info('{table.name}')")).mappings().all()
            if not columns:
                continue
            existing = {column["name"] for column in columns}
            if "ROW_VERSION" not in existing:
                conn.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN ROW_VERSION INTEGER NOT NULL DEFAULT 1'))
            conn.execute(text(f'UPDATE "{table.name}" SET ROW_VERSION = COALESCE(ROW_VERSION, 1)'))


def ensure_user_person_link() -> None:
    with engine.begin() as conn:
        user_columns = conn.execute(text("PRAGMA table_info('USER')")).mappings().all()
        person_columns = conn.execute(text("PRAGMA table_info('PERSON')")).mappings().all()
        if not user_columns or not person_columns:
            return
        user_existing = {column["name"] for column in user_columns}
        if "PERSON_ID" not in user_existing:
            conn.execute(text('ALTER TABLE "USER" ADD COLUMN PERSON_ID INTEGER'))

        rows = conn.execute(
            text('SELECT "ID", "EXT_ID", "NAME", "PERSON_ID" FROM "USER"')
        ).mappings().all()
        for row in rows:
            if row["PERSON_ID"] is not None:
                continue
            raw_name = (row["NAME"] or "").strip()
            if raw_name:
                parts = raw_name.split(" ", 1)
                first_name = parts[0]
                surname = parts[1] if len(parts) > 1 else (row["EXT_ID"] or "User")
            else:
                first_name = row["EXT_ID"] or "User"
                surname = "User"
            person_user_id = None
            person_id = conn.execute(
                text(
                    'INSERT INTO "PERSON" ("FIRST_NAME", "SURNAME", "USER_ID") '
                    'VALUES (:first_name, :surname, :user_id) RETURNING "ID"'
                ),
                {"first_name": first_name, "surname": surname, "user_id": person_user_id},
            ).scalar_one()
            conn.execute(
                text('UPDATE "USER" SET "PERSON_ID" = :person_id WHERE "ID" = :user_id'),
                {"person_id": person_id, "user_id": row["ID"]},
            )

        conn.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS "IX_USER_PERSON_ID_UNIQUE" ON "USER" ("PERSON_ID")'))


def ensure_procurement_flex_columns() -> None:
    with engine.begin() as conn:
        field_template_columns = conn.execute(
            text("PRAGMA table_info('COORDINATION_PROCUREMENT_FIELD_TEMPLATE')")
        ).mappings().all()
        if not field_template_columns:
            return
        existing = {column["name"] for column in field_template_columns}
        if "GROUP_TEMPLATE_ID" not in existing:
            conn.execute(
                text('ALTER TABLE "COORDINATION_PROCUREMENT_FIELD_TEMPLATE" ADD COLUMN GROUP_TEMPLATE_ID INTEGER')
            )
        if "VALUE_MODE" not in existing:
            conn.execute(
                text('ALTER TABLE "COORDINATION_PROCUREMENT_FIELD_TEMPLATE" ADD COLUMN VALUE_MODE VARCHAR(24)')
            )
        if "COMMENT" not in existing:
            conn.execute(
                text('ALTER TABLE "COORDINATION_PROCUREMENT_FIELD_TEMPLATE" ADD COLUMN COMMENT VARCHAR(512)')
            )
        if "IS_ACTIVE" not in existing:
            conn.execute(
                text('ALTER TABLE "COORDINATION_PROCUREMENT_FIELD_TEMPLATE" ADD COLUMN IS_ACTIVE BOOLEAN')
            )
        conn.execute(
            text(
                'UPDATE "COORDINATION_PROCUREMENT_FIELD_TEMPLATE" '
                'SET VALUE_MODE = COALESCE(VALUE_MODE, \'SCALAR\')'
            )
        )
        conn.execute(
            text(
                'UPDATE "COORDINATION_PROCUREMENT_FIELD_TEMPLATE" '
                'SET COMMENT = COALESCE(COMMENT, \'\')'
            )
        )
        conn.execute(
            text(
                'UPDATE "COORDINATION_PROCUREMENT_FIELD_TEMPLATE" '
                'SET IS_ACTIVE = COALESCE(IS_ACTIVE, 1)'
            )
        )

        field_group_columns = conn.execute(
            text("PRAGMA table_info('COORDINATION_PROCUREMENT_FIELD_GROUP_TEMPLATE')")
        ).mappings().all()
        if field_group_columns:
            group_existing = {column["name"] for column in field_group_columns}
            if "COMMENT" not in group_existing:
                conn.execute(
                    text('ALTER TABLE "COORDINATION_PROCUREMENT_FIELD_GROUP_TEMPLATE" ADD COLUMN COMMENT VARCHAR(512)')
                )
            if "IS_ACTIVE" not in group_existing:
                conn.execute(
                    text('ALTER TABLE "COORDINATION_PROCUREMENT_FIELD_GROUP_TEMPLATE" ADD COLUMN IS_ACTIVE BOOLEAN')
                )
            conn.execute(
                text(
                    'UPDATE "COORDINATION_PROCUREMENT_FIELD_GROUP_TEMPLATE" '
                    'SET COMMENT = COALESCE(COMMENT, \'\')'
                )
            )
            conn.execute(
                text(
                    'UPDATE "COORDINATION_PROCUREMENT_FIELD_GROUP_TEMPLATE" '
                    'SET IS_ACTIVE = COALESCE(IS_ACTIVE, 1)'
                )
            )


def ensure_strong_enum_key_columns() -> None:
    with engine.begin() as conn:
        # COORDINATION.STATUS_KEY <-> CODE.COORDINATION_STATUS
        coordination_columns = conn.execute(text("PRAGMA table_info('COORDINATION')")).mappings().all()
        if coordination_columns:
            coordination_existing = {column["name"] for column in coordination_columns}
            if "STATUS_KEY" not in coordination_existing:
                conn.execute(text('ALTER TABLE "COORDINATION" ADD COLUMN STATUS_KEY VARCHAR(16)'))
            conn.execute(
                text(
                    'UPDATE "COORDINATION" '
                    'SET STATUS_KEY = COALESCE(STATUS_KEY, (SELECT "KEY" FROM "CODE" c WHERE c."ID" = "COORDINATION"."STATUS" AND c."TYPE" = \'COORDINATION_STATUS\')) '
                    'WHERE STATUS_KEY IS NULL'
                )
            )
            conn.execute(
                text(
                    'UPDATE "COORDINATION" '
                    'SET "STATUS" = COALESCE("STATUS", (SELECT "ID" FROM "CODE" c WHERE c."TYPE" = \'COORDINATION_STATUS\' AND c."KEY" = "COORDINATION"."STATUS_KEY")) '
                    'WHERE "STATUS" IS NULL'
                )
            )

        # TASK_GROUP_TEMPLATE.SCOPE_KEY <-> CODE.TASK_SCOPE
        task_group_template_columns = conn.execute(text("PRAGMA table_info('TASK_GROUP_TEMPLATE')")).mappings().all()
        if task_group_template_columns:
            task_group_template_existing = {column["name"] for column in task_group_template_columns}
            if "SCOPE_KEY" not in task_group_template_existing:
                conn.execute(text('ALTER TABLE "TASK_GROUP_TEMPLATE" ADD COLUMN SCOPE_KEY VARCHAR(16)'))
            conn.execute(
                text(
                    'UPDATE "TASK_GROUP_TEMPLATE" '
                    'SET SCOPE_KEY = COALESCE(SCOPE_KEY, (SELECT "KEY" FROM "CODE" c WHERE c."ID" = "TASK_GROUP_TEMPLATE"."SCOPE_ID" AND c."TYPE" = \'TASK_SCOPE\')) '
                    'WHERE SCOPE_KEY IS NULL'
                )
            )
            conn.execute(
                text(
                    'UPDATE "TASK_GROUP_TEMPLATE" '
                    'SET "SCOPE_ID" = COALESCE("SCOPE_ID", (SELECT "ID" FROM "CODE" c WHERE c."TYPE" = \'TASK_SCOPE\' AND c."KEY" = "TASK_GROUP_TEMPLATE"."SCOPE_KEY")) '
                    'WHERE "SCOPE_ID" IS NULL'
                )
            )

        # TASK_TEMPLATE.PRIORITY_KEY <-> CODE.PRIORITY
        task_template_columns = conn.execute(text("PRAGMA table_info('TASK_TEMPLATE')")).mappings().all()
        if task_template_columns:
            task_template_existing = {column["name"] for column in task_template_columns}
            if "PRIORITY_KEY" not in task_template_existing:
                conn.execute(text('ALTER TABLE "TASK_TEMPLATE" ADD COLUMN PRIORITY_KEY VARCHAR(16)'))
            conn.execute(
                text(
                    'UPDATE "TASK_TEMPLATE" '
                    'SET PRIORITY_KEY = COALESCE(PRIORITY_KEY, (SELECT "KEY" FROM "CODE" c WHERE c."ID" = "TASK_TEMPLATE"."PRIORITY_ID" AND c."TYPE" = \'PRIORITY\')) '
                    'WHERE PRIORITY_KEY IS NULL'
                )
            )
            conn.execute(
                text(
                    'UPDATE "TASK_TEMPLATE" '
                    'SET "PRIORITY_ID" = COALESCE("PRIORITY_ID", (SELECT "ID" FROM "CODE" c WHERE c."TYPE" = \'PRIORITY\' AND c."KEY" = "TASK_TEMPLATE"."PRIORITY_KEY")) '
                    'WHERE "PRIORITY_ID" IS NULL'
                )
            )

        # TASK.PRIORITY_KEY/STATUS_KEY <-> CODE.PRIORITY/TASK_STATUS
        task_columns = conn.execute(text("PRAGMA table_info('TASK')")).mappings().all()
        if task_columns:
            task_existing = {column["name"] for column in task_columns}
            if "PRIORITY_KEY" not in task_existing:
                conn.execute(text('ALTER TABLE "TASK" ADD COLUMN PRIORITY_KEY VARCHAR(16)'))
            if "STATUS_KEY" not in task_existing:
                conn.execute(text('ALTER TABLE "TASK" ADD COLUMN STATUS_KEY VARCHAR(16)'))
            conn.execute(
                text(
                    'UPDATE "TASK" '
                    'SET PRIORITY_KEY = COALESCE(PRIORITY_KEY, (SELECT "KEY" FROM "CODE" c WHERE c."ID" = "TASK"."PRIORITY" AND c."TYPE" = \'PRIORITY\')) '
                    'WHERE PRIORITY_KEY IS NULL'
                )
            )
            conn.execute(
                text(
                    'UPDATE "TASK" '
                    'SET STATUS_KEY = COALESCE(STATUS_KEY, (SELECT "KEY" FROM "CODE" c WHERE c."ID" = "TASK"."STATUS" AND c."TYPE" = \'TASK_STATUS\')) '
                    'WHERE STATUS_KEY IS NULL'
                )
            )
            conn.execute(
                text(
                    'UPDATE "TASK" '
                    'SET "PRIORITY" = COALESCE("PRIORITY", (SELECT "ID" FROM "CODE" c WHERE c."TYPE" = \'PRIORITY\' AND c."KEY" = "TASK"."PRIORITY_KEY")) '
                    'WHERE "PRIORITY" IS NULL'
                )
            )
            conn.execute(
                text(
                    'UPDATE "TASK" '
                    'SET "STATUS" = COALESCE("STATUS", (SELECT "ID" FROM "CODE" c WHERE c."TYPE" = \'TASK_STATUS\' AND c."KEY" = "TASK"."STATUS_KEY")) '
                    'WHERE "STATUS" IS NULL'
                )
            )


def ensure_strong_enum_code_alignment() -> None:
    expected_by_type: dict[str, set[str]] = {
        "COORDINATION_STATUS": {item.value for item in CoordinationStatusKey},
        "FAVORITE_TYPE": {item.value for item in FavoriteTypeKey},
        "TASK_SCOPE": {item.value for item in TaskScopeKey},
        "TASK_STATUS": {item.value for item in TaskStatusKey},
        "PRIORITY": {item.value for item in PriorityKey},
    }
    with engine.begin() as conn:
        code_table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='CODE'")
        ).scalar_one_or_none()
        if not code_table_exists:
            return
        for code_type, expected_keys in expected_by_type.items():
            rows = conn.execute(
                text('SELECT "KEY" FROM "CODE" WHERE "TYPE" = :code_type'),
                {"code_type": code_type},
            ).all()
            actual_keys = {row[0] for row in rows}
            if not actual_keys:
                continue
            if actual_keys != expected_keys:
                missing = sorted(expected_keys - actual_keys)
                extra = sorted(actual_keys - expected_keys)
                raise RuntimeError(
                    f"CODE.{code_type} is out of sync with enum definition. "
                    f"Missing={missing}, Extra={extra}"
                )


def ensure_organ_code_order() -> None:
    organ_pos_by_key = {
        "KIDNEY": 1,
        "PANCREAS": 2,
        "LIVER": 3,
        "HEART": 4,
        "HEART_VALVE": 5,
        "LUNG": 6,
        "ISLET": 7,
        "VESSELS": 8,
        "INTESTINE": 9,
    }
    with engine.begin() as conn:
        code_table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='CODE'")
        ).scalar_one_or_none()
        if not code_table_exists:
            return
        for key, pos in organ_pos_by_key.items():
            conn.execute(
                text(
                    'UPDATE "CODE" '
                    'SET "POS" = :pos '
                    'WHERE "TYPE" = \'ORGAN\' AND "KEY" = :key'
                ),
                {"key": key, "pos": pos},
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    _ = models
    Base.metadata.create_all(bind=engine)
    ensure_user_person_link()
    ensure_procurement_flex_columns()
    ensure_diagnosis_is_main_column()
    ensure_episode_organ_columns()
    ensure_favorite_sort_pos_column()
    ensure_information_valid_from_column()
    ensure_information_withdrawn_column()
    ensure_row_version_columns()
    ensure_strong_enum_key_columns()
    ensure_strong_enum_code_alignment()
    ensure_organ_code_order()
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


@app.exception_handler(StaleDataError)
async def handle_stale_data_error(_: Request, __: StaleDataError):
    return JSONResponse(
        status_code=409,
        content={"detail": "Record was modified by another user. Reload and try again."},
    )


@app.get("/api/health")
def health_check():
    env = get_config().env.strip().upper()
    return {
        "status": "ok",
        "env": env,
        "dev_tools_enabled": env in {"DEV", "TEST"},
    }
