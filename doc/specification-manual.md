# Specification Manual

This document defines how specifications are authored and maintained in TPL-App.

For test execution, reports, and suggestion handling, see `doc/test-manual.md`.

## Scope of This Manual

- Keep specifications human-readable in Markdown
- Keep them in a separate global location
- Define clear, stable expected behavior
- Keep specs independent from generated run artifacts

## Where Specification Files Live

- Server-only specs: `spec/server/*.md`
- Client-server-wide specs: `spec/client-server/*.md`

These are plain Markdown documents with structured `spec-case` blocks.

## How Specs Map To Test Pipelines

Specs are consumed by tooling in `qa/spec_tools/`, which supports:

- `spec-case` -> spec-derived HTTP checks
- `partner-case` -> partner-driven UI + DB scenarios

Operational commands are documented in `doc/test-manual.md`.

## Writing New Specs

Use fenced blocks with JSON payload:

```md
```spec-case
{
  "id": "example-id",
  "scope": "server",
  "name": "Short human-readable title",
  "request": { "method": "GET", "path": "/api/health" },
  "expect": { "status": 200, "json_subset": { "status": "ok" } }
}
```
```

Supported scope values:

- `server`
- `client_server`

For complex user-workflow scenarios that include UI interaction and DB verification, use `partner-case` blocks and execute them via `python -m qa.spec_tools.run_partner_specs`.

## Grammar of JSON Sections (JSPON/JSON)

The parser reads fenced blocks with either:

- ```` ```spec-case ```` for standard HTTP checks
- ```` ```partner-case ```` for richer scenario checks

Inside the fence, the content must be valid JSON (double quotes, no trailing commas).

### `spec-case` shape

```json
{
  "id": "string-unique-id",
  "scope": "server | client_server",
  "name": "human readable title",
  "request": {
    "method": "GET | POST | PATCH | DELETE | ...",
    "path": "/api/..."
  },
  "expect": {
    "status": 200,
    "json_subset": { "optional": "partial JSON match" },
    "body_contains": ["optional text fragment"]
  }
}
```

Required fields:

- `id`, `scope`, `request.method`, `request.path`, `expect.status`

### `partner-case` shape

`partner-case` is for workflow-style scenarios (UI + DB checks). Keep it explicit and deterministic:

- Scenario identity: `id`, `scope`, `name`
- UI intent and actions (for example `ui_flow`)
- Verifications (for example `verify.ui_...`, `verify.database_...`)

Tip: copy an existing partner case and adapt values incrementally.

### Important note on key stability vs flexibility

- For `spec-case`, keys are effectively **stable** because they are parsed into generated tests (`id`, `scope`, `request`, `expect`, etc.).
- For `partner-case`, keys like `open_recipients_view` and `database_contains_created_patient` are currently **conventions** (human-readable contract), not yet a strict machine-enforced schema.

So:

- `open_recipients_view` is a recommended, readable key (not globally reserved yet).
- `database_contains_created_patient` is also a recommended verification key (not globally reserved yet).

Best practice for now: keep these names stable across files for consistency, even though the parser does not strictly enforce them yet.

## Writing JSON By Hand (Practical Hints)

- Start from a known-good template and edit one field at a time.
- Keep `id` stable and unique (kebab-case works well).
- Use only double quotes in JSON keys/values.
- Validate from outside in:
  1) braces/brackets match,
  2) commas are correct,
  3) required fields are present.
- Prefer deterministic values:
  - stable endpoints
  - stable expected status
  - avoid fragile text unless necessary
- Keep one behavior per block; split big scenarios into multiple cases.

## How I Can Help From Our Dialogue

From your plain-language requirements, the AI assistant can:

1. Draft a first `spec-case` or `partner-case` block in Markdown,
2. Place it in the correct `spec/...` folder,
3. Generate/adjust executable tests,
4. Run the pipelines and interpret failures,
5. Produce a step-by-step improvement plan and execute fixes with you.

A good prompt style is:

- "Create a spec for X, precondition Y, expected result Z."
- "Turn this flow into a partner-case and run it."
- "Update the spec after this behavior change and rerun tests."

## How Test-Code Generation Works (In Principle)

At a high level:

1. The parser scans Markdown files in `spec/` for fenced blocks.
2. `spec-case` JSON blocks are parsed and normalized into internal case objects.
3. The generator writes executable Python `unittest` files into `qa/tests/generated/`.
4. The runner executes those tests and writes a Markdown report with suggestions.

For partner scenarios:

- `run_partner_specs.py` currently executes the Playwright scenario suite in `frontend/test/` and then performs DB verification.
- This is an intentionally flexible partner-assisted setup: the `partner-case` text guides scenario intent, while executable scenario logic currently lives in maintained Playwright tests.

## About Playwright Code Generation

There are two different things to distinguish:

1. **Playwright test execution** (what this repo does now): runs existing test files from `frontend/test/`.
2. **Playwright codegen/recorder** (optional): records browser actions and emits starter test code.

Key points:

- Playwright itself is **rule-based tooling**, not an AI model.
- Playwright codegen is generally **deterministic for a given interaction sequence**, but output can still vary when UI structure/selectors change.
- Playwright codegen runs **locally** on your machine and does **not require remote AI requests**.

In this project:

- The current pipeline does not auto-call Playwright codegen.
- Test code is maintained in-repo (`frontend/test/`) and can be authored manually or with assistant help.
- If AI assistant help is used to write or refactor tests, whether that assistant is local or remote depends on the assistant platform configuration (separate from Playwright itself).

## Copy-Paste Templates

### Template: `spec-case`

```md
```spec-case
{
  "id": "server-example-id",
  "scope": "server",
  "name": "Describe expected behavior",
  "request": {
    "method": "GET",
    "path": "/api/health"
  },
  "expect": {
    "status": 200,
    "json_subset": {
      "status": "ok"
    },
    "body_contains": [
      "ok"
    ]
  }
}
```
```

### Template: `partner-case`

```md
```partner-case
{
  "id": "partner-example-id",
  "scope": "client_server_partner",
  "name": "Describe end-to-end user workflow",
  "ui_flow": {
    "login_ext_id": "TKOORD",
    "open_recipients_view": true,
    "create_patient": {
      "pid_prefix": "AUTO",
      "first_name": "Spec",
      "name": "Patient",
      "date_of_birth": "1990-01-01"
    }
  },
  "verify": {
    "ui_contains_created_pid": true,
    "database_contains_created_patient": true
  }
}
```
```

## Authoring Guidelines

- Keep one business behavior per `id`.
- Use stable expectations (avoid brittle UI text unless required).
- Prefer deterministic data and explicit preconditions.
- For workflow cases, capture user intent and verification criteria (`ui` and `db`) clearly.

## Relationship To Other Manuals

- Server startup and env config: `doc/server-manual.md`
- Client startup and dev runtime: `doc/client-manual.md`
- Seed profiles and data categories: `doc/seeding-manual.md`
- Test workflow operations: `doc/test-manual.md`
