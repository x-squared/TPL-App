# Report Builder Manual

This manual explains how the Reports builder works in TPL-App, how joins are handled, and where the implementation lives in source code.

## 1) What the Report Builder does

The `Reports` view lets you build ad-hoc tabular queries from predefined sources.

Current source entities:

- `PATIENT`
- `EPISODE`
- `COORDINATION`

For each source, you can:

- choose the source
- optionally enable joins (predefined relation paths)
- pick columns
- add filters
- set row limit
- run and inspect results

## 2) How to use the UI

Open:

- Sidebar -> `Reports`

Then in **Query Builder**:

1. Select a **Source**
2. (Optional) select one or more **Joins**
3. Select **Columns** (or use `Select all`)
4. Add **Filters** with field/operator/value
5. Set **Limit**
6. Click **Run report**

Results appear in the **Results** section.

## 3) Join model (important)

Joins are not arbitrary SQL joins typed by the user.
They are **curated join options** exposed by backend metadata for each source.

Important: this "metadata catalogue" is code-defined (not DB `CATALOGUE` rows). It is generated from the report feature module (`backend/app/features/reports/**`) and exposed by the reports router.

Why:

- keeps behavior deterministic and safe
- keeps UI simple
- avoids invalid join combinations
- allows complex multi-hop paths where useful

Example implemented path:

- For `COORDINATION`, there are join options that traverse:
  - `coordination -> coordination_episodes`
  - `coordination -> coordination_episodes -> episode -> patient`

Some of these fields are aggregated into one row-per-source-record output (for example, unique joined text values).

## 4) Filter and type behavior

Field types drive allowed operators:

- `string` -> `eq`, `contains`
- `number` -> `eq`, `gte`, `lte`
- `date` -> `eq`, `gte`, `lte`
- `datetime` -> `gte`, `lte`
- `boolean` -> `eq`

The backend validates operator/value compatibility and returns `422` for invalid combinations.

## 5) Result semantics

- Output is row-oriented by selected source.
- Joined fields are rendered as strings in response rows.
- Date/datetime values are serialized in ISO format.
- Row count shown in UI is count of returned rows after filtering/sorting/limit.
- For multi-organ episodes, the episode source provides both `Primary Organ` and aggregated `Organs`.

## 6) Where to find the relevant sources

### Frontend (Reports UI + state + API typing)

- View entry:
  - `frontend/src/views/ReportsView.tsx`
- Builder UI:
  - `frontend/src/features/reports/ReportsBuilder.tsx`
- View model/state logic:
  - `frontend/src/features/reports/useReportsViewModel.ts`
- Styles:
  - `frontend/src/features/reports/ReportsView.css`
- Typed API client:
  - `frontend/src/api/reports.ts`
- API export aggregation:
  - `frontend/src/api/index.ts`

### Backend (metadata + execution engine)

- Router (metadata + execute endpoints):
  - `backend/app/routers/reports_router.py`
- Feature implementation:
  - `backend/app/features/reports/engine.py`
  - `backend/app/features/reports/types.py`
  - `backend/app/features/reports/sources/patient.py`
  - `backend/app/features/reports/sources/episode.py`
  - `backend/app/features/reports/sources/coordination.py`
- Schemas (request/response + metadata contracts):
  - `backend/app/schema/report.py`
  - exported through `backend/app/schema/__init__.py`
- Router registration:
  - `backend/app/routers/registry.py`

### Domain models used by report joins

- Model facade:
  - `backend/app/models.py`
- Entity definitions:
  - `backend/app/model/patient.py`
  - `backend/app/model/episode.py`
  - `backend/app/model/coordination.py`
  - `backend/app/model/coordination_donor.py`
  - `backend/app/model/coordination_episode.py`

## 7) How to extend with a new join

1. Add a `JoinDef` to the relevant source in `backend/app/routers/reports.py`
2. Add `FieldDef` entries for the join fields (getter functions included)
3. Ensure query uses needed `joinedload(...)` paths
4. Restart backend
5. Open `Reports`; join appears automatically via metadata

No frontend code change is needed for typical new joins because UI is metadata-driven.

## 8) Troubleshooting

- Join not visible:
  - restart backend and reload client
  - verify `/api/reports/metadata` includes the join
- Filter errors (`422`):
  - check field type vs operator
  - check value format (`YYYY-MM-DD` for `date`)
- Missing expected related values:
  - verify source record has related data in DB
  - verify join getter logic in `reports.py`
