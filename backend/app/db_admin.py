from __future__ import annotations

import argparse
import os
import subprocess
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description="Convenience wrapper for schema + data workflows.")
    parser.add_argument(
        "--mode",
        choices=("recreate", "migrate", "refresh", "clean"),
        default="refresh",
        help="recreate=drop/create+seed, migrate=schema only, refresh=migrate+clean+seed, clean=data only",
    )
    parser.add_argument("--env", default=os.getenv("TPL_ENV", "DEV"), help="Application env (DEV/TEST/PROD)")
    parser.add_argument("--seed-profile", default=os.getenv("TPL_SEED_PROFILE"), help="Optional seed profile override")
    parser.add_argument("--db-url", default=None, help="Optional DB URL override")
    args = parser.parse_args()

    def run(module: str, module_args: list[str]) -> int:
        cmd = [sys.executable, "-m", module, *module_args]
        proc = subprocess.run(cmd, check=False)
        return int(proc.returncode)

    db_url_args = ["--db-url", args.db_url] if args.db_url else []
    seed_args = ["--seed-profile", args.seed_profile] if args.seed_profile else []

    if args.mode == "recreate":
        code = run("app.db_schema", ["--mode", "recreate", "--env", args.env, *db_url_args])
        if code != 0:
            return code
        return run("app.db_data", ["--mode", "seed", "--env", args.env, *seed_args, *db_url_args])

    if args.mode == "migrate":
        return run("app.db_schema", ["--mode", "migrate", "--env", args.env, *db_url_args])

    if args.mode == "clean":
        return run("app.db_data", ["--mode", "clean", "--env", args.env, *db_url_args])

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
