from __future__ import annotations

import datetime as dt
import subprocess
import sys
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import get_config
from ..database import get_db
from ..models import User
from ..schemas import (
    E2ETestMetadataResponse,
    E2ETestRunRequest,
    E2ETestRunResponse,
    E2ETestRunnerOption,
)

router = APIRouter(prefix="/e2e-tests", tags=["e2e-tests"])

PROJECT_ROOT = Path(__file__).resolve().parents[3]

RUNNERS = {
    "spec": {
        "label": "Specification tests",
        "description": "Generate and run server/client-server spec tests.",
        "module": "qa.spec_tools.run_specs",
        "report_path": PROJECT_ROOT / "qa" / "reports" / "latest-spec-report.md",
    },
    "partner": {
        "label": "Partner tests (UI + DB)",
        "description": "Run Playwright partner scenarios and verify DB persistence.",
        "module": "qa.spec_tools.run_partner_specs",
        "report_path": PROJECT_ROOT / "qa" / "reports" / "latest-partner-report.md",
    },
}


def _tail_lines(text: str, max_lines: int) -> str:
    lines = text.splitlines()
    if max_lines <= 0:
        max_lines = 1
    return "\n".join(lines[-max_lines:])


def _ensure_dev_tools_enabled() -> None:
    env = get_config().env.strip().upper()
    if env not in {"DEV", "TEST"}:
        raise HTTPException(status_code=403, detail="E2E test runner is available only in DEV/TEST mode.")


@router.get("/metadata", response_model=E2ETestMetadataResponse)
def get_e2e_test_metadata(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = (db, current_user)
    _ensure_dev_tools_enabled()
    return E2ETestMetadataResponse(
        runners=[
            E2ETestRunnerOption(
                key=key,  # type: ignore[arg-type]
                label=entry["label"],
                description=entry["description"],
            )
            for key, entry in RUNNERS.items()
        ]
    )


@router.post("/run", response_model=E2ETestRunResponse)
def run_e2e_tests(
    payload: E2ETestRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = (db, current_user)
    _ensure_dev_tools_enabled()

    runner = RUNNERS.get(payload.runner)
    if not runner:
        raise HTTPException(status_code=422, detail=f"Unknown runner '{payload.runner}'")

    started = dt.datetime.now(dt.timezone.utc)
    proc = subprocess.run(
        [sys.executable, "-m", str(runner["module"])],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
    )
    finished = dt.datetime.now(dt.timezone.utc)

    output = (proc.stdout or "") + ("\n" + proc.stderr if proc.stderr else "")
    output_tail = _tail_lines(output, payload.output_tail_lines)
    report_path = runner["report_path"]
    report_excerpt: str | None = None
    report_path_value: str | None = None
    if isinstance(report_path, Path) and report_path.exists():
        report_path_value = str(report_path.relative_to(PROJECT_ROOT))
        report_excerpt = _tail_lines(report_path.read_text(encoding="utf-8"), 120)

    return E2ETestRunResponse(
        runner=payload.runner,
        success=proc.returncode == 0,
        exit_code=proc.returncode,
        started_at=started,
        finished_at=finished,
        duration_seconds=(finished - started).total_seconds(),
        report_path=report_path_value,
        output_tail=output_tail,
        report_excerpt=report_excerpt,
    )


@router.post("/health-check/create-422")
def create_health_check_422(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = (db, current_user)
    _ensure_dev_tools_enabled()
    raise HTTPException(
        status_code=422,
        detail=[
            {
                "loc": ["body", "health_check"],
                "msg": "Health check test endpoint intentionally triggered a 422 error.",
                "type": "value_error",
            }
        ],
    )
