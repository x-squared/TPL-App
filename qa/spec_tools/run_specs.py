from __future__ import annotations

import datetime as dt
import re
import subprocess
import sys
from pathlib import Path

from .generate_tests import PROJECT_ROOT, generate

REPORT_DIR = PROJECT_ROOT / "qa" / "reports"
LATEST_REPORT = REPORT_DIR / "latest-spec-report.md"


def _collect_suggestions(output: str, exit_code: int) -> list[tuple[str, str, str]]:
    suggestions: list[tuple[str, str, str]] = []

    if exit_code == 0:
        return [
            (
                "MAINTAIN_SPEC_COVERAGE",
                "All generated spec tests are passing",
                "Add additional spec cases for new features and rerun the pipeline.",
            )
        ]

    if "Connection refused" in output and ":8000" in output:
        suggestions.append(
            (
                "START_BACKEND",
                "Start backend server and rerun specs",
                "From repo root: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload`",
            )
        )
    if "Connection refused" in output and ":5173" in output:
        suggestions.append(
            (
                "START_FRONTEND",
                "Start frontend dev server and rerun specs",
                "From repo root: `cd frontend && npm run dev`",
            )
        )
    if "Unexpected HTTP status" in output:
        suggestions.append(
            (
                "CHECK_ROUTE_OR_CONTRACT",
                "Review failing endpoint path and expected status/json in spec",
                "Compare `spec/**/*.md` expectations with current route implementation.",
            )
        )
    if not suggestions:
        suggestions.append(
            (
                "REVIEW_FAILURE_LOG",
                "Inspect failure log and update spec or code",
                "Read this report's failure excerpt and address the first failing case.",
            )
        )
    return suggestions


def _write_report(exit_code: int, output: str, generated_summary: dict[str, int]) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    suggestions = _collect_suggestions(output, exit_code)
    failures = len(re.findall(r"FAIL:|ERROR:", output))

    lines: list[str] = []
    lines.append("# Specification Test Report")
    lines.append("")
    lines.append(f"- Generated at: `{now}`")
    lines.append(f"- Exit code: `{exit_code}`")
    lines.append(f"- Spec cases: total `{generated_summary['total']}`, server `{generated_summary['server']}`, client-server `{generated_summary['client_server']}`")
    lines.append(f"- Failure markers found: `{failures}`")
    lines.append("")
    lines.append("## Suggestion List")
    lines.append("")
    for action_id, title, details in suggestions:
        lines.append(f"- `{action_id}`: **{title}** - {details}")
    lines.append("")
    lines.append("## Test Output Excerpt")
    lines.append("")
    excerpt = output[-4000:] if len(output) > 4000 else output
    lines.append("```text")
    lines.append(excerpt.rstrip())
    lines.append("```")
    lines.append("")
    lines.append("## How To Execute Suggestions")
    lines.append("")
    lines.append("Run:")
    lines.append("")
    lines.append("```bash")
    lines.append("cd /path/to/TPL-App")
    lines.append("python -m qa.spec_tools.run_suggestions --report qa/reports/latest-spec-report.md")
    lines.append("```")

    LATEST_REPORT.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    generated_summary = generate()
    cmd = [sys.executable, "-m", "unittest", "discover", "-s", "qa/tests/generated", "-p", "test_*.py", "-v"]
    proc = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True)
    output = (proc.stdout or "") + "\n" + (proc.stderr or "")
    _write_report(proc.returncode, output, generated_summary)
    print(f"Report written: {LATEST_REPORT}")
    print(output)
    return proc.returncode


if __name__ == "__main__":
    raise SystemExit(main())
