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


def _read_translation_bundles_from_db() -> list[dict[str, object]]:
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
    return bundles


def _export_translation_snapshot_to_core_seed() -> tuple[Path, int]:
    bundles = _read_translation_bundles_from_db()
    target = _write_translation_snapshot_file(bundles=bundles)
    return target, len(bundles)


def _load_frontend_translation_config(
    target: Path,
) -> tuple[dict[str, dict[str, str]], dict[str, dict[str, str]]]:
    texts_by_locale: dict[str, dict[str, str]] = {}
    labels_by_key: dict[str, dict[str, str]] = {}
    if not target.exists():
        return texts_by_locale, labels_by_key
    try:
        payload = json.loads(target.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return texts_by_locale, labels_by_key
    if not isinstance(payload, dict):
        return texts_by_locale, labels_by_key

    def walk(node: object, path: list[str]) -> None:
        if not isinstance(node, dict):
            return
        text_node = node.get("text")
        label_node = node.get("label")
        if isinstance(text_node, dict):
            key = ".".join(path)
            if key:
                for locale, value in text_node.items():
                    if not isinstance(locale, str) or not isinstance(value, str):
                        continue
                    locale_key = locale.strip().lower()
                    text_value = value.strip()
                    if not locale_key or not text_value:
                        continue
                    texts_by_locale.setdefault(locale_key, {})[key] = text_value
        if isinstance(label_node, dict):
            key = ".".join(path)
            if key:
                for locale, value in label_node.items():
                    if not isinstance(locale, str) or not isinstance(value, str):
                        continue
                    locale_key = locale.strip().lower()
                    label_value = value.strip()
                    if not locale_key or not label_value:
                        continue
                    labels_by_key.setdefault(key, {})[locale_key] = label_value
        for child_key, child_value in node.items():
            if child_key in {"text", "label"}:
                continue
            if isinstance(child_key, str):
                walk(child_value, [*path, child_key])

    walk(payload, [])
    return texts_by_locale, labels_by_key


def _build_frontend_translation_tree(
    *,
    keys: set[str],
    texts_by_locale: dict[str, dict[str, str]],
    labels_by_key: dict[str, dict[str, str]],
) -> dict[str, object]:
    root: dict[str, object] = {}
    for key in sorted(keys):
        parts = [part for part in key.split(".") if part]
        if not parts:
            continue
        cursor: dict[str, object] = root
        for part in parts[:-1]:
            existing = cursor.get(part)
            if not isinstance(existing, dict):
                existing = {}
                cursor[part] = existing
            cursor = existing
        leaf_key = parts[-1]
        leaf: dict[str, object] = {}
        labels = labels_by_key.get(key, {})
        if labels:
            leaf["label"] = {locale: labels[locale] for locale in sorted(labels)}
        text_for_key = {
            locale: by_key[key]
            for locale, by_key in texts_by_locale.items()
            if key in by_key and by_key[key].strip()
        }
        if text_for_key:
            leaf["text"] = {locale: text_for_key[locale] for locale in sorted(text_for_key)}
        if leaf:
            cursor[leaf_key] = leaf
    return root


def _export_translation_json_from_db() -> tuple[Path, int]:
    root = Path(__file__).resolve().parents[2]
    target = root / "frontend" / "src" / "i18n" / "translations.json"
    existing_texts_by_locale, labels_by_key = _load_frontend_translation_config(target)
    merged_texts_by_locale: dict[str, dict[str, str]] = {
        locale: dict(entries)
        for locale, entries in existing_texts_by_locale.items()
    }
    bundles = _read_translation_bundles_from_db()
    for item in bundles:
        locale = str(item.get("locale", "")).strip().lower()
        entries = item.get("entries")
        if not locale or not isinstance(entries, dict):
            continue
        target_entries = merged_texts_by_locale.setdefault(locale, {})
        for key, value in entries.items():
            if not isinstance(key, str) or not isinstance(value, str):
                continue
            normalized_key = key.strip()
            normalized_value = value.strip()
            if not normalized_key or not normalized_value:
                continue
            target_entries[normalized_key] = normalized_value
    all_keys = set(labels_by_key.keys())
    for by_key in merged_texts_by_locale.values():
        all_keys.update(by_key.keys())
    tree = _build_frontend_translation_tree(
        keys=all_keys,
        texts_by_locale=merged_texts_by_locale,
        labels_by_key=labels_by_key,
    )
    target.write_text(json.dumps(tree, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return target, len(all_keys)


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


def _migrate_procurement_to_typed() -> dict[str, int]:
    from .database import engine

    migrated_rows = 0
    migrated_scalar_updates = 0
    migrated_person_links = 0
    migrated_team_links = 0

    with engine.begin() as conn:
        required_tables = (
            "COORDINATION_PROCUREMENT_DATA",
            "COORDINATION_PROCUREMENT_FIELD_TEMPLATE",
            "COORDINATION_PROCUREMENT_TYPED_DATA",
            "COORDINATION_PROCUREMENT_TYPED_DATA_PERSON_LIST",
            "COORDINATION_PROCUREMENT_TYPED_DATA_TEAM_LIST",
        )
        for table_name in required_tables:
            exists = conn.execute(
                text(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")
            ).scalar_one_or_none()
            if not exists:
                return {
                    "migrated_rows": migrated_rows,
                    "migrated_scalar_updates": migrated_scalar_updates,
                    "migrated_person_links": migrated_person_links,
                    "migrated_team_links": migrated_team_links,
                }

        value_rows = conn.execute(
            text(
                'SELECT d."ID" AS data_id, d."COORDINATION_ID" AS coordination_id, d."ORGAN_ID" AS organ_id, '
                'd."SLOT_KEY" AS slot_key, d."VALUE" AS value_text, d."EPISODE_ID" AS episode_id, '
                'd."CHANGED_BY" AS changed_by_id, d."CREATED_AT" AS created_at, d."UPDATED_AT" AS updated_at, '
                'f."KEY" AS field_key '
                'FROM "COORDINATION_PROCUREMENT_DATA" d '
                'JOIN "COORDINATION_PROCUREMENT_FIELD_TEMPLATE" f ON f."ID" = d."FIELD_TEMPLATE_ID"'
            )
        ).mappings().all()
        if not value_rows:
            return {
                "migrated_rows": migrated_rows,
                "migrated_scalar_updates": migrated_scalar_updates,
                "migrated_person_links": migrated_person_links,
                "migrated_team_links": migrated_team_links,
            }

        scalar_sql_by_field_key = {
            "AMBULANCE_ARRIVAL_TIME": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "AMBULANCE_ARRIVAL_TIME" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "INFORMED_TIME": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "INFORMED_TIME" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "INCISION_TIME": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "INCISION_TIME" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "CARDIAC_ARREST_TIME": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "CARDIAC_ARREST_TIME" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "COLD_PERFUSION": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "COLD_PERFUSION" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "COLD_PERFUSION_ABDOMINAL": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "COLD_PERFUSION_ABDOMINAL" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "EHB_BOX_NR": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "EHB_BOX_NR" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "EHB_NR": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "EHB_NR" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "REACHED_TIME": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "REACHED_TIME" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "INFORMED_IMPLANTTEAM_TIME": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "INFORMED_IMPLANTTEAM_TIME" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "INCISION_DONOR_TIME": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "INCISION_DONOR_TIME" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "CROSS_CLAMP_TIME": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "CROSS_CLAMP_TIME" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "PROCUREMENT_TEAM_DEPARTURE_TIME": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "PROCUREMENT_TEAM_DEPARTURE_TIME" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "DEPARTURE_DONOR_TIME": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "DEPARTURE_DONOR_TIME" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "ARRIVAL_TIME": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "ARRIVAL_TIME" = :value_text, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "NMP_USED": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "NMP_USED" = CASE WHEN trim(lower(:value_text)) IN (\'1\',\'true\',\'yes\',\'y\',\'on\') THEN 1 WHEN trim(:value_text) = \'\' THEN NULL ELSE 0 END, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "EVLP_USED": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "EVLP_USED" = CASE WHEN trim(lower(:value_text)) IN (\'1\',\'true\',\'yes\',\'y\',\'on\') THEN 1 WHEN trim(:value_text) = \'\' THEN NULL ELSE 0 END, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "HOPE_USED": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "HOPE_USED" = CASE WHEN trim(lower(:value_text)) IN (\'1\',\'true\',\'yes\',\'y\',\'on\') THEN 1 WHEN trim(:value_text) = \'\' THEN NULL ELSE 0 END, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "LIFEPORT_USED": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "LIFEPORT_USED" = CASE WHEN trim(lower(:value_text)) IN (\'1\',\'true\',\'yes\',\'y\',\'on\') THEN 1 WHEN trim(:value_text) = \'\' THEN NULL ELSE 0 END, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
            "RECIPIENT": 'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" SET "RECIPIENT_EPISODE_ID" = :episode_id, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id',
        }

        for row in value_rows:
            payload = {
                "coordination_id": row["coordination_id"],
                "organ_id": row["organ_id"],
                "slot_key": row["slot_key"] or "MAIN",
                "changed_by_id": row["changed_by_id"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
            before_count = conn.execute(
                text(
                    'SELECT COUNT(*) FROM "COORDINATION_PROCUREMENT_TYPED_DATA" '
                    'WHERE "COORDINATION_ID" = :coordination_id AND "ORGAN_ID" = :organ_id AND "SLOT_KEY" = :slot_key'
                ),
                payload,
            ).scalar_one()
            conn.execute(
                text(
                    'INSERT OR IGNORE INTO "COORDINATION_PROCUREMENT_TYPED_DATA" ('
                    '"COORDINATION_ID","ORGAN_ID","SLOT_KEY","CHANGED_BY","CREATED_AT","UPDATED_AT","ROW_VERSION"'
                    ') VALUES (:coordination_id,:organ_id,:slot_key,:changed_by_id,:created_at,:updated_at,1)'
                ),
                payload,
            )
            after_count = conn.execute(
                text(
                    'SELECT COUNT(*) FROM "COORDINATION_PROCUREMENT_TYPED_DATA" '
                    'WHERE "COORDINATION_ID" = :coordination_id AND "ORGAN_ID" = :organ_id AND "SLOT_KEY" = :slot_key'
                ),
                payload,
            ).scalar_one()
            if int(after_count) > int(before_count):
                migrated_rows += 1
            typed_id = conn.execute(
                text(
                    'SELECT "ID" FROM "COORDINATION_PROCUREMENT_TYPED_DATA" '
                    'WHERE "COORDINATION_ID" = :coordination_id AND "ORGAN_ID" = :organ_id AND "SLOT_KEY" = :slot_key'
                ),
                payload,
            ).scalar_one()

            field_key = row["field_key"]
            if field_key in scalar_sql_by_field_key:
                conn.execute(
                    text(scalar_sql_by_field_key[field_key]),
                    {
                        "typed_id": typed_id,
                        "value_text": row["value_text"] or "",
                        "episode_id": row["episode_id"],
                        "changed_by_id": row["changed_by_id"],
                    },
                )
                migrated_scalar_updates += 1

            if field_key in {"ARZT_RESPONSIBLE", "CHIRURG_RESPONSIBLE", "ON_SITE_COORDINATORS", "PROCUREMENT_TEAM_INT"}:
                person_rows = conn.execute(
                    text(
                        'SELECT "PERSON_ID" AS person_id, "POS" AS pos, "ID" AS id FROM "COORDINATION_PROCUREMENT_DATA_PERSON" '
                        'WHERE "DATA_ID" = :data_id ORDER BY "POS", "ID"'
                    ),
                    {"data_id": row["data_id"]},
                ).mappings().all()
                if field_key == "ARZT_RESPONSIBLE" and person_rows:
                    conn.execute(
                        text(
                            'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" '
                            'SET "ARZT_RESPONSIBLE_PERSON_ID" = :person_id, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id'
                        ),
                        {"typed_id": typed_id, "person_id": person_rows[0]["person_id"], "changed_by_id": row["changed_by_id"]},
                    )
                    migrated_scalar_updates += 1
                elif field_key == "CHIRURG_RESPONSIBLE" and person_rows:
                    conn.execute(
                        text(
                            'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" '
                            'SET "CHIRURG_RESPONSIBLE_PERSON_ID" = :person_id, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id'
                        ),
                        {"typed_id": typed_id, "person_id": person_rows[0]["person_id"], "changed_by_id": row["changed_by_id"]},
                    )
                    migrated_scalar_updates += 1
                elif field_key in {"ON_SITE_COORDINATORS", "PROCUREMENT_TEAM_INT"}:
                    list_key = field_key
                    for person_row in person_rows:
                        before_count = conn.execute(
                            text(
                                'SELECT COUNT(*) FROM "COORDINATION_PROCUREMENT_TYPED_DATA_PERSON_LIST" '
                                'WHERE "DATA_ID" = :data_id AND "LIST_KEY" = :list_key AND "PERSON_ID" = :person_id'
                            ),
                            {"data_id": typed_id, "list_key": list_key, "person_id": person_row["person_id"]},
                        ).scalar_one()
                        conn.execute(
                            text(
                                'INSERT OR IGNORE INTO "COORDINATION_PROCUREMENT_TYPED_DATA_PERSON_LIST" ('
                                '"DATA_ID","LIST_KEY","PERSON_ID","POS","CHANGED_BY","CREATED_AT","UPDATED_AT","ROW_VERSION"'
                                ') VALUES (:data_id,:list_key,:person_id,:pos,:changed_by_id,:created_at,:updated_at,1)'
                            ),
                            {
                                "data_id": typed_id,
                                "list_key": list_key,
                                "person_id": person_row["person_id"],
                                "pos": person_row["pos"] or 0,
                                "changed_by_id": row["changed_by_id"],
                                "created_at": row["created_at"],
                                "updated_at": row["updated_at"],
                            },
                        )
                        after_count = conn.execute(
                            text(
                                'SELECT COUNT(*) FROM "COORDINATION_PROCUREMENT_TYPED_DATA_PERSON_LIST" '
                                'WHERE "DATA_ID" = :data_id AND "LIST_KEY" = :list_key AND "PERSON_ID" = :person_id'
                            ),
                            {"data_id": typed_id, "list_key": list_key, "person_id": person_row["person_id"]},
                        ).scalar_one()
                        if int(after_count) > int(before_count):
                            migrated_person_links += 1

            if field_key in {"PROCURMENT_TEAM", "IMPLANT_TEAM"}:
                team_rows = conn.execute(
                    text(
                        'SELECT "TEAM_ID" AS team_id, "POS" AS pos, "ID" AS id FROM "COORDINATION_PROCUREMENT_DATA_TEAM" '
                        'WHERE "DATA_ID" = :data_id ORDER BY "POS", "ID"'
                    ),
                    {"data_id": row["data_id"]},
                ).mappings().all()
                if field_key == "PROCURMENT_TEAM" and team_rows:
                    conn.execute(
                        text(
                            'UPDATE "COORDINATION_PROCUREMENT_TYPED_DATA" '
                            'SET "PROCURMENT_TEAM_TEAM_ID" = :team_id, "CHANGED_BY" = :changed_by_id WHERE "ID" = :typed_id'
                        ),
                        {"typed_id": typed_id, "team_id": team_rows[0]["team_id"], "changed_by_id": row["changed_by_id"]},
                    )
                    migrated_scalar_updates += 1
                elif field_key == "IMPLANT_TEAM":
                    list_key = "IMPLANT_TEAM"
                    for team_row in team_rows:
                        before_count = conn.execute(
                            text(
                                'SELECT COUNT(*) FROM "COORDINATION_PROCUREMENT_TYPED_DATA_TEAM_LIST" '
                                'WHERE "DATA_ID" = :data_id AND "LIST_KEY" = :list_key AND "TEAM_ID" = :team_id'
                            ),
                            {"data_id": typed_id, "list_key": list_key, "team_id": team_row["team_id"]},
                        ).scalar_one()
                        conn.execute(
                            text(
                                'INSERT OR IGNORE INTO "COORDINATION_PROCUREMENT_TYPED_DATA_TEAM_LIST" ('
                                '"DATA_ID","LIST_KEY","TEAM_ID","POS","CHANGED_BY","CREATED_AT","UPDATED_AT","ROW_VERSION"'
                                ') VALUES (:data_id,:list_key,:team_id,:pos,:changed_by_id,:created_at,:updated_at,1)'
                            ),
                            {
                                "data_id": typed_id,
                                "list_key": list_key,
                                "team_id": team_row["team_id"],
                                "pos": team_row["pos"] or 0,
                                "changed_by_id": row["changed_by_id"],
                                "created_at": row["created_at"],
                                "updated_at": row["updated_at"],
                            },
                        )
                        after_count = conn.execute(
                            text(
                                'SELECT COUNT(*) FROM "COORDINATION_PROCUREMENT_TYPED_DATA_TEAM_LIST" '
                                'WHERE "DATA_ID" = :data_id AND "LIST_KEY" = :list_key AND "TEAM_ID" = :team_id'
                            ),
                            {"data_id": typed_id, "list_key": list_key, "team_id": team_row["team_id"]},
                        ).scalar_one()
                        if int(after_count) > int(before_count):
                            migrated_team_links += 1

    return {
        "migrated_rows": migrated_rows,
        "migrated_scalar_updates": migrated_scalar_updates,
        "migrated_person_links": migrated_person_links,
        "migrated_team_links": migrated_team_links,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Data management (DML only).")
    parser.add_argument(
        "--mode",
        choices=("clean", "seed", "refresh", "migrate-procurement-runtime", "migrate-procurement-typed", "export-translations-json"),
        default="refresh",
        help="clean=wipe data, seed=seed only, refresh=clean+seed, migrate-procurement-runtime=backfill legacy procurement runtime, migrate-procurement-typed=backfill typed procurement model from generic runtime rows, export-translations-json=write DB translations to frontend/src/i18n/translations.json",
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

    if args.mode == "migrate-procurement-typed":
        result = _migrate_procurement_to_typed()
        print(
            "Procurement typed migration complete: "
            + f"rows={result['migrated_rows']} "
            + f"scalar_updates={result['migrated_scalar_updates']} "
            + f"person_links={result['migrated_person_links']} "
            + f"team_links={result['migrated_team_links']}"
        )

    if args.mode == "export-translations-json":
        output_path, key_count = _export_translation_json_from_db()
        print(f"Frontend translations exported: {output_path} (keys: {key_count})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
