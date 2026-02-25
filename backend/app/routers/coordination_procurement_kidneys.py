from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Coordination, CoordinationProcurementKidney, User
from ..schemas import (
    CoordinationProcurementKidneyCreate,
    CoordinationProcurementKidneyResponse,
    CoordinationProcurementKidneyUpdate,
)

router = APIRouter(
    prefix="/coordinations/{coordination_id}/procurement-kidney",
    tags=["coordination_procurement_kidney"],
)


def _ensure_coordination_exists(coordination_id: int, db: Session) -> None:
    item = db.query(Coordination).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")


def _query_with_joins(db: Session):
    return db.query(CoordinationProcurementKidney).options(
        joinedload(CoordinationProcurementKidney.changed_by_user)
    )


@router.get("/", response_model=CoordinationProcurementKidneyResponse)
def get_coordination_procurement_kidney(coordination_id: int, db: Session = Depends(get_db)):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        _query_with_joins(db)
        .filter(CoordinationProcurementKidney.coordination_id == coordination_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination procurement kidney not found")
    return item


@router.put("/", response_model=CoordinationProcurementKidneyResponse)
def upsert_coordination_procurement_kidney(
    coordination_id: int,
    payload: CoordinationProcurementKidneyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationProcurementKidney)
        .filter(CoordinationProcurementKidney.coordination_id == coordination_id)
        .first()
    )
    if not item:
        item = CoordinationProcurementKidney(
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
        .filter(CoordinationProcurementKidney.coordination_id == coordination_id)
        .first()
    )


@router.patch("/", response_model=CoordinationProcurementKidneyResponse)
def update_coordination_procurement_kidney(
    coordination_id: int,
    payload: CoordinationProcurementKidneyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationProcurementKidney)
        .filter(CoordinationProcurementKidney.coordination_id == coordination_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination procurement kidney not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(item, key, value)
    item.changed_by_id = current_user.id
    db.commit()
    return (
        _query_with_joins(db)
        .filter(CoordinationProcurementKidney.coordination_id == coordination_id)
        .first()
    )


@router.delete("/", status_code=204)
def delete_coordination_procurement_kidney(
    coordination_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationProcurementKidney)
        .filter(CoordinationProcurementKidney.coordination_id == coordination_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination procurement kidney not found")
    db.delete(item)
    db.commit()
