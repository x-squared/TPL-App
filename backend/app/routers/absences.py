from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Absence, Patient, User
from ..schemas import AbsenceCreate, AbsenceResponse, AbsenceUpdate

router = APIRouter(prefix="/patients/{patient_id}/absences", tags=["absences"])


def _get_patient_or_404(patient_id: int, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.get("/", response_model=list[AbsenceResponse])
def list_absences(patient_id: int, db: Session = Depends(get_db)):
    _get_patient_or_404(patient_id, db)
    return (
        db.query(Absence)
        .options(joinedload(Absence.changed_by_user))
        .filter(Absence.patient_id == patient_id)
        .order_by(Absence.start.desc())
        .all()
    )


@router.post("/", response_model=AbsenceResponse, status_code=201)
def create_absence(
    patient_id: int,
    payload: AbsenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_patient_or_404(patient_id, db)
    absence = Absence(
        patient_id=patient_id,
        **payload.model_dump(),
        changed_by_id=current_user.id,
    )
    db.add(absence)
    db.commit()
    db.refresh(absence)
    return absence


@router.patch("/{absence_id}", response_model=AbsenceResponse)
def update_absence(
    patient_id: int,
    absence_id: int,
    payload: AbsenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    absence = (
        db.query(Absence)
        .filter(Absence.id == absence_id, Absence.patient_id == patient_id)
        .first()
    )
    if not absence:
        raise HTTPException(status_code=404, detail="Absence not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(absence, key, value)
    absence.changed_by_id = current_user.id
    db.commit()
    db.refresh(absence)
    return absence


@router.delete("/{absence_id}", status_code=204)
def delete_absence(
    patient_id: int,
    absence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    absence = (
        db.query(Absence)
        .filter(Absence.id == absence_id, Absence.patient_id == patient_id)
        .first()
    )
    if not absence:
        raise HTTPException(status_code=404, detail="Absence not found")
    db.delete(absence)
    db.commit()
