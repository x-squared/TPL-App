from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Colloqium, ColloqiumAgenda, Episode, User
from ..schemas import (
    ColloqiumAgendaCreate,
    ColloqiumAgendaResponse,
    ColloqiumAgendaUpdate,
)

router = APIRouter(prefix="/colloqium-agendas", tags=["colloqium-agendas"])


def _validate_colloqium_or_422(*, db: Session, colloqium_id: int) -> None:
    item = db.query(Colloqium).filter(Colloqium.id == colloqium_id).first()
    if not item:
        raise HTTPException(status_code=422, detail="colloqium_id references unknown COLLOQIUM")


def _validate_dynamic_reference_or_422(*, db: Session, ref_entity_type: str, ref_entity_id: int | None) -> None:
    normalized = (ref_entity_type or "").strip().upper()
    if not normalized:
        raise HTTPException(status_code=422, detail="ref_entity_type is required")
    if ref_entity_id is None:
        return
    if normalized == "EPISODE":
        episode = db.query(Episode).filter(Episode.id == ref_entity_id).first()
        if not episode:
            raise HTTPException(status_code=422, detail="ref_entity_id references unknown EPISODE")


@router.get("/", response_model=list[ColloqiumAgendaResponse])
def list_colloqium_agendas(
    colloqium_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(ColloqiumAgenda).options(
        joinedload(ColloqiumAgenda.colloqium),
        joinedload(ColloqiumAgenda.changed_by_user),
    )
    if colloqium_id is not None:
        query = query.filter(ColloqiumAgenda.colloqium_id == colloqium_id)
    return query.order_by(ColloqiumAgenda.id.asc()).all()


@router.post("/", response_model=ColloqiumAgendaResponse, status_code=201)
def create_colloqium_agenda(
    payload: ColloqiumAgendaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_colloqium_or_422(db=db, colloqium_id=payload.colloqium_id)
    _validate_dynamic_reference_or_422(
        db=db,
        ref_entity_type=payload.ref_entity_type,
        ref_entity_id=payload.ref_entity_id,
    )
    item = ColloqiumAgenda(**payload.model_dump(), changed_by=current_user.id)
    db.add(item)
    db.commit()
    return (
        db.query(ColloqiumAgenda)
        .options(
            joinedload(ColloqiumAgenda.colloqium),
            joinedload(ColloqiumAgenda.changed_by_user),
        )
        .filter(ColloqiumAgenda.id == item.id)
        .first()
    )


@router.patch("/{colloqium_agenda_id}", response_model=ColloqiumAgendaResponse)
def update_colloqium_agenda(
    colloqium_agenda_id: int,
    payload: ColloqiumAgendaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ColloqiumAgenda).filter(ColloqiumAgenda.id == colloqium_agenda_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Colloqium agenda not found")
    data = payload.model_dump(exclude_unset=True)
    if "colloqium_id" in data:
        _validate_colloqium_or_422(db=db, colloqium_id=data["colloqium_id"])
    if "ref_entity_type" in data or "ref_entity_id" in data:
        _validate_dynamic_reference_or_422(
            db=db,
            ref_entity_type=data.get("ref_entity_type", item.ref_entity_type),
            ref_entity_id=data.get("ref_entity_id", item.ref_entity_id),
        )
    for key, value in data.items():
        setattr(item, key, value)
    item.changed_by = current_user.id
    db.commit()
    return (
        db.query(ColloqiumAgenda)
        .options(
            joinedload(ColloqiumAgenda.colloqium),
            joinedload(ColloqiumAgenda.changed_by_user),
        )
        .filter(ColloqiumAgenda.id == colloqium_agenda_id)
        .first()
    )


@router.delete("/{colloqium_agenda_id}", status_code=204)
def delete_colloqium_agenda(
    colloqium_agenda_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ColloqiumAgenda).filter(ColloqiumAgenda.id == colloqium_agenda_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Colloqium agenda not found")
    db.delete(item)
    db.commit()
