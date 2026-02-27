from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..auth import require_permission
from ..database import get_db
from ..models import Catalogue, Code, Coordination, CoordinationOrganEffect, User
from ..schemas import (
    CoordinationOrganEffectCreate,
    CoordinationOrganEffectResponse,
    CoordinationOrganEffectUpdate,
)

router = APIRouter(
    prefix="/coordinations/{coordination_id}/organ-effects",
    tags=["coordination_organ_effect"],
)


def _ensure_coordination_exists(coordination_id: int, db: Session) -> None:
    item = db.query(Coordination).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")


def _query_with_joins(db: Session):
    return db.query(CoordinationOrganEffect).options(
        joinedload(CoordinationOrganEffect.organ),
        joinedload(CoordinationOrganEffect.procurement_effect),
        joinedload(CoordinationOrganEffect.changed_by_user),
    )


def _validate_code(code_id: int, expected_type: str, field_name: str, db: Session) -> None:
    entry = db.query(Code).filter(Code.id == code_id, Code.type == expected_type).first()
    if not entry:
        raise HTTPException(status_code=422, detail=f"{field_name} must reference CODE.{expected_type}")


def _validate_catalogue(catalogue_id: int | None, expected_type: str, field_name: str, db: Session) -> None:
    if catalogue_id is None:
        return
    entry = db.query(Catalogue).filter(Catalogue.id == catalogue_id, Catalogue.type == expected_type).first()
    if not entry:
        raise HTTPException(status_code=422, detail=f"{field_name} must reference CATALOGUE.{expected_type}")


def _validate_payload(*, organ_id: int, procurement_effect_id: int | None, db: Session) -> None:
    _validate_code(organ_id, "ORGAN", "organ_id", db)
    _validate_catalogue(procurement_effect_id, "PROCUREMENT_EFFECT", "procurement_effect_id", db)


@router.get("/", response_model=list[CoordinationOrganEffectResponse])
def list_coordination_organ_effects(
    coordination_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("view.donations")),
):
    _ensure_coordination_exists(coordination_id, db)
    return (
        _query_with_joins(db)
        .filter(CoordinationOrganEffect.coordination_id == coordination_id)
        .all()
    )


@router.post("/", response_model=CoordinationOrganEffectResponse, status_code=201)
def create_coordination_organ_effect(
    coordination_id: int,
    payload: CoordinationOrganEffectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    _ensure_coordination_exists(coordination_id, db)
    _validate_payload(
        organ_id=payload.organ_id,
        procurement_effect_id=payload.procurement_effect_id,
        db=db,
    )
    item = CoordinationOrganEffect(
        coordination_id=coordination_id,
        organ_id=payload.organ_id,
        procurement_effect_id=payload.procurement_effect_id,
        changed_by_id=current_user.id,
    )
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Organ effect already exists for this coordination")
    return _query_with_joins(db).filter(CoordinationOrganEffect.id == item.id).first()


@router.patch("/{organ_effect_id}", response_model=CoordinationOrganEffectResponse)
def update_coordination_organ_effect(
    coordination_id: int,
    organ_effect_id: int,
    payload: CoordinationOrganEffectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationOrganEffect)
        .filter(
            CoordinationOrganEffect.id == organ_effect_id,
            CoordinationOrganEffect.coordination_id == coordination_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination organ effect not found")

    data = payload.model_dump(exclude_unset=True)
    organ_id = data.get("organ_id", item.organ_id)
    procurement_effect_id = data.get("procurement_effect_id", item.procurement_effect_id)
    _validate_payload(organ_id=organ_id, procurement_effect_id=procurement_effect_id, db=db)

    for key, value in data.items():
        setattr(item, key, value)
    item.changed_by_id = current_user.id
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Organ effect already exists for this coordination")
    return _query_with_joins(db).filter(CoordinationOrganEffect.id == organ_effect_id).first()


@router.delete("/{organ_effect_id}", status_code=204)
def delete_coordination_organ_effect(
    coordination_id: int,
    organ_effect_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationOrganEffect)
        .filter(
            CoordinationOrganEffect.id == organ_effect_id,
            CoordinationOrganEffect.coordination_id == coordination_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination organ effect not found")
    db.delete(item)
    db.commit()
