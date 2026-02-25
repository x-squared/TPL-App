from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Episode, Patient, User
from ..schemas import EpisodeCreate, EpisodeResponse, EpisodeUpdate

router = APIRouter(prefix="/patients/{patient_id}/episodes", tags=["episodes"])


def _get_patient_or_404(patient_id: int, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.get("/", response_model=list[EpisodeResponse])
def list_episodes(patient_id: int, db: Session = Depends(get_db)):
    _get_patient_or_404(patient_id, db)
    return (
        db.query(Episode)
        .options(
            joinedload(Episode.organ),
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
    episode = Episode(
        patient_id=patient_id,
        **payload.model_dump(),
        changed_by_id=current_user.id,
    )
    db.add(episode)
    db.commit()
    db.refresh(episode)
    return (
        db.query(Episode)
        .options(
            joinedload(Episode.organ),
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
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(episode, key, value)
    if episode.closed and not episode.end:
        raise HTTPException(status_code=422, detail="closed can only be true if end date is set")
    episode.changed_by_id = current_user.id
    db.commit()
    return (
        db.query(Episode)
        .options(
            joinedload(Episode.organ),
            joinedload(Episode.status),
            joinedload(Episode.changed_by_user),
        )
        .filter(Episode.id == episode_id)
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
