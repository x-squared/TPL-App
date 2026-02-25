from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Coordination, CoordinationProcurementHeartValves, User
from ..schemas import (
    CoordinationProcurementHeartValvesCreate,
    CoordinationProcurementHeartValvesResponse,
    CoordinationProcurementHeartValvesUpdate,
)

router = APIRouter(
    prefix="/coordinations/{coordination_id}/procurement-heart-valves",
    tags=["coordination_procurement_heart_valves"],
)


def _ensure_coordination_exists(coordination_id: int, db: Session) -> None:
    item = db.query(Coordination).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")


def _query_with_joins(db: Session):
    return db.query(CoordinationProcurementHeartValves).options(
        joinedload(CoordinationProcurementHeartValves.changed_by_user)
    )


@router.get("/", response_model=CoordinationProcurementHeartValvesResponse)
def get_coordination_procurement_heart_valves(coordination_id: int, db: Session = Depends(get_db)):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        _query_with_joins(db)
        .filter(CoordinationProcurementHeartValves.coordination_id == coordination_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination procurement heart valves not found")
    return item


@router.put("/", response_model=CoordinationProcurementHeartValvesResponse)
def upsert_coordination_procurement_heart_valves(
    coordination_id: int,
    payload: CoordinationProcurementHeartValvesCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationProcurementHeartValves)
        .filter(CoordinationProcurementHeartValves.coordination_id == coordination_id)
        .first()
    )
    if not item:
        item = CoordinationProcurementHeartValves(
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
        .filter(CoordinationProcurementHeartValves.coordination_id == coordination_id)
        .first()
    )


@router.patch("/", response_model=CoordinationProcurementHeartValvesResponse)
def update_coordination_procurement_heart_valves(
    coordination_id: int,
    payload: CoordinationProcurementHeartValvesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationProcurementHeartValves)
        .filter(CoordinationProcurementHeartValves.coordination_id == coordination_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination procurement heart valves not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(item, key, value)
    item.changed_by_id = current_user.id
    db.commit()
    return (
        _query_with_joins(db)
        .filter(CoordinationProcurementHeartValves.coordination_id == coordination_id)
        .first()
    )


@router.delete("/", status_code=204)
def delete_coordination_procurement_heart_valves(
    coordination_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationProcurementHeartValves)
        .filter(CoordinationProcurementHeartValves.coordination_id == coordination_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination procurement heart valves not found")
    db.delete(item)
    db.commit()
