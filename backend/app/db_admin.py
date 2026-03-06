from __future__ import annotations

import argparse
import os
import subprocess
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description="Convenience wrapper for schema + data workflows.")
    parser.add_argument(
        "--mode",
        choices=(
            "recreate",
            "migrate",
            "refresh",
            "clean",
            "migrate-audit-fields",
            "migrate-medical-value-units",
            "verify-medical-value-units",
            "migrate-procurement-runtime",
            "migrate-procurement-typed",
            "clear-translation-bundles",
        ),
        default="refresh",
        help="recreate=drop/create+seed, migrate=schema only, refresh=migrate+clean+seed, clean=data only, migrate-audit-fields=add/backfill CREATED_BY from CHANGED_BY, migrate-medical-value-units=add/backfill LOINC+UCUM medical value columns, verify-medical-value-units=read-only LOINC+UCUM coverage verification, migrate-procurement-runtime=legacy->unified procurement backfill, migrate-procurement-typed=unified->typed procurement backfill, clear-translation-bundles=delete DB translation overrides",
    )
    parser.add_argument("--env", default=os.getenv("TPL_ENV", "DEV"), help="Application env (DEV/TEST/PROD)")
    parser.add_argument("--seed-profile", default=os.getenv("TPL_SEED_PROFILE"), help="Optional seed profile override")
    parser.add_argument("--db-url", default=None, help="Optional DB URL override")
    parser.add_argument(
        "--migration-check-level",
        choices=("basic", "strict"),
        default="strict",
        help="Schema verification depth used after db_data migration modes",
    )
    args = parser.parse_args()

    def run(module: str, module_args: list[str]) -> int:
        cmd = [sys.executable, "-m", module, *module_args]
        proc = subprocess.run(cmd, check=False)
        return int(proc.returncode)

    db_url_args = ["--db-url", args.db_url] if args.db_url else []
    seed_args = ["--seed-profile", args.seed_profile] if args.seed_profile else []
    migration_check_args = ["--migration-check-level", args.migration_check_level]

    if args.mode == "recreate":
        code = run("app.db_schema", ["--mode", "recreate", "--env", args.env, *db_url_args])
        if code != 0:
            return code
        return run("app.db_data", ["--mode", "seed", "--env", args.env, *seed_args, *db_url_args])

    if args.mode == "migrate":
        return run("app.db_schema", ["--mode", "migrate", "--env", args.env, *db_url_args])

    if args.mode == "clean":
        return run("app.db_data", ["--mode", "clean", "--env", args.env, *db_url_args])

    if args.mode == "migrate-procurement-runtime":
        return run(
            "app.db_data",
            ["--mode", "migrate-procurement-runtime", "--env", args.env, *migration_check_args, *db_url_args],
        )

    if args.mode == "migrate-procurement-typed":
        return run(
            "app.db_data",
            ["--mode", "migrate-procurement-typed", "--env", args.env, *migration_check_args, *db_url_args],
        )

    if args.mode == "migrate-audit-fields":
        return run(
            "app.db_data",
            ["--mode", "migrate-audit-fields", "--env", args.env, *migration_check_args, *db_url_args],
        )

    if args.mode == "migrate-medical-value-units":
        return run(
            "app.db_data",
            ["--mode", "migrate-medical-value-units", "--env", args.env, *migration_check_args, *db_url_args],
        )

    if args.mode == "verify-medical-value-units":
        return run(
            "app.db_data",
            ["--mode", "verify-medical-value-units", "--env", args.env, *db_url_args],
        )

    if args.mode == "clear-translation-bundles":
        return run("app.db_data", ["--mode", "clear-translation-bundles", "--env", args.env, *db_url_args])

    # Default: refresh = migrate + clean + seed.
    # If migrate cannot reconcile schema drift (e.g. missing columns on SQLite),
    # refresh falls back to recreate because refresh already implies data reset.
    migrate_code = run("app.db_schema", ["--mode", "migrate", "--env", args.env, *db_url_args])
    if migrate_code != 0:
        recreate_code = run("app.db_schema", ["--mode", "recreate", "--env", args.env, *db_url_args])
        if recreate_code != 0:
            return recreate_code
    return run("app.db_data", ["--mode", "refresh", "--env", args.env, *seed_args, *db_url_args])


if __name__ == "__main__":
    raise SystemExit(main())
