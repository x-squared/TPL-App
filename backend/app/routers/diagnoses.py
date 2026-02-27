from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..features.diagnoses import (
    create_diagnosis as create_diagnosis_service,
    delete_diagnosis as delete_diagnosis_service,
    list_diagnoses as list_diagnoses_service,
    update_diagnosis as update_diagnosis_service,
)
from ..models import User
from ..schemas import DiagnosisCreate, DiagnosisResponse, DiagnosisUpdate

router = APIRouter(prefix="/patients/{patient_id}/diagnoses", tags=["diagnoses"])


@router.get("/", response_model=list[DiagnosisResponse])
def list_diagnoses(patient_id: int, db: Session = Depends(get_db)):
    return list_diagnoses_service(patient_id=patient_id, db=db)


@router.post("/", response_model=DiagnosisResponse, status_code=201)
def create_diagnosis(
    patient_id: int,
    payload: DiagnosisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_diagnosis_service(
        patient_id=patient_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.patch("/{diagnosis_id}", response_model=DiagnosisResponse)
def update_diagnosis(
    patient_id: int,
    diagnosis_id: int,
    payload: DiagnosisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_diagnosis_service(
        patient_id=patient_id,
        diagnosis_id=diagnosis_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.delete("/{diagnosis_id}", status_code=204)
def delete_diagnosis(
    patient_id: int,
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_diagnosis_service(patient_id=patient_id, diagnosis_id=diagnosis_id, db=db)
