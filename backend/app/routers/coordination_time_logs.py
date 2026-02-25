from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Coordination, CoordinationTimeLog, User
from ..schemas import (
    CoordinationTimeLogCreate,
    CoordinationTimeLogResponse,
    CoordinationTimeLogUpdate,
)

router = APIRouter(prefix="/coordinations/{coordination_id}/time-logs", tags=["coordination_time_log"])


def _ensure_coordination_exists(coordination_id: int, db: Session) -> None:
    item = db.query(Coordination).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")


def _ensure_user_exists(user_id: int, db: Session) -> None:
    item = db.query(User).filter(User.id == user_id).first()
    if not item:
        raise HTTPException(status_code=422, detail="user_id must reference USER")


def _query_with_joins(db: Session):
    return db.query(CoordinationTimeLog).options(
        joinedload(CoordinationTimeLog.user),
        joinedload(CoordinationTimeLog.changed_by_user),
    )


def _validate_interval(start: datetime | None, end: datetime | None) -> None:
    if start is None and end is None:
        return
    if start is None or end is None:
        raise HTTPException(status_code=422, detail="start and end must both be set")
    if start >= end:
        raise HTTPException(status_code=422, detail="start must be before end")


def _ensure_no_overlap(
    *,
    coordination_id: int,
    user_id: int,
    start: datetime | None,
    end: datetime | None,
    db: Session,
    exclude_id: int | None = None,
) -> None:
    if start is None or end is None:
        return
    query = db.query(CoordinationTimeLog).filter(
        CoordinationTimeLog.coordination_id == coordination_id,
        CoordinationTimeLog.user_id == user_id,
        CoordinationTimeLog.start.isnot(None),
        CoordinationTimeLog.end.isnot(None),
    )
    if exclude_id is not None:
        query = query.filter(CoordinationTimeLog.id != exclude_id)
    overlaps = query.filter(
        CoordinationTimeLog.start < end,
        CoordinationTimeLog.end > start,
    ).first()
    if overlaps:
        raise HTTPException(status_code=422, detail="Time interval overlaps with existing log entry")


@router.get("/", response_model=list[CoordinationTimeLogResponse])
def list_coordination_time_logs(coordination_id: int, db: Session = Depends(get_db)):
    _ensure_coordination_exists(coordination_id, db)
    return (
        _query_with_joins(db)
        .filter(CoordinationTimeLog.coordination_id == coordination_id)
        .all()
    )


@router.post("/", response_model=CoordinationTimeLogResponse, status_code=201)
def create_coordination_time_log(
    coordination_id: int,
    payload: CoordinationTimeLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_coordination_exists(coordination_id, db)
    _ensure_user_exists(payload.user_id, db)
    _validate_interval(payload.start, payload.end)
    _ensure_no_overlap(
        coordination_id=coordination_id,
        user_id=payload.user_id,
        start=payload.start,
        end=payload.end,
        db=db,
    )
    item = CoordinationTimeLog(
        coordination_id=coordination_id,
        user_id=payload.user_id,
        start=payload.start,
        end=payload.end,
        comment=payload.comment,
        changed_by_id=current_user.id,
    )
    db.add(item)
    db.commit()
    return _query_with_joins(db).filter(CoordinationTimeLog.id == item.id).first()


@router.patch("/{time_log_id}", response_model=CoordinationTimeLogResponse)
def update_coordination_time_log(
    coordination_id: int,
    time_log_id: int,
    payload: CoordinationTimeLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationTimeLog)
        .filter(
            CoordinationTimeLog.id == time_log_id,
            CoordinationTimeLog.coordination_id == coordination_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination time log not found")

    data = payload.model_dump(exclude_unset=True)
    user_id = data.get("user_id", item.user_id)
    if "user_id" in data and data["user_id"] is not None:
        _ensure_user_exists(user_id, db)
    start = data.get("start", item.start)
    end = data.get("end", item.end)
    _validate_interval(start, end)
    _ensure_no_overlap(
        coordination_id=coordination_id,
        user_id=user_id,
        start=start,
        end=end,
        db=db,
        exclude_id=item.id,
    )
    for key, value in data.items():
        setattr(item, key, value)
    item.changed_by_id = current_user.id
    db.commit()
    return _query_with_joins(db).filter(CoordinationTimeLog.id == time_log_id).first()


@router.delete("/{time_log_id}", status_code=204)
def delete_coordination_time_log(
    coordination_id: int,
    time_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationTimeLog)
        .filter(
            CoordinationTimeLog.id == time_log_id,
            CoordinationTimeLog.coordination_id == coordination_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination time log not found")
    db.delete(item)
    db.commit()
