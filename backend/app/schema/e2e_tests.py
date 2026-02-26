from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

E2ETestRunnerKey = Literal["spec", "partner"]


class E2ETestRunnerOption(BaseModel):
    key: E2ETestRunnerKey
    label: str
    description: str


class E2ETestMetadataResponse(BaseModel):
    runners: list[E2ETestRunnerOption]


class E2ETestRunRequest(BaseModel):
    runner: E2ETestRunnerKey
    output_tail_lines: int = 160


class E2ETestRunResponse(BaseModel):
    runner: E2ETestRunnerKey
    success: bool
    exit_code: int
    started_at: datetime
    finished_at: datetime
    duration_seconds: float
    report_path: str | None
    output_tail: str
    report_excerpt: str | None
