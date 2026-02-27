from __future__ import annotations

import argparse
import os

from sqlalchemy import MetaData, text


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


def _seed(*, app_env: str | None, seed_profile: str | None) -> dict[str, object]:
    from .database import SessionLocal
    from .seed import run_seed_profile

    db = SessionLocal()
    try:
        return run_seed_profile(db, app_env=app_env, seed_profile=seed_profile)
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Data management (DML only).")
    parser.add_argument(
        "--mode",
        choices=("clean", "seed", "refresh"),
        default="refresh",
        help="clean=wipe data, seed=seed only, refresh=clean+seed",
    )
    parser.add_argument("--env", default=os.getenv("TPL_ENV", "DEV"), help="Application env (DEV/TEST/PROD)")
    parser.add_argument("--seed-profile", default=os.getenv("TPL_SEED_PROFILE"), help="Optional seed profile override")
    parser.add_argument("--db-url", default=None, help="Optional DB URL override")
    args = parser.parse_args()

    _configure_env(app_env=args.env, database_url=args.db_url, seed_profile=args.seed_profile)

    if args.mode in {"clean", "refresh"}:
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

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
