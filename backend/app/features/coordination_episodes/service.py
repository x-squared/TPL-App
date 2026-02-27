from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ...models import Catalogue, Code, Coordination, CoordinationEpisode, Episode
from ...schemas import CoordinationEpisodeCreate, CoordinationEpisodeUpdate


def _ensure_coordination_exists(coordination_id: int, db: Session) -> None:
    item = db.query(Coordination).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")


def _query_with_joins(db: Session):
    return db.query(CoordinationEpisode).options(
        joinedload(CoordinationEpisode.episode),
        joinedload(CoordinationEpisode.organ),
        joinedload(CoordinationEpisode.organ_rejection_sequel),
        joinedload(CoordinationEpisode.changed_by_user),
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


def _validate_episode_exists(episode_id: int, db: Session) -> None:
    entry = db.query(Episode).filter(Episode.id == episode_id).first()
    if not entry:
        raise HTTPException(status_code=422, detail="episode_id must reference EPISODE")


def _validate_payload(
    *,
    episode_id: int,
    organ_id: int,
    organ_rejection_sequel_id: int | None,
    db: Session,
) -> None:
    _validate_episode_exists(episode_id, db)
    _validate_code(organ_id, "ORGAN", "organ_id", db)
    _validate_catalogue(
        organ_rejection_sequel_id,
        "ORGAN_REJECTION_SEQUEL",
        "organ_rejection_sequel_id",
        db,
    )


def list_coordination_episodes(*, coordination_id: int, db: Session) -> list[CoordinationEpisode]:
    _ensure_coordination_exists(coordination_id, db)
    return (
        _query_with_joins(db)
        .filter(CoordinationEpisode.coordination_id == coordination_id)
        .all()
    )


def create_coordination_episode(
    *,
    coordination_id: int,
    payload: CoordinationEpisodeCreate,
    changed_by_id: int,
    db: Session,
) -> CoordinationEpisode:
    _ensure_coordination_exists(coordination_id, db)
    _validate_payload(
        episode_id=payload.episode_id,
        organ_id=payload.organ_id,
        organ_rejection_sequel_id=payload.organ_rejection_sequel_id,
        db=db,
    )
    item = CoordinationEpisode(
        coordination_id=coordination_id,
        episode_id=payload.episode_id,
        organ_id=payload.organ_id,
        tpl_date=payload.tpl_date,
        procurement_team=payload.procurement_team,
        exvivo_perfusion_done=payload.exvivo_perfusion_done,
        is_organ_rejected=payload.is_organ_rejected,
        organ_rejection_sequel_id=payload.organ_rejection_sequel_id,
        changed_by_id=changed_by_id,
    )
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Coordination episode already exists")
    return _query_with_joins(db).filter(CoordinationEpisode.id == item.id).first()


def update_coordination_episode(
    *,
    coordination_id: int,
    coordination_episode_id: int,
    payload: CoordinationEpisodeUpdate,
    changed_by_id: int,
    db: Session,
) -> CoordinationEpisode:
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationEpisode)
        .filter(
            CoordinationEpisode.id == coordination_episode_id,
            CoordinationEpisode.coordination_id == coordination_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination episode not found")

    data = payload.model_dump(exclude_unset=True)
    episode_id = data.get("episode_id", item.episode_id)
    organ_id = data.get("organ_id", item.organ_id)
    organ_rejection_sequel_id = data.get("organ_rejection_sequel_id", item.organ_rejection_sequel_id)
    _validate_payload(
        episode_id=episode_id,
        organ_id=organ_id,
        organ_rejection_sequel_id=organ_rejection_sequel_id,
        db=db,
    )

    for key, value in data.items():
        setattr(item, key, value)
    item.changed_by_id = changed_by_id
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Coordination episode already exists")
    return _query_with_joins(db).filter(CoordinationEpisode.id == coordination_episode_id).first()


def delete_coordination_episode(*, coordination_id: int, coordination_episode_id: int, db: Session) -> None:
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationEpisode)
        .filter(
            CoordinationEpisode.id == coordination_episode_id,
            CoordinationEpisode.coordination_id == coordination_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination episode not found")
    db.delete(item)
    db.commit()
