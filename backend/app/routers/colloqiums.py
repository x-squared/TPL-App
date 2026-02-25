from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Colloqium, ColloqiumType, User
from ..schemas import ColloqiumCreate, ColloqiumResponse, ColloqiumUpdate

router = APIRouter(prefix="/colloqiums", tags=["colloqiums"])


def _validate_colloqium_type_or_422(*, db: Session, colloqium_type_id: int) -> None:
    item = db.query(ColloqiumType).filter(ColloqiumType.id == colloqium_type_id).first()
    if not item:
        raise HTTPException(status_code=422, detail="colloqium_type_id references unknown COLLOQIUM_TYPE")


@router.get("/", response_model=list[ColloqiumResponse])
def list_colloqiums(db: Session = Depends(get_db)):
    return (
        db.query(Colloqium)
        .options(
            joinedload(Colloqium.colloqium_type).joinedload(ColloqiumType.organ),
            joinedload(Colloqium.changed_by_user),
        )
        .order_by(Colloqium.date.desc(), Colloqium.id.desc())
        .all()
    )


@router.post("/", response_model=ColloqiumResponse, status_code=201)
def create_colloqium(
    payload: ColloqiumCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_colloqium_type_or_422(db=db, colloqium_type_id=payload.colloqium_type_id)
    item = Colloqium(**payload.model_dump(), changed_by_id=current_user.id)
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=422,
            detail="colloqium with same colloqium_type_id and date already exists",
        ) from None
    return (
        db.query(Colloqium)
        .options(
            joinedload(Colloqium.colloqium_type).joinedload(ColloqiumType.organ),
            joinedload(Colloqium.changed_by_user),
        )
        .filter(Colloqium.id == item.id)
        .first()
    )


@router.patch("/{colloqium_id}", response_model=ColloqiumResponse)
def update_colloqium(
    colloqium_id: int,
    payload: ColloqiumUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Colloqium).filter(Colloqium.id == colloqium_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Colloqium not found")
    data = payload.model_dump(exclude_unset=True)
    if "colloqium_type_id" in data:
        _validate_colloqium_type_or_422(db=db, colloqium_type_id=data["colloqium_type_id"])
    for key, value in data.items():
        setattr(item, key, value)
    item.changed_by_id = current_user.id
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=422,
            detail="colloqium with same colloqium_type_id and date already exists",
        ) from None
    return (
        db.query(Colloqium)
        .options(
            joinedload(Colloqium.colloqium_type).joinedload(ColloqiumType.organ),
            joinedload(Colloqium.changed_by_user),
        )
        .filter(Colloqium.id == colloqium_id)
        .first()
    )


@router.delete("/{colloqium_id}", status_code=204)
def delete_colloqium(
    colloqium_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Colloqium).filter(Colloqium.id == colloqium_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Colloqium not found")
    db.delete(item)
    db.commit()
