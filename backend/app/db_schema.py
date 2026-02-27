from __future__ import annotations

import argparse
import os
from dataclasses import dataclass

from sqlalchemy import inspect


@dataclass
class SchemaRuntime:
    engine: object
    base: object


def _configure_env(*, app_env: str | None, database_url: str | None) -> None:
    if app_env:
        os.environ["TPL_ENV"] = app_env
    if database_url:
        os.environ["TPL_DATABASE_URL"] = database_url


def _load_runtime() -> SchemaRuntime:
    from . import models  # noqa: F401 - ensure model metadata is registered
    from .database import Base, engine

    return SchemaRuntime(engine=engine, base=Base)


def _verify(runtime: SchemaRuntime) -> tuple[list[str], list[str]]:
    insp = inspect(runtime.engine)
    db_tables = set(insp.get_table_names())
    model_tables = set(runtime.base.metadata.tables.keys())

    missing_tables = sorted(model_tables - db_tables)
    missing_columns: list[str] = []

    for table_name in sorted(model_tables & db_tables):
        db_cols = {entry["name"] for entry in insp.get_columns(table_name)}
        model_cols = {column.name for column in runtime.base.metadata.tables[table_name].columns}
        for col in sorted(model_cols - db_cols):
            missing_columns.append(f"{table_name}.{col}")

    return missing_tables, missing_columns


def main() -> int:
    parser = argparse.ArgumentParser(description="Schema management (DDL only).")
    parser.add_argument(
        "--mode",
        choices=("recreate", "migrate", "verify"),
        default="migrate",
        help="recreate=drop/create, migrate=create missing, verify=drift check only",
    )
    parser.add_argument("--env", default=os.getenv("TPL_ENV", "DEV"), help="Application env (DEV/TEST/PROD)")
    parser.add_argument("--db-url", default=None, help="Optional DB URL override")
    args = parser.parse_args()

    _configure_env(app_env=args.env, database_url=args.db_url)
    runtime = _load_runtime()

    if args.mode == "recreate":
        runtime.base.metadata.drop_all(bind=runtime.engine)
        runtime.base.metadata.create_all(bind=runtime.engine)
        print("Schema recreated (drop + create).")
        return 0

    if args.mode == "migrate":
        runtime.base.metadata.create_all(bind=runtime.engine)
        missing_tables, missing_columns = _verify(runtime)
        if missing_tables or missing_columns:
            print("Schema migrate incomplete: database still differs from current model metadata.")
            if missing_tables:
                print("Missing tables after migrate:")
                for item in missing_tables:
                    print(f"  - {item}")
            if missing_columns:
                print("Missing columns after migrate:")
                for item in missing_columns:
                    print(f"  - {item}")
            print("Hint: run with --mode recreate for a full rebuild.")
            return 2
        print("Schema migrated successfully.")
        return 0

    missing_tables, missing_columns = _verify(runtime)
    if not missing_tables and not missing_columns:
        print("Schema verify OK: database matches current model metadata.")
        return 0
    if missing_tables:
        print("Missing tables:")
        for item in missing_tables:
            print(f"  - {item}")
    if missing_columns:
        print("Missing columns:")
        for item in missing_columns:
            print(f"  - {item}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
