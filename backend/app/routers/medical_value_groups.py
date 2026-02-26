from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import MedicalValueGroup, User
from ..schemas import MedicalValueGroupResponse, MedicalValueGroupUpdate

router = APIRouter(prefix="/medical-value-groups", tags=["medical-value-groups"])


@router.get("/", response_model=list[MedicalValueGroupResponse])
def list_medical_value_groups(db: Session = Depends(get_db)):
    return (
        db.query(MedicalValueGroup)
        .options(joinedload(MedicalValueGroup.changed_by_user))
        .order_by(MedicalValueGroup.pos.asc(), MedicalValueGroup.name_default.asc())
        .all()
    )


@router.patch("/{group_id}", response_model=MedicalValueGroupResponse)
def update_medical_value_group(
    group_id: int,
    payload: MedicalValueGroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = db.query(MedicalValueGroup).filter(MedicalValueGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Medical value group not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(group, key, value)
    group.changed_by_id = current_user.id
    db.commit()
    return (
        db.query(MedicalValueGroup)
        .options(joinedload(MedicalValueGroup.changed_by_user))
        .filter(MedicalValueGroup.id == group_id)
        .first()
    )
