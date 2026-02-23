from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import ContactInfo, Patient, User
from ..schemas import ContactInfoCreate, ContactInfoResponse, ContactInfoUpdate

router = APIRouter(prefix="/patients/{patient_id}/contacts", tags=["contact_infos"])


def _get_patient_or_404(patient_id: int, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.get("/", response_model=list[ContactInfoResponse])
def list_contact_infos(patient_id: int, db: Session = Depends(get_db)):
    _get_patient_or_404(patient_id, db)
    return (
        db.query(ContactInfo)
        .options(joinedload(ContactInfo.type), joinedload(ContactInfo.changed_by_user))
        .filter(ContactInfo.patient_id == patient_id)
        .all()
    )


@router.post("/", response_model=ContactInfoResponse, status_code=201)
def create_contact_info(
    patient_id: int,
    payload: ContactInfoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_patient_or_404(patient_id, db)
    ci = ContactInfo(
        patient_id=patient_id,
        **payload.model_dump(),
        changed_by=current_user.id,
    )
    db.add(ci)
    db.commit()
    db.refresh(ci)
    return ci


@router.patch("/{contact_id}", response_model=ContactInfoResponse)
def update_contact_info(
    patient_id: int,
    contact_id: int,
    payload: ContactInfoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ci = (
        db.query(ContactInfo)
        .filter(ContactInfo.id == contact_id, ContactInfo.patient_id == patient_id)
        .first()
    )
    if not ci:
        raise HTTPException(status_code=404, detail="Contact info not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(ci, key, value)
    ci.changed_by = current_user.id
    db.commit()
    db.refresh(ci)
    return ci


@router.delete("/{contact_id}", status_code=204)
def delete_contact_info(
    patient_id: int,
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ci = (
        db.query(ContactInfo)
        .filter(ContactInfo.id == contact_id, ContactInfo.patient_id == patient_id)
        .first()
    )
    if not ci:
        raise HTTPException(status_code=404, detail="Contact info not found")
    db.delete(ci)
    db.commit()
