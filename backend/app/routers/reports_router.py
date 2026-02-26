from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..features.reports import active_field_map, build_metadata_response, build_sources, execute_report_request
from ..models import User
from ..schemas import ReportExecuteRequest, ReportExecuteResponse, ReportMetadataResponse

router = APIRouter(prefix="/reports", tags=["reports"])

SOURCES = build_sources()


@router.get("/metadata", response_model=ReportMetadataResponse)
def get_report_metadata(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = (db, current_user)
    return build_metadata_response(SOURCES)


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
    field_map = active_field_map(source, payload.joins)
    return execute_report_request(payload, source, field_map, db)
