from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from ...models import Colloqium, ColloqiumAgenda, ColloqiumType, Episode
from ...schemas import ColloqiumAgendaCreate, ColloqiumAgendaUpdate


def _validate_colloqium_or_422(*, db: Session, colloqium_id: int) -> None:
    item = db.query(Colloqium).filter(Colloqium.id == colloqium_id).first()
    if not item:
        raise HTTPException(status_code=422, detail="colloqium_id references unknown COLLOQIUM")


def _validate_episode_or_422(*, db: Session, episode_id: int) -> None:
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=422, detail="episode_id references unknown EPISODE")


def _validate_unique_episode_link_or_422(
    *,
    db: Session,
    colloqium_id: int,
    episode_id: int,
    exclude_agenda_id: int | None = None,
) -> None:
    query = db.query(ColloqiumAgenda).filter(
        ColloqiumAgenda.colloqium_id == colloqium_id,
        ColloqiumAgenda.episode_id == episode_id,
    )
    if exclude_agenda_id is not None:
        query = query.filter(ColloqiumAgenda.id != exclude_agenda_id)
    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=422,
            detail="episode is already linked in this colloqium agenda",
        )


def _agenda_query(db: Session):
    return db.query(ColloqiumAgenda).options(
        joinedload(ColloqiumAgenda.colloqium)
        .joinedload(Colloqium.colloqium_type)
        .joinedload(ColloqiumType.organ),
        joinedload(ColloqiumAgenda.episode),
        joinedload(ColloqiumAgenda.changed_by_user),
    )


def list_colloqium_agendas(*, colloqium_id: int | None, episode_id: int | None, db: Session) -> list[ColloqiumAgenda]:
    query = _agenda_query(db)
    if colloqium_id is not None:
        query = query.filter(ColloqiumAgenda.colloqium_id == colloqium_id)
    if episode_id is not None:
        query = query.filter(ColloqiumAgenda.episode_id == episode_id)
    return query.order_by(ColloqiumAgenda.id.asc()).all()


def create_colloqium_agenda(*, payload: ColloqiumAgendaCreate, changed_by_id: int, db: Session) -> ColloqiumAgenda:
    _validate_colloqium_or_422(db=db, colloqium_id=payload.colloqium_id)
    _validate_episode_or_422(db=db, episode_id=payload.episode_id)
    _validate_unique_episode_link_or_422(
        db=db,
        colloqium_id=payload.colloqium_id,
        episode_id=payload.episode_id,
    )
    item = ColloqiumAgenda(**payload.model_dump(), changed_by_id=changed_by_id)
    db.add(item)
    db.commit()
    return _agenda_query(db).filter(ColloqiumAgenda.id == item.id).first()


def update_colloqium_agenda(
    *,
    colloqium_agenda_id: int,
    payload: ColloqiumAgendaUpdate,
    changed_by_id: int,
    db: Session,
) -> ColloqiumAgenda:
    item = db.query(ColloqiumAgenda).filter(ColloqiumAgenda.id == colloqium_agenda_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Colloqium agenda not found")
    data = payload.model_dump(exclude_unset=True)
    if "colloqium_id" in data:
        _validate_colloqium_or_422(db=db, colloqium_id=data["colloqium_id"])
    if "episode_id" in data:
        _validate_episode_or_422(db=db, episode_id=data["episode_id"])
    target_colloqium_id = data["colloqium_id"] if "colloqium_id" in data else item.colloqium_id
    target_episode_id = data["episode_id"] if "episode_id" in data else item.episode_id
    _validate_unique_episode_link_or_422(
        db=db,
        colloqium_id=target_colloqium_id,
        episode_id=target_episode_id,
        exclude_agenda_id=item.id,
    )
    for key, value in data.items():
        setattr(item, key, value)
    item.changed_by_id = changed_by_id
    db.commit()
    return _agenda_query(db).filter(ColloqiumAgenda.id == colloqium_agenda_id).first()


def delete_colloqium_agenda(*, colloqium_agenda_id: int, db: Session) -> None:
    item = db.query(ColloqiumAgenda).filter(ColloqiumAgenda.id == colloqium_agenda_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Colloqium agenda not found")
    db.delete(item)
    db.commit()
