from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, subqueryload

from ..auth import get_current_user
from ..database import get_db
from ..models import ContactInfo, Patient, User
from ..schemas import PatientCreate, PatientResponse, PatientUpdate

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/", response_model=list[PatientResponse])
def list_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(Patient)
        .options(
            joinedload(Patient.changed_by_user),
            subqueryload(Patient.contact_infos).joinedload(ContactInfo.type),
            subqueryload(Patient.contact_infos).joinedload(ContactInfo.changed_by_user),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = (
        db.query(Patient)
        .options(
            joinedload(Patient.changed_by_user),
            subqueryload(Patient.contact_infos).joinedload(ContactInfo.type),
            subqueryload(Patient.contact_infos).joinedload(ContactInfo.changed_by_user),
        )
        .filter(Patient.id == patient_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/", response_model=PatientResponse, status_code=201)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = Patient(**payload.model_dump(), changed_by=current_user.id)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.patch("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, key, value)
    patient.changed_by = current_user.id
    db.commit()
    return (
        db.query(Patient)
        .options(
            joinedload(Patient.changed_by_user),
            subqueryload(Patient.contact_infos).joinedload(ContactInfo.type),
            subqueryload(Patient.contact_infos).joinedload(ContactInfo.changed_by_user),
        )
        .filter(Patient.id == patient_id)
        .first()
    )


@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
