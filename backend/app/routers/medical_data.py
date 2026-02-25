from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import MedicalValue, MedicalValueTemplate, Patient, User
from ..schemas import MedicalValueCreate, MedicalValueResponse, MedicalValueUpdate

router = APIRouter(prefix="/patients/{patient_id}/medical-values", tags=["medical-values"])


def _get_patient_or_404(patient_id: int, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.get("/", response_model=list[MedicalValueResponse])
def list_medical_values(patient_id: int, db: Session = Depends(get_db)):
    _get_patient_or_404(patient_id, db)
    return (
        db.query(MedicalValue)
        .options(
            joinedload(MedicalValue.medical_value_template).joinedload(MedicalValueTemplate.datatype),
            joinedload(MedicalValue.datatype),
            joinedload(MedicalValue.changed_by_user),
        )
        .filter(MedicalValue.patient_id == patient_id)
        .all()
    )


@router.post("/", response_model=MedicalValueResponse, status_code=201)
def create_medical_value(
    patient_id: int,
    payload: MedicalValueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_patient_or_404(patient_id, db)
    mv = MedicalValue(
        patient_id=patient_id,
        **payload.model_dump(),
        changed_by_id=current_user.id,
    )
    db.add(mv)
    db.commit()
    db.refresh(mv)
    return mv


@router.patch("/{medical_value_id}", response_model=MedicalValueResponse)
def update_medical_value(
    patient_id: int,
    medical_value_id: int,
    payload: MedicalValueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mv = (
        db.query(MedicalValue)
        .filter(MedicalValue.id == medical_value_id, MedicalValue.patient_id == patient_id)
        .first()
    )
    if not mv:
        raise HTTPException(status_code=404, detail="Medical value not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(mv, key, value)
    mv.changed_by_id = current_user.id
    db.commit()
    db.refresh(mv)
    return mv


@router.delete("/{medical_value_id}", status_code=204)
def delete_medical_value(
    patient_id: int,
    medical_value_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mv = (
        db.query(MedicalValue)
        .filter(MedicalValue.id == medical_value_id, MedicalValue.patient_id == patient_id)
        .first()
    )
    if not mv:
        raise HTTPException(status_code=404, detail="Medical value not found")
    db.delete(mv)
    db.commit()
