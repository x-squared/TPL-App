from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from sqlalchemy import MetaData, inspect, text


def _configure_env(*, app_env: str | None, database_url: str | None, seed_profile: str | None) -> None:
    if app_env:
        os.environ["TPL_ENV"] = app_env
    if database_url:
        os.environ["TPL_DATABASE_URL"] = database_url
    if seed_profile is not None:
        os.environ["TPL_SEED_PROFILE"] = seed_profile


def _clean_data() -> int:
    from .database import engine

    metadata = MetaData()
    metadata.reflect(bind=engine)
    table_count = len(metadata.sorted_tables)

    with engine.begin() as conn:
        is_sqlite = str(conn.dialect.name).lower() == "sqlite"
        if is_sqlite:
            conn.execute(text("PRAGMA foreign_keys = OFF"))
        for table in reversed(metadata.sorted_tables):
            conn.execute(table.delete())
        if is_sqlite:
            row = conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'")
            ).first()
            if row:
                conn.execute(text("DELETE FROM sqlite_sequence"))
            conn.execute(text("PRAGMA foreign_keys = ON"))
    return table_count


def _write_translation_snapshot_file(*, bundles: list[dict[str, object]]) -> Path:
    target = Path(__file__).resolve().parent / "seed" / "datasets" / "core" / "translations_runtime_snapshot.py"
    lines = [
        '"""Runtime translation snapshot written from DB during clean/refresh."""',
        "",
        f"RUNTIME_TRANSLATION_BUNDLES = {json.dumps(bundles, ensure_ascii=False, sort_keys=True, indent=4)}",
        "",
    ]
    target.write_text("\n".join(lines), encoding="utf-8")
    return target


def _export_translation_snapshot_to_core_seed() -> tuple[Path, int]:
    from .database import engine

    bundles: list[dict[str, object]] = []
    with engine.begin() as conn:
        inspector = inspect(conn)
        if inspector.has_table("TRANSLATION_BUNDLE"):
            rows = conn.execute(
                text('SELECT "LOCALE" AS locale, "PAYLOAD_JSON" AS payload_json FROM "TRANSLATION_BUNDLE" ORDER BY "LOCALE"')
            ).mappings().all()
            for row in rows:
                locale = (row.get("locale") or "").strip().lower()
                raw_payload = row.get("payload_json")
                if not locale:
                    continue
                entries: dict[str, str] = {}
                if isinstance(raw_payload, str) and raw_payload.strip():
                    try:
                        parsed = json.loads(raw_payload)
                        if isinstance(parsed, dict):
                            for key, value in parsed.items():
                                if isinstance(key, str) and isinstance(value, str) and key.strip() and value.strip():
                                    entries[key.strip()] = value
                    except json.JSONDecodeError:
                        entries = {}
                bundles.append({"locale": locale, "entries": entries})
        elif inspector.has_table("TRANSLATION_OVERRIDE"):
            rows = conn.execute(
                text(
                    'SELECT "LOCALE" AS locale, "KEY" AS key, "TEXT" AS text FROM "TRANSLATION_OVERRIDE" '
                    'ORDER BY "LOCALE", "KEY", "ID"'
                )
            ).mappings().all()
            by_locale: dict[str, dict[str, str]] = {}
            for row in rows:
                locale = (row.get("locale") or "").strip().lower()
                key = (row.get("key") or "").strip()
                value = (row.get("text") or "").strip()
                if not locale or not key or not value:
                    continue
                by_locale.setdefault(locale, {})[key] = value
            bundles = [{"locale": locale, "entries": entries} for locale, entries in sorted(by_locale.items())]
    target = _write_translation_snapshot_file(bundles=bundles)
    return target, len(bundles)


def _seed(*, app_env: str | None, seed_profile: str | None) -> dict[str, object]:
    from .database import SessionLocal
    from .seed import run_seed_profile

    db = SessionLocal()
    try:
        return run_seed_profile(db, app_env=app_env, seed_profile=seed_profile)
    finally:
        db.close()


def _migrate_procurement_runtime() -> dict[str, int]:
    from .database import engine

    migrated_values = 0
    migrated_person_links = 0
    migrated_team_links = 0

    with engine.begin() as conn:
        runtime_table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='COORDINATION_PROCUREMENT_DATA'")
        ).scalar_one_or_none()
        runtime_person_table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='COORDINATION_PROCUREMENT_DATA_PERSON'")
        ).scalar_one_or_none()
        runtime_team_table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='COORDINATION_PROCUREMENT_DATA_TEAM'")
        ).scalar_one_or_none()
        old_value_table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='COORDINATION_PROCUREMENT_VALUE'")
        ).scalar_one_or_none()
        if (
            not runtime_table_exists
            or not runtime_person_table_exists
            or not runtime_team_table_exists
            or not old_value_table_exists
        ):
            return {
                "migrated_values": migrated_values,
                "migrated_person_links": migrated_person_links,
                "migrated_team_links": migrated_team_links,
            }

        old_value_person_table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='COORDINATION_PROCUREMENT_VALUE_PERSON'")
        ).scalar_one_or_none()
        old_value_team_table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='COORDINATION_PROCUREMENT_VALUE_TEAM'")
        ).scalar_one_or_none()
        old_value_episode_table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='COORDINATION_PROCUREMENT_VALUE_EPISODE'")
        ).scalar_one_or_none()

        value_rows = conn.execute(
            text(
                'SELECT v."ID" AS value_id, '
                'v."FIELD_TEMPLATE_ID" AS field_template_id, '
                'v."VALUE" AS value_text, '
                'v."CHANGED_BY" AS changed_by_id, '
                'v."CREATED_AT" AS created_at, '
                'v."UPDATED_AT" AS updated_at, '
                's."SLOT_KEY" AS slot_key, '
                'o."COORDINATION_ID" AS coordination_id, '
                'o."ORGAN_ID" AS organ_id '
                'FROM "COORDINATION_PROCUREMENT_VALUE" v '
                'JOIN "COORDINATION_PROCUREMENT_SLOT" s ON s."ID" = v."SLOT_ID" '
                'JOIN "COORDINATION_PROCUREMENT_ORGAN" o ON o."ID" = s."COORDINATION_PROCUREMENT_ORGAN_ID"'
            )
        ).mappings().all()
        if not value_rows:
            return {
                "migrated_values": migrated_values,
                "migrated_person_links": migrated_person_links,
                "migrated_team_links": migrated_team_links,
            }

        person_rows = []
        if old_value_person_table_exists:
            person_rows = conn.execute(
                text(
                    'SELECT "VALUE_ID" AS value_id, "PERSON_ID" AS person_id '
                    'FROM "COORDINATION_PROCUREMENT_VALUE_PERSON" '
                    'ORDER BY "VALUE_ID", "POS", "ID"'
                )
            ).mappings().all()
        team_rows = []
        if old_value_team_table_exists:
            team_rows = conn.execute(
                text(
                    'SELECT "VALUE_ID" AS value_id, "TEAM_ID" AS team_id '
                    'FROM "COORDINATION_PROCUREMENT_VALUE_TEAM" '
                    'ORDER BY "VALUE_ID", "POS", "ID"'
                )
            ).mappings().all()
        episode_rows = []
        if old_value_episode_table_exists:
            episode_rows = conn.execute(
                text(
                    'SELECT "VALUE_ID" AS value_id, "EPISODE_ID" AS episode_id '
                    'FROM "COORDINATION_PROCUREMENT_VALUE_EPISODE"'
                )
            ).mappings().all()

        person_ids_by_value: dict[int, list[int]] = {}
        for row in person_rows:
            person_ids_by_value.setdefault(int(row["value_id"]), []).append(int(row["person_id"]))
        team_ids_by_value: dict[int, list[int]] = {}
        for row in team_rows:
            team_ids_by_value.setdefault(int(row["value_id"]), []).append(int(row["team_id"]))
        episode_id_by_value: dict[int, int] = {}
        for row in episode_rows:
            episode_id_by_value[int(row["value_id"])] = int(row["episode_id"])

        for row in value_rows:
            value_id = int(row["value_id"])
            payload = {
                "coordination_id": row["coordination_id"],
                "organ_id": row["organ_id"],
                "slot_key": row["slot_key"] or "MAIN",
                "field_template_id": row["field_template_id"],
                "value_text": row["value_text"] or "",
                "episode_id": episode_id_by_value.get(value_id),
                "changed_by_id": row["changed_by_id"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
            before_count = conn.execute(
                text(
                    'SELECT COUNT(*) FROM "COORDINATION_PROCUREMENT_DATA" '
                    'WHERE "COORDINATION_ID" = :coordination_id '
                    'AND "ORGAN_ID" = :organ_id '
                    'AND "SLOT_KEY" = :slot_key '
                    'AND "FIELD_TEMPLATE_ID" = :field_template_id'
                ),
                payload,
            ).scalar_one()
            conn.execute(
                text(
                    'INSERT OR IGNORE INTO "COORDINATION_PROCUREMENT_DATA" ('
                    '"COORDINATION_ID","ORGAN_ID","SLOT_KEY","FIELD_TEMPLATE_ID","VALUE",'
                    '"EPISODE_ID","CHANGED_BY","CREATED_AT","UPDATED_AT","ROW_VERSION"'
                    ') VALUES ('
                    ':coordination_id,:organ_id,:slot_key,:field_template_id,:value_text,'
                    ':episode_id,:changed_by_id,:created_at,:updated_at,1'
                    ')'
                ),
                payload,
            )
            after_count = conn.execute(
                text(
                    'SELECT COUNT(*) FROM "COORDINATION_PROCUREMENT_DATA" '
                    'WHERE "COORDINATION_ID" = :coordination_id '
                    'AND "ORGAN_ID" = :organ_id '
                    'AND "SLOT_KEY" = :slot_key '
                    'AND "FIELD_TEMPLATE_ID" = :field_template_id'
                ),
                payload,
            ).scalar_one()
            if int(after_count) > int(before_count):
                migrated_values += 1
            data_id = conn.execute(
                text(
                    'SELECT "ID" FROM "COORDINATION_PROCUREMENT_DATA" '
                    'WHERE "COORDINATION_ID" = :coordination_id '
                    'AND "ORGAN_ID" = :organ_id '
                    'AND "SLOT_KEY" = :slot_key '
                    'AND "FIELD_TEMPLATE_ID" = :field_template_id'
                ),
                payload,
            ).scalar_one_or_none()
            if data_id is None:
                continue
            for pos, person_id in enumerate(person_ids_by_value.get(value_id, [])):
                before_count = conn.execute(
                    text(
                        'SELECT COUNT(*) FROM "COORDINATION_PROCUREMENT_DATA_PERSON" '
                        'WHERE "DATA_ID" = :data_id AND "PERSON_ID" = :person_id'
                    ),
                    {"data_id": data_id, "person_id": person_id},
                ).scalar_one()
                conn.execute(
                    text(
                        'INSERT OR IGNORE INTO "COORDINATION_PROCUREMENT_DATA_PERSON" ('
                        '"DATA_ID","PERSON_ID","POS","CHANGED_BY","CREATED_AT","UPDATED_AT","ROW_VERSION"'
                        ') VALUES ('
                        ':data_id,:person_id,:pos,:changed_by_id,:created_at,:updated_at,1'
                        ')'
                    ),
                    {
                        "data_id": data_id,
                        "person_id": person_id,
                        "pos": pos,
                        "changed_by_id": row["changed_by_id"],
                        "created_at": row["created_at"],
                        "updated_at": row["updated_at"],
                    },
                )
                after_count = conn.execute(
                    text(
                        'SELECT COUNT(*) FROM "COORDINATION_PROCUREMENT_DATA_PERSON" '
                        'WHERE "DATA_ID" = :data_id AND "PERSON_ID" = :person_id'
                    ),
                    {"data_id": data_id, "person_id": person_id},
                ).scalar_one()
                if int(after_count) > int(before_count):
                    migrated_person_links += 1
            for pos, team_id in enumerate(team_ids_by_value.get(value_id, [])):
                before_count = conn.execute(
                    text(
                        'SELECT COUNT(*) FROM "COORDINATION_PROCUREMENT_DATA_TEAM" '
                        'WHERE "DATA_ID" = :data_id AND "TEAM_ID" = :team_id'
                    ),
                    {"data_id": data_id, "team_id": team_id},
                ).scalar_one()
                conn.execute(
                    text(
                        'INSERT OR IGNORE INTO "COORDINATION_PROCUREMENT_DATA_TEAM" ('
                        '"DATA_ID","TEAM_ID","POS","CHANGED_BY","CREATED_AT","UPDATED_AT","ROW_VERSION"'
                        ') VALUES ('
                        ':data_id,:team_id,:pos,:changed_by_id,:created_at,:updated_at,1'
                        ')'
                    ),
                    {
                        "data_id": data_id,
                        "team_id": team_id,
                        "pos": pos,
                        "changed_by_id": row["changed_by_id"],
                        "created_at": row["created_at"],
                        "updated_at": row["updated_at"],
                    },
                )
                after_count = conn.execute(
                    text(
                        'SELECT COUNT(*) FROM "COORDINATION_PROCUREMENT_DATA_TEAM" '
                        'WHERE "DATA_ID" = :data_id AND "TEAM_ID" = :team_id'
                    ),
                    {"data_id": data_id, "team_id": team_id},
                ).scalar_one()
                if int(after_count) > int(before_count):
                    migrated_team_links += 1

    return {
        "migrated_values": migrated_values,
        "migrated_person_links": migrated_person_links,
        "migrated_team_links": migrated_team_links,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Data management (DML only).")
    parser.add_argument(
        "--mode",
        choices=("clean", "seed", "refresh", "migrate-procurement-runtime"),
        default="refresh",
        help="clean=wipe data, seed=seed only, refresh=clean+seed, migrate-procurement-runtime=backfill legacy procurement runtime",
    )
    parser.add_argument("--env", default=os.getenv("TPL_ENV", "DEV"), help="Application env (DEV/TEST/PROD)")
    parser.add_argument("--seed-profile", default=os.getenv("TPL_SEED_PROFILE"), help="Optional seed profile override")
    parser.add_argument("--db-url", default=None, help="Optional DB URL override")
    args = parser.parse_args()

    _configure_env(app_env=args.env, database_url=args.db_url, seed_profile=args.seed_profile)

    if args.mode in {"clean", "refresh"}:
        snapshot_path, bundle_count = _export_translation_snapshot_to_core_seed()
        print(f"Translation snapshot exported: {snapshot_path} (locales: {bundle_count})")
        cleaned_tables = _clean_data()
        print(f"Data clean complete. Tables wiped: {cleaned_tables}")

    if args.mode in {"seed", "refresh"}:
        result = _seed(app_env=args.env, seed_profile=args.seed_profile)
        print(
            "Seed complete: "
            + f"env={result['environment']} "
            + f"categories={','.join(result['categories'])} "
            + f"jobs={','.join(result['executed_jobs'])}"
        )

    if args.mode == "migrate-procurement-runtime":
        result = _migrate_procurement_runtime()
        print(
            "Procurement runtime migration complete: "
            + f"values={result['migrated_values']} "
            + f"person_links={result['migrated_person_links']} "
            + f"team_links={result['migrated_team_links']}"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
