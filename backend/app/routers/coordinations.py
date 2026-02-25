from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Code, Coordination, User
from ..schemas import CoordinationCreate, CoordinationResponse, CoordinationUpdate

router = APIRouter(prefix="/coordinations", tags=["coordinations"])

DEFAULT_COORDINATION_STATUS_KEY = "OPEN"
COORDINATION_STATUS_TYPE = "COORDINATION_STATUS"


def _base_query(db: Session):
    return db.query(Coordination).options(
        joinedload(Coordination.status),
        joinedload(Coordination.changed_by_user),
    )


def _get_coordination_or_404(coordination_id: int, db: Session) -> Coordination:
    item = _base_query(db).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")
    return item


def _resolve_default_status_id(db: Session) -> int:
    status = (
        db.query(Code)
        .filter(Code.type == COORDINATION_STATUS_TYPE, Code.key == DEFAULT_COORDINATION_STATUS_KEY)
        .first()
    )
    if not status:
        raise HTTPException(
            status_code=500,
            detail="Default coordination status code missing",
        )
    return status.id


def _ensure_status_exists(status_id: int, db: Session) -> None:
    status = (
        db.query(Code)
        .filter(Code.id == status_id, Code.type == COORDINATION_STATUS_TYPE)
        .first()
    )
    if not status:
        raise HTTPException(
            status_code=422,
            detail="status_id must reference CODE.COORDINATION_STATUS",
        )


@router.get("/", response_model=list[CoordinationResponse])
def list_coordinations(db: Session = Depends(get_db)):
    return _base_query(db).all()


@router.get("/{coordination_id}", response_model=CoordinationResponse)
def get_coordination(coordination_id: int, db: Session = Depends(get_db)):
    return _get_coordination_or_404(coordination_id, db)


@router.post("/", response_model=CoordinationResponse, status_code=201)
def create_coordination(
    payload: CoordinationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    status_id = payload.status_id if payload.status_id is not None else _resolve_default_status_id(db)
    _ensure_status_exists(status_id, db)
    item = Coordination(
        start=payload.start,
        end=payload.end,
        status_id=status_id,
        donor_nr=payload.donor_nr,
        swtpl_nr=payload.swtpl_nr,
        national_coordinator=payload.national_coordinator,
        comment=payload.comment,
        changed_by_id=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _get_coordination_or_404(item.id, db)


@router.patch("/{coordination_id}", response_model=CoordinationResponse)
def update_coordination(
    coordination_id: int,
    payload: CoordinationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Coordination).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")

    data = payload.model_dump(exclude_unset=True)
    if "status_id" in data and data["status_id"] is not None:
        _ensure_status_exists(data["status_id"], db)

    for key, value in data.items():
        setattr(item, key, value)
    item.changed_by_id = current_user.id
    db.commit()
    return _get_coordination_or_404(coordination_id, db)


@router.delete("/{coordination_id}", status_code=204)
def delete_coordination(
    coordination_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Coordination).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")
    db.delete(item)
    db.commit()
