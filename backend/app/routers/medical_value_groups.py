from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..features.medical_value_groups import (
    list_medical_value_groups as list_medical_value_groups_service,
    update_medical_value_group as update_medical_value_group_service,
)
from ..models import User
from ..schemas import MedicalValueGroupTemplateResponse, MedicalValueGroupTemplateUpdate

router = APIRouter(prefix="/medical-value-groups", tags=["medical-value-groups"])


@router.get("/", response_model=list[MedicalValueGroupTemplateResponse])
def list_medical_value_groups(db: Session = Depends(get_db)):
    return list_medical_value_groups_service(db=db)


@router.patch("/{group_id}", response_model=MedicalValueGroupTemplateResponse)
def update_medical_value_group(
    group_id: int,
    payload: MedicalValueGroupTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_medical_value_group_service(
        group_id=group_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )
