from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Code, ColloqiumType, User
from ..schemas import (
    ColloqiumTypeCreate,
    ColloqiumTypeResponse,
    ColloqiumTypeUpdate,
)

router = APIRouter(prefix="/colloqium-types", tags=["colloqium-types"])


def _validate_organ_or_422(*, db: Session, organ_id: int) -> None:
    organ = db.query(Code).filter(Code.id == organ_id, Code.type == "ORGAN").first()
    if not organ:
        raise HTTPException(status_code=422, detail="organ_id must reference CODE with type ORGAN")


@router.get("/", response_model=list[ColloqiumTypeResponse])
def list_colloqium_types(db: Session = Depends(get_db)):
    return (
        db.query(ColloqiumType)
        .options(joinedload(ColloqiumType.organ), joinedload(ColloqiumType.changed_by_user))
        .order_by(ColloqiumType.name.asc(), ColloqiumType.id.asc())
        .all()
    )


@router.post("/", response_model=ColloqiumTypeResponse, status_code=201)
def create_colloqium_type(
    payload: ColloqiumTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_organ_or_422(db=db, organ_id=payload.organ_id)
    item = ColloqiumType(**payload.model_dump(), changed_by_id=current_user.id)
    db.add(item)
    db.commit()
    return (
        db.query(ColloqiumType)
        .options(joinedload(ColloqiumType.organ), joinedload(ColloqiumType.changed_by_user))
        .filter(ColloqiumType.id == item.id)
        .first()
    )


@router.patch("/{colloqium_type_id}", response_model=ColloqiumTypeResponse)
def update_colloqium_type(
    colloqium_type_id: int,
    payload: ColloqiumTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ColloqiumType).filter(ColloqiumType.id == colloqium_type_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Colloqium type not found")
    data = payload.model_dump(exclude_unset=True)
    if "organ_id" in data:
        _validate_organ_or_422(db=db, organ_id=data["organ_id"])
    for key, value in data.items():
        setattr(item, key, value)
    item.changed_by_id = current_user.id
    db.commit()
    return (
        db.query(ColloqiumType)
        .options(joinedload(ColloqiumType.organ), joinedload(ColloqiumType.changed_by_user))
        .filter(ColloqiumType.id == colloqium_type_id)
        .first()
    )


@router.delete("/{colloqium_type_id}", status_code=204)
def delete_colloqium_type(
    colloqium_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ColloqiumType).filter(ColloqiumType.id == colloqium_type_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Colloqium type not found")
    db.delete(item)
    db.commit()
