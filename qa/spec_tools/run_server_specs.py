from __future__ import annotations

import datetime as dt
import re
import subprocess
import sys

from .case_results import collect_case_results, source_link_from_report
from .generate_tests import PROJECT_ROOT, generate


REPORT_DIR = PROJECT_ROOT / "qa" / "reports"
LATEST_REPORT = REPORT_DIR / "latest-server-spec-report.md"


def _collect_suggestions(output: str, exit_code: int) -> list[tuple[str, str, str]]:
    suggestions: list[tuple[str, str, str]] = []
    if exit_code == 0:
        return [
            (
                "MAINTAIN_SERVER_SPEC_COVERAGE",
                "All server spec tests are passing",
                "Add additional server spec cases for new backend behavior and rerun the pipeline.",
            )
        ]
    if "Connection refused" in output and ":8000" in output:
        suggestions.append(
            (
                "START_BACKEND",
                "Start backend server and rerun server specs",
                "From repo root: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload`",
            )
        )
    if "Unexpected HTTP status" in output:
        suggestions.append(
            (
                "CHECK_SERVER_ROUTE_OR_CONTRACT",
                "Review failing backend endpoint path and expectation",
                "Compare `spec/testing/server/*.md` with current route implementation.",
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


def _write_report(
    exit_code: int,
    output: str,
    generated_summary: dict[str, int],
    case_results: list,
) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    suggestions = _collect_suggestions(output, exit_code)
    failures = len(re.findall(r"FAIL:|ERROR:", output))
    lines: list[str] = []
    lines.append("# Server Specification Test Report")
    lines.append("")
    lines.append(f"- Generated at: `{now}`")
    lines.append(f"- Exit code: `{exit_code}`")
    lines.append(f"- Server spec cases: `{generated_summary['server']}`")
    lines.append(f"- Failure markers found: `{failures}`")
    lines.append("")
    lines.append("## Suggestion List")
    lines.append("")
    for action_id, title, details in suggestions:
        lines.append(f"- `{action_id}`: **{title}** - {details}")
    lines.append("")
    lines.append("## Test Case Results")
    lines.append("")
    for result in case_results:
        source_link = source_link_from_report(result.source_file)
        details = f" - {result.message}" if result.message else ""
        lines.append(
            f"- `{result.case_id}` | **{result.status}** | {result.name}{details} | [Testcase document]({source_link})"
        )
    lines.append("")
    lines.append("## Test Output Excerpt")
    lines.append("")
    excerpt = output[-4000:] if len(output) > 4000 else output
    lines.append("```text")
    lines.append(excerpt.rstrip())
    lines.append("```")
    LATEST_REPORT.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    generated_summary = generate()
    case_results = collect_case_results(scope="server")
    cmd = [sys.executable, "-m", "unittest", "qa.tests.generated.test_server_specs", "-v"]
    proc = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True)
    output = (proc.stdout or "") + "\n" + (proc.stderr or "")
    _write_report(proc.returncode, output, generated_summary, case_results)
    print(f"Report written: {LATEST_REPORT}")
    print(output)
    return proc.returncode


if __name__ == "__main__":
    raise SystemExit(main())
