from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import MedicalValueTemplate
from ..schemas import MedicalValueTemplateResponse

router = APIRouter(prefix="/medical-value-templates", tags=["medical-value-templates"])


@router.get("/", response_model=list[MedicalValueTemplateResponse])
def list_medical_value_templates(db: Session = Depends(get_db)):
    return (
        db.query(MedicalValueTemplate)
        .options(
            joinedload(MedicalValueTemplate.datatype),
            joinedload(MedicalValueTemplate.medical_value_group),
        )
        .order_by(MedicalValueTemplate.pos)
        .all()
    )


@router.get("/{template_id}", response_model=MedicalValueTemplateResponse)
def get_medical_value_template(template_id: int, db: Session = Depends(get_db)):
    mv = (
        db.query(MedicalValueTemplate)
        .options(
            joinedload(MedicalValueTemplate.datatype),
            joinedload(MedicalValueTemplate.medical_value_group),
        )
        .filter(MedicalValueTemplate.id == template_id)
        .first()
    )
    if not mv:
        raise HTTPException(status_code=404, detail="Medical value template not found")
    return mv
