from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import MedicalValue, MedicalValueGroup, MedicalValueTemplate, Patient, User
from ..schemas import MedicalValueCreate, MedicalValueResponse, MedicalValueUpdate

router = APIRouter(prefix="/patients/{patient_id}/medical-values", tags=["medical-values"])


def _get_patient_or_404(patient_id: int, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


def _get_default_group_id(db: Session) -> int | None:
    group = (
        db.query(MedicalValueGroup)
        .filter(MedicalValueGroup.key == "USER_CAPTURED")
        .first()
    )
    return group.id if group else None


@router.get("/", response_model=list[MedicalValueResponse])
def list_medical_values(patient_id: int, db: Session = Depends(get_db)):
    _get_patient_or_404(patient_id, db)
    return (
        db.query(MedicalValue)
        .options(
            joinedload(MedicalValue.medical_value_template).joinedload(MedicalValueTemplate.datatype),
            joinedload(MedicalValue.medical_value_template).joinedload(MedicalValueTemplate.medical_value_group),
            joinedload(MedicalValue.medical_value_group),
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
    data = payload.model_dump()
    template_id = data.get("medical_value_template_id")
    template = None
    if template_id:
        template = db.query(MedicalValueTemplate).filter(MedicalValueTemplate.id == template_id).first()
    if data.get("medical_value_group_id") is None:
        if template and template.medical_value_group_id is not None:
            data["medical_value_group_id"] = template.medical_value_group_id
        else:
            data["medical_value_group_id"] = _get_default_group_id(db)
    mv = MedicalValue(
        patient_id=patient_id,
        **data,
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
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mv, key, value)
    if "medical_value_template_id" in update_data and "medical_value_group_id" not in update_data:
        template_id = update_data.get("medical_value_template_id")
        template = None
        if template_id:
            template = db.query(MedicalValueTemplate).filter(MedicalValueTemplate.id == template_id).first()
        mv.medical_value_group_id = (
            template.medical_value_group_id
            if template and template.medical_value_group_id is not None
            else _get_default_group_id(db)
        )
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
