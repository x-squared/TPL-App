from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload

from ..auth import get_current_user
from ..database import get_db
from ..models import Code, Episode, EpisodeOrgan, Patient, User
from ..schemas import (
    EpisodeCreate,
    EpisodeOrganCreate,
    EpisodeOrganResponse,
    EpisodeOrganUpdate,
    EpisodeResponse,
    EpisodeUpdate,
)

router = APIRouter(prefix="/patients/{patient_id}/episodes", tags=["episodes"])


def _get_patient_or_404(patient_id: int, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


def _validated_organ_ids(db: Session, organ_ids: list[int]) -> list[int]:
    if not organ_ids:
        raise HTTPException(status_code=422, detail="At least one organ is required")
    unique_ids = list(dict.fromkeys(organ_ids))
    rows = (
        db.query(Code.id)
        .filter(Code.type == "ORGAN", Code.id.in_(unique_ids))
        .all()
    )
    found_ids = {row[0] for row in rows}
    missing = [organ_id for organ_id in unique_ids if organ_id not in found_ids]
    if missing:
        raise HTTPException(status_code=422, detail=f"Unknown organ ids: {missing}")
    return unique_ids


def _active_organ_ids(episode: Episode) -> list[int]:
    active_ids = [link.organ_id for link in episode.organ_links if link.organ_id is not None and link.is_active]
    if active_ids:
        return list(dict.fromkeys(active_ids))
    if episode.organ_links:
        return []
    if episode.organ_id is not None:
        return [episode.organ_id]
    return []


def _resolve_organ_ids_for_create(payload: EpisodeCreate) -> list[int]:
    if payload.organ_ids is not None:
        return payload.organ_ids
    if payload.organ_id is not None:
        return [payload.organ_id]
    return []


def _resolve_organ_ids_for_update(payload: EpisodeUpdate, episode: Episode) -> list[int]:
    if payload.organ_ids is not None:
        return payload.organ_ids
    if payload.organ_id is not None:
        return [payload.organ_id]
    existing_ids = _active_organ_ids(episode)
    if existing_ids:
        return existing_ids
    if episode.organ_id is not None:
        return [episode.organ_id]
    return []


def _replace_episode_organs(*, db: Session, episode: Episode, organ_ids: list[int]) -> None:
    requested_ids = list(dict.fromkeys(organ_ids))
    now = date.today()
    links_by_organ_id = {link.organ_id: link for link in episode.organ_links}

    for organ_id in requested_ids:
        link = links_by_organ_id.get(organ_id)
        if link:
            link.is_active = True
            link.date_inactivated = None
            if link.date_added is None:
                link.date_added = episode.start or now
        else:
            db.add(
                EpisodeOrgan(
                    episode_id=episode.id,
                    organ_id=organ_id,
                    date_added=episode.start or now,
                    is_active=True,
                    date_inactivated=None,
                )
            )

    for link in episode.organ_links:
        if link.organ_id in requested_ids:
            continue
        if link.is_active:
            link.is_active = False
            link.date_inactivated = now

    episode.organ_id = requested_ids[0]


@router.get("/", response_model=list[EpisodeResponse])
def list_episodes(patient_id: int, db: Session = Depends(get_db)):
    _get_patient_or_404(patient_id, db)
    return (
        db.query(Episode)
        .options(
            joinedload(Episode.organ),
            selectinload(Episode.organs),
            selectinload(Episode.organ_links).joinedload(EpisodeOrgan.organ),
            joinedload(Episode.status),
            joinedload(Episode.changed_by_user),
        )
        .filter(Episode.patient_id == patient_id)
        .all()
    )


@router.post("/", response_model=EpisodeResponse, status_code=201)
def create_episode(
    patient_id: int,
    payload: EpisodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_patient_or_404(patient_id, db)
    organ_ids = _validated_organ_ids(db, _resolve_organ_ids_for_create(payload))
    payload_data = payload.model_dump(exclude={"organ_ids", "organ_id"})
    episode = Episode(
        patient_id=patient_id,
        **payload_data,
        organ_id=organ_ids[0],
        changed_by_id=current_user.id,
    )
    db.add(episode)
    db.flush()
    _replace_episode_organs(db=db, episode=episode, organ_ids=organ_ids)
    db.commit()
    db.refresh(episode)
    return (
        db.query(Episode)
        .options(
            joinedload(Episode.organ),
            selectinload(Episode.organs),
            selectinload(Episode.organ_links).joinedload(EpisodeOrgan.organ),
            joinedload(Episode.status),
            joinedload(Episode.changed_by_user),
        )
        .filter(Episode.id == episode.id)
        .first()
    )


@router.patch("/{episode_id}", response_model=EpisodeResponse)
def update_episode(
    patient_id: int,
    episode_id: int,
    payload: EpisodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    episode = (
        db.query(Episode)
        .filter(Episode.id == episode_id, Episode.patient_id == patient_id)
        .first()
    )
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    update_data = payload.model_dump(exclude_unset=True, exclude={"organ_ids", "organ_id"})
    for key, value in update_data.items():
        setattr(episode, key, value)
    if "organ_id" in payload.model_fields_set or "organ_ids" in payload.model_fields_set:
        organ_ids = _validated_organ_ids(db, _resolve_organ_ids_for_update(payload, episode))
        _replace_episode_organs(db=db, episode=episode, organ_ids=organ_ids)
    if episode.closed and not episode.end:
        raise HTTPException(status_code=422, detail="closed can only be true if end date is set")
    episode.changed_by_id = current_user.id
    db.commit()
    return (
        db.query(Episode)
        .options(
            joinedload(Episode.organ),
            selectinload(Episode.organs),
            selectinload(Episode.organ_links).joinedload(EpisodeOrgan.organ),
            joinedload(Episode.status),
            joinedload(Episode.changed_by_user),
        )
        .filter(Episode.id == episode_id)
        .first()
    )


@router.post("/{episode_id}/organs", response_model=EpisodeResponse, status_code=201)
def add_or_reactivate_episode_organ(
    patient_id: int,
    episode_id: int,
    payload: EpisodeOrganCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    episode = (
        db.query(Episode)
        .options(selectinload(Episode.organ_links))
        .filter(Episode.id == episode_id, Episode.patient_id == patient_id)
        .first()
    )
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    _validated_organ_ids(db, [payload.organ_id])
    now = date.today()
    existing = next((link for link in episode.organ_links if link.organ_id == payload.organ_id), None)
    if existing:
        existing.is_active = True
        existing.date_inactivated = None
        if payload.comment is not None:
            existing.comment = payload.comment
        if payload.reason_activation_change:
            existing.reason_activation_change = payload.reason_activation_change
        if existing.date_added is None:
            existing.date_added = payload.date_added or now
    else:
        db.add(
            EpisodeOrgan(
                episode_id=episode.id,
                organ_id=payload.organ_id,
                date_added=payload.date_added or now,
                comment=payload.comment or "",
                is_active=True,
                date_inactivated=None,
                reason_activation_change=payload.reason_activation_change or "",
            )
        )
    episode.organ_id = payload.organ_id
    episode.changed_by_id = current_user.id
    db.commit()
    return (
        db.query(Episode)
        .options(
            joinedload(Episode.organ),
            selectinload(Episode.organs),
            selectinload(Episode.organ_links).joinedload(EpisodeOrgan.organ),
            joinedload(Episode.status),
            joinedload(Episode.changed_by_user),
        )
        .filter(Episode.id == episode_id)
        .first()
    )


@router.patch("/{episode_id}/organs/{episode_organ_id}", response_model=EpisodeOrganResponse)
def update_episode_organ(
    patient_id: int,
    episode_id: int,
    episode_organ_id: int,
    payload: EpisodeOrganUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    episode = (
        db.query(Episode)
        .filter(Episode.id == episode_id, Episode.patient_id == patient_id)
        .first()
    )
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    link = (
        db.query(EpisodeOrgan)
        .filter(EpisodeOrgan.id == episode_organ_id, EpisodeOrgan.episode_id == episode_id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Episode organ row not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(link, key, value)
    if link.is_active and link.date_inactivated is not None:
        link.date_inactivated = None
    if not link.is_active and link.date_inactivated is None:
        link.date_inactivated = date.today()
    if link.date_added is None:
        link.date_added = episode.start or date.today()

    active_ids = [
        item.organ_id
        for item in db.query(EpisodeOrgan)
        .filter(EpisodeOrgan.episode_id == episode_id, EpisodeOrgan.is_active.is_(True))
        .order_by(EpisodeOrgan.id.asc())
        .all()
        if item.organ_id is not None
    ]
    if active_ids:
        episode.organ_id = active_ids[0]
    episode.changed_by_id = current_user.id
    db.commit()
    return (
        db.query(EpisodeOrgan)
        .options(joinedload(EpisodeOrgan.organ))
        .filter(EpisodeOrgan.id == episode_organ_id)
        .first()
    )


@router.delete("/{episode_id}", status_code=204)
def delete_episode(
    patient_id: int,
    episode_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    episode = (
        db.query(Episode)
        .filter(Episode.id == episode_id, Episode.patient_id == patient_id)
        .first()
    )
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    db.delete(episode)
    db.commit()
