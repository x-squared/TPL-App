from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import require_permission
from ..database import get_db
from ..models import Coordination, CoordinationProcurement, User
from ..schemas import (
    CoordinationProcurementCreate,
    CoordinationProcurementResponse,
    CoordinationProcurementUpdate,
)

router = APIRouter(prefix="/coordinations/{coordination_id}/procurement", tags=["coordination_procurement"])


def _ensure_coordination_exists(coordination_id: int, db: Session) -> None:
    item = db.query(Coordination).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")


def _query_with_joins(db: Session):
    return db.query(CoordinationProcurement).options(joinedload(CoordinationProcurement.changed_by_user))


@router.get("/", response_model=CoordinationProcurementResponse)
def get_coordination_procurement(
    coordination_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("view.donations")),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        _query_with_joins(db)
        .filter(CoordinationProcurement.coordination_id == coordination_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination procurement not found")
    return item


@router.put("/", response_model=CoordinationProcurementResponse)
def upsert_coordination_procurement(
    coordination_id: int,
    payload: CoordinationProcurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    _ensure_coordination_exists(coordination_id, db)
    item = db.query(CoordinationProcurement).filter(CoordinationProcurement.coordination_id == coordination_id).first()
    if not item:
        item = CoordinationProcurement(
            coordination_id=coordination_id,
            changed_by_id=current_user.id,
            **payload.model_dump(),
        )
        db.add(item)
    else:
        for key, value in payload.model_dump().items():
            setattr(item, key, value)
        item.changed_by_id = current_user.id
    db.commit()
    return (
        _query_with_joins(db)
        .filter(CoordinationProcurement.coordination_id == coordination_id)
        .first()
    )


@router.patch("/", response_model=CoordinationProcurementResponse)
def update_coordination_procurement(
    coordination_id: int,
    payload: CoordinationProcurementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    _ensure_coordination_exists(coordination_id, db)
    item = db.query(CoordinationProcurement).filter(CoordinationProcurement.coordination_id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination procurement not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(item, key, value)
    item.changed_by_id = current_user.id
    db.commit()
    return (
        _query_with_joins(db)
        .filter(CoordinationProcurement.coordination_id == coordination_id)
        .first()
    )


@router.delete("/", status_code=204)
def delete_coordination_procurement(
    coordination_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    _ensure_coordination_exists(coordination_id, db)
    item = db.query(CoordinationProcurement).filter(CoordinationProcurement.coordination_id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination procurement not found")
    db.delete(item)
    db.commit()
