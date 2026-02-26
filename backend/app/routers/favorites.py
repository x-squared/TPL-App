from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Colloqium, Coordination, CoordinationDonor, Episode, Favorite, Patient, User
from ..schemas import FavoriteCreate, FavoriteResponse

router = APIRouter(prefix="/favorites", tags=["favorites"])


def _format_date_dd_mm_yyyy(value):
    if not value:
        return "–"
    return value.strftime("%d.%m.%Y")


def _derive_name(payload: FavoriteCreate, db: Session) -> str:
    if payload.favorite_type_key == "PATIENT" and payload.patient_id is not None:
        patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
        if patient:
            full_name = f"{patient.first_name} {patient.name}".strip()
            birthday = _format_date_dd_mm_yyyy(patient.date_of_birth)
            pid = patient.pid or "–"
            return f"{full_name} ({birthday}), {pid}"
    if payload.favorite_type_key == "EPISODE" and payload.episode_id is not None:
        episode = db.query(Episode).filter(Episode.id == payload.episode_id).first()
        if episode:
            if episode.patient:
                full_name = f"{episode.patient.first_name} {episode.patient.name}".strip()
                birthday = _format_date_dd_mm_yyyy(episode.patient.date_of_birth)
                pid = episode.patient.pid or "–"
                patient_name = f"{full_name} ({birthday}), {pid}"
            else:
                patient_name = "Unknown patient (–), –"
            organ_names = [organ.name_default for organ in (episode.organs or []) if organ and organ.name_default]
            if organ_names:
                organ = " + ".join(dict.fromkeys(organ_names))
            else:
                organ = episode.organ.name_default if episode.organ else "Unknown organ"
            start = _format_date_dd_mm_yyyy(episode.start)
            return f"{patient_name}, {organ}, {start}"
    if payload.favorite_type_key == "COLLOQUIUM" and payload.colloqium_id is not None:
        colloqium = db.query(Colloqium).filter(Colloqium.id == payload.colloqium_id).first()
        if colloqium:
            colloqium_type_name = colloqium.colloqium_type.name if colloqium.colloqium_type else "Colloquium"
            return f"{colloqium_type_name} ({colloqium.date})"
    if payload.favorite_type_key == "COORDINATION" and payload.coordination_id is not None:
        coordination = db.query(Coordination).filter(Coordination.id == payload.coordination_id).first()
        if coordination:
            donor = (
                db.query(CoordinationDonor)
                .filter(CoordinationDonor.coordination_id == coordination.id)
                .first()
            )
            if donor and donor.full_name:
                return donor.full_name
            return f"Coordination #{coordination.id}"
    return ""


def _find_existing(user_id: int, payload: FavoriteCreate, db: Session) -> Favorite | None:
    query = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.favorite_type_key == payload.favorite_type_key,
    )
    if payload.favorite_type_key == "PATIENT":
        query = query.filter(Favorite.patient_id == payload.patient_id)
    elif payload.favorite_type_key == "EPISODE":
        query = query.filter(Favorite.episode_id == payload.episode_id)
    elif payload.favorite_type_key == "COLLOQUIUM":
        query = query.filter(Favorite.colloqium_id == payload.colloqium_id)
    elif payload.favorite_type_key == "COORDINATION":
        query = query.filter(Favorite.coordination_id == payload.coordination_id)
    return query.first()


@router.get("/", response_model=list[FavoriteResponse])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )


@router.post("/", response_model=FavoriteResponse, status_code=201)
def create_favorite(
    payload: FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = _find_existing(current_user.id, payload, db)
    if existing:
        return existing
    favorite = Favorite(
        user_id=current_user.id,
        favorite_type_key=payload.favorite_type_key,
        name=payload.name.strip() or _derive_name(payload, db),
        patient_id=payload.patient_id,
        episode_id=payload.episode_id,
        colloqium_id=payload.colloqium_id,
        coordination_id=payload.coordination_id,
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite


@router.delete("/{favorite_id}", status_code=204)
def delete_favorite(
    favorite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    favorite = (
        db.query(Favorite)
        .filter(Favorite.id == favorite_id, Favorite.user_id == current_user.id)
        .first()
    )
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    db.delete(favorite)
    db.commit()
