# Test Manual

This manual explains how testing works in TPL-App, where test files live, how to create new tests, how to run them, and how to evaluate results.

For specification authoring conventions and structure, see `doc/specification-manual.md`.

## 1) Test Structure

The project uses two complementary testing workflows:

- **Spec-derived API checks** (lightweight HTTP assertions)
- **Partner-driven UI + DB scenarios** (Playwright + SQLite verification)

Main folders:

- Specification files: `spec/server/`, `spec/client-server/`
- Test tooling: `qa/spec_tools/`
- Executable frontend browser tests: `frontend/test/`
- Generated/temporary outputs:
  - `qa/tests/generated/`
  - `qa/reports/`
  - `frontend/test-results/`
  - `frontend/playwright-report/`

## 2) Why `frontend/test/` (renamed from `e2e`)

Executable frontend scenario tests are stored in `frontend/test/` for a clear, conventional location and simpler discovery.

Playwright is configured in:

- `frontend/playwright.spec.config.ts`

## 3) Git Ignore Decision

The following outputs are excluded from Git (in root `.gitignore`):

- `frontend/test-results/`
- `frontend/playwright-report/`
- `qa/reports/`
- `qa/tests/generated/`

Reason:

- These are run artifacts or generated files, not source-of-truth specifications.
- Avoids noisy diffs and keeps commits focused on specs + tooling + application code.

## 4) How To Add Coverage

### A) Add or update a human-readable spec

Create a new Markdown file under:

- `spec/server/` for server-only behavior
- `spec/client-server/` for cross-layer behavior

Specification format details live in `doc/specification-manual.md`.

### B) Add/extend executable scenario logic (only for partner scenarios)

For browser-driven flows, add or update a Playwright test in:

- `frontend/test/`

Current example:

- `frontend/test/create-patient-from-recipients.spec.ts`

## 5) How To Run Tests

From repository root:

### Standard spec pipeline

```bash
python -m qa.spec_tools.run_specs
```

This regenerates tests from specs and runs generated checks.

### Partner-driven scenario pipeline

```bash
python -m qa.spec_tools.run_partner_specs
```

This runs Playwright UI flow(s), then verifies DB persistence where defined.

## 6) How To Evaluate Results

Reports are written to:

- `qa/reports/latest-spec-report.md`
- `qa/reports/latest-partner-report.md`

Each report includes:

- execution summary
- failure excerpt
- suggestion list with action IDs

## 7) How To Execute Suggestions Step-by-Step

Run:

```bash
python -m qa.spec_tools.run_suggestions --report qa/reports/latest-spec-report.md
python -m qa.spec_tools.run_suggestions --report qa/reports/latest-partner-report.md
```

Then apply one suggestion at a time and rerun the respective pipeline.

## 8) Typical Local Sequence

1. Start backend (`doc/server-manual.md`)
2. Start frontend (`doc/client-manual.md`)
3. Run partner specs
4. Read partner report
5. Execute suggestions
6. Rerun until green

## 9) Related Manuals

- `doc/specification-manual.md`
- `doc/server-manual.md`
- `doc/client-manual.md`
- `doc/seeding-manual.md`
