from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Callable, Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Coordination, Episode, Patient, User
from ..schemas import (
    ReportColumnResponse,
    ReportExecuteRequest,
    ReportExecuteResponse,
    ReportFieldOption,
    ReportFilterInput,
    ReportMetadataResponse,
    ReportSourceOption,
    ReportSortInput,
)

router = APIRouter(prefix="/reports", tags=["reports"])

OperatorKey = Literal["eq", "contains", "gte", "lte"]
ValueType = Literal["string", "number", "date", "datetime", "boolean"]


@dataclass(frozen=True)
class FieldDef:
    key: str
    label: str
    value_type: ValueType
    operators: tuple[OperatorKey, ...]
    getter: Callable[[Any], Any]


@dataclass(frozen=True)
class SourceDef:
    key: str
    label: str
    fields: tuple[FieldDef, ...]
    query: Callable[[Session], list[Any]]


def _norm_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _parse_for_compare(value_type: ValueType, raw: str) -> Any:
    if value_type == "number":
        try:
            return float(raw)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=f"Invalid numeric value '{raw}'") from exc
    if value_type == "boolean":
        lowered = raw.strip().lower()
        if lowered in {"true", "1", "yes"}:
            return True
        if lowered in {"false", "0", "no"}:
            return False
        raise HTTPException(status_code=422, detail=f"Invalid boolean value '{raw}'")
    if value_type == "date":
        try:
            return date.fromisoformat(raw)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=f"Invalid date value '{raw}' (expected YYYY-MM-DD)") from exc
    if value_type == "datetime":
        try:
            return datetime.fromisoformat(raw)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=f"Invalid datetime value '{raw}' (ISO 8601)") from exc
    return raw


def _serialize_value(value: Any) -> str:
    if value is None:
        return "–"
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, bool):
        return "Yes" if value else "No"
    return str(value)


def _patient_source() -> SourceDef:
    fields: tuple[FieldDef, ...] = (
        FieldDef("id", "ID", "number", ("eq", "gte", "lte"), lambda row: row.id),
        FieldDef("pid", "PID", "string", ("eq", "contains"), lambda row: row.pid),
        FieldDef("first_name", "First Name", "string", ("eq", "contains"), lambda row: row.first_name),
        FieldDef("name", "Name", "string", ("eq", "contains"), lambda row: row.name),
        FieldDef("date_of_birth", "Date of Birth", "date", ("eq", "gte", "lte"), lambda row: row.date_of_birth),
        FieldDef("ahv_nr", "AHV Nr.", "string", ("eq", "contains"), lambda row: row.ahv_nr),
        FieldDef("lang", "Language", "string", ("eq", "contains"), lambda row: row.lang),
        FieldDef("translate", "Translate", "boolean", ("eq",), lambda row: row.translate),
        FieldDef("blood_type_name", "Blood Type", "string", ("eq", "contains"), lambda row: row.blood_type.name_default if row.blood_type else ""),
        FieldDef("resp_coord_name", "Responsible Coord.", "string", ("eq", "contains"), lambda row: row.resp_coord.name if row.resp_coord else ""),
        FieldDef("created_at", "Created At", "datetime", ("gte", "lte"), lambda row: row.created_at),
    )

    def query(db: Session) -> list[Patient]:
        return (
            db.query(Patient)
            .options(joinedload(Patient.blood_type), joinedload(Patient.resp_coord))
            .all()
        )

    return SourceDef("PATIENT", "Patients", fields, query)


def _episode_source() -> SourceDef:
    fields: tuple[FieldDef, ...] = (
        FieldDef("id", "ID", "number", ("eq", "gte", "lte"), lambda row: row.id),
        FieldDef("patient_pid", "Patient PID", "string", ("eq", "contains"), lambda row: row.patient.pid if row.patient else ""),
        FieldDef(
            "patient_name",
            "Patient Name",
            "string",
            ("eq", "contains"),
            lambda row: f"{row.patient.first_name} {row.patient.name}".strip() if row.patient else "",
        ),
        FieldDef("organ_name", "Organ", "string", ("eq", "contains"), lambda row: row.organ.name_default if row.organ else ""),
        FieldDef("status_name", "Status", "string", ("eq", "contains"), lambda row: row.status.name_default if row.status else ""),
        FieldDef("start", "Start", "date", ("eq", "gte", "lte"), lambda row: row.start),
        FieldDef("end", "End", "date", ("eq", "gte", "lte"), lambda row: row.end),
        FieldDef("fall_nr", "Fall Nr", "string", ("eq", "contains"), lambda row: row.fall_nr),
        FieldDef("closed", "Closed", "boolean", ("eq",), lambda row: row.closed),
    )

    def query(db: Session) -> list[Episode]:
        return (
            db.query(Episode)
            .options(joinedload(Episode.patient), joinedload(Episode.organ), joinedload(Episode.status))
            .all()
        )

    return SourceDef("EPISODE", "Episodes", fields, query)


def _coordination_source() -> SourceDef:
    fields: tuple[FieldDef, ...] = (
        FieldDef("id", "ID", "number", ("eq", "gte", "lte"), lambda row: row.id),
        FieldDef("start", "Start", "date", ("eq", "gte", "lte"), lambda row: row.start),
        FieldDef("end", "End", "date", ("eq", "gte", "lte"), lambda row: row.end),
        FieldDef("status_name", "Status", "string", ("eq", "contains"), lambda row: row.status.name_default if row.status else ""),
        FieldDef("donor_nr", "Donor Nr", "string", ("eq", "contains"), lambda row: row.donor_nr),
        FieldDef("swtpl_nr", "SWTPL Nr", "string", ("eq", "contains"), lambda row: row.swtpl_nr),
        FieldDef("national_coordinator", "National Coordinator", "string", ("eq", "contains"), lambda row: row.national_coordinator),
        FieldDef("donor_full_name", "Donor Name", "string", ("eq", "contains"), lambda row: row.donor.full_name if row.donor else ""),
        FieldDef("created_at", "Created At", "datetime", ("gte", "lte"), lambda row: row.created_at),
    )

    def query(db: Session) -> list[Coordination]:
        return (
            db.query(Coordination)
            .options(
                joinedload(Coordination.status),
                joinedload(Coordination.donor),
            )
            .all()
        )

    return SourceDef("COORDINATION", "Coordinations", fields, query)


SOURCES: dict[str, SourceDef] = {
    item.key: item for item in (
        _patient_source(),
        _episode_source(),
        _coordination_source(),
    )
}


def _match_filter(field: FieldDef, row_value: Any, cond: ReportFilterInput) -> bool:
    op = cond.operator
    if op not in field.operators:
        raise HTTPException(status_code=422, detail=f"Operator '{op}' not allowed for field '{field.key}'")

    expected = _parse_for_compare(field.value_type, cond.value)
    if row_value is None:
        return False

    if field.value_type in {"string"}:
        left = _norm_text(row_value).lower()
        right = _norm_text(expected).lower()
        if op == "eq":
            return left == right
        if op == "contains":
            return right in left
        raise HTTPException(status_code=422, detail=f"Operator '{op}' not supported for string")

    if field.value_type == "boolean":
        if op != "eq":
            raise HTTPException(status_code=422, detail=f"Operator '{op}' not supported for boolean")
        return bool(row_value) is bool(expected)

    if field.value_type in {"number", "date", "datetime"}:
        left = row_value
        if field.value_type == "number":
            left = float(row_value)
        if op == "eq":
            return left == expected
        if op == "gte":
            return left >= expected
        if op == "lte":
            return left <= expected
        raise HTTPException(status_code=422, detail=f"Operator '{op}' not supported for '{field.value_type}'")

    return False


def _filter_rows(items: list[Any], field_map: dict[str, FieldDef], filters: list[ReportFilterInput]) -> list[Any]:
    if not filters:
        return items
    out: list[Any] = []
    for item in items:
        ok = True
        for cond in filters:
            field = field_map.get(cond.field)
            if not field:
                raise HTTPException(status_code=422, detail=f"Unknown filter field '{cond.field}'")
            value = field.getter(item)
            if not _match_filter(field, value, cond):
                ok = False
                break
        if ok:
            out.append(item)
    return out


def _apply_sort(items: list[Any], field_map: dict[str, FieldDef], sort: list[ReportSortInput]) -> list[Any]:
    if not sort:
        return items
    sorted_items = list(items)
    for sort_key in reversed(sort):
        field = field_map.get(sort_key.field)
        if not field:
            raise HTTPException(status_code=422, detail=f"Unknown sort field '{sort_key.field}'")
        reverse = sort_key.direction == "desc"
        sorted_items.sort(key=lambda row: (field.getter(row) is None, field.getter(row)), reverse=reverse)
    return sorted_items


@router.get("/metadata", response_model=ReportMetadataResponse)
def get_report_metadata(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = (db, current_user)
    return ReportMetadataResponse(
        sources=[
            ReportSourceOption(
                key=source.key,  # type: ignore[arg-type]
                label=source.label,
                fields=[
                    ReportFieldOption(
                        key=field.key,
                        label=field.label,
                        value_type=field.value_type,  # type: ignore[arg-type]
                        operators=list(field.operators),  # type: ignore[arg-type]
                    )
                    for field in source.fields
                ],
            )
            for source in SOURCES.values()
        ]
    )


@router.post("/execute", response_model=ReportExecuteResponse)
def execute_report(
    payload: ReportExecuteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    source = SOURCES.get(payload.source)
    if not source:
        raise HTTPException(status_code=422, detail=f"Unknown source '{payload.source}'")

    field_map = {field.key: field for field in source.fields}
    if not payload.select:
        raise HTTPException(status_code=422, detail="select must contain at least one field")

    selected_fields: list[FieldDef] = []
    for key in payload.select:
        field = field_map.get(key)
        if not field:
            raise HTTPException(status_code=422, detail=f"Unknown selected field '{key}'")
        selected_fields.append(field)

    limit = min(max(payload.limit, 1), 1000)

    rows = source.query(db)
    rows = _filter_rows(rows, field_map, payload.filters)
    rows = _apply_sort(rows, field_map, payload.sort)
    rows = rows[:limit]

    rendered_rows: list[dict[str, str]] = []
    for row in rows:
        rendered_rows.append({
            field.key: _serialize_value(field.getter(row))
            for field in selected_fields
        })

    return ReportExecuteResponse(
        source=payload.source,
        columns=[ReportColumnResponse(key=field.key, label=field.label) for field in selected_fields],
        rows=rendered_rows,
        row_count=len(rendered_rows),
    )
