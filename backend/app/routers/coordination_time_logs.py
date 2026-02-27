from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import require_permission
from ..database import get_db
from ..features.coordination_time_logs import (
    create_coordination_time_log as create_coordination_time_log_service,
    delete_coordination_time_log as delete_coordination_time_log_service,
    list_coordination_time_logs as list_coordination_time_logs_service,
    update_coordination_time_log as update_coordination_time_log_service,
)
from ..models import User
from ..schemas import (
    CoordinationTimeLogCreate,
    CoordinationTimeLogResponse,
    CoordinationTimeLogUpdate,
)

router = APIRouter(prefix="/coordinations/{coordination_id}/time-logs", tags=["coordination_time_log"])


@router.get("/", response_model=list[CoordinationTimeLogResponse])
def list_coordination_time_logs(
    coordination_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("view.donations")),
):
    return list_coordination_time_logs_service(coordination_id=coordination_id, db=db)


@router.post("/", response_model=CoordinationTimeLogResponse, status_code=201)
def create_coordination_time_log(
    coordination_id: int,
    payload: CoordinationTimeLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    return create_coordination_time_log_service(
        coordination_id=coordination_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.patch("/{time_log_id}", response_model=CoordinationTimeLogResponse)
def update_coordination_time_log(
    coordination_id: int,
    time_log_id: int,
    payload: CoordinationTimeLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    return update_coordination_time_log_service(
        coordination_id=coordination_id,
        time_log_id=time_log_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.delete("/{time_log_id}", status_code=204)
def delete_coordination_time_log(
    coordination_id: int,
    time_log_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("edit.donations")),
):
    delete_coordination_time_log_service(coordination_id=coordination_id, time_log_id=time_log_id, db=db)
