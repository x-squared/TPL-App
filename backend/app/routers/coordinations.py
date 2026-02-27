from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import require_permission
from ..database import get_db
from ..features.coordinations import (
    create_coordination as create_coordination_service,
    delete_coordination as delete_coordination_service,
    get_coordination_or_404,
    list_coordinations as list_coordinations_service,
    update_coordination as update_coordination_service,
)
from ..models import User
from ..schemas import CoordinationCreate, CoordinationResponse, CoordinationUpdate

router = APIRouter(prefix="/coordinations", tags=["coordinations"])


@router.get("/", response_model=list[CoordinationResponse])
def list_coordinations(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("view.donations")),
):
    return list_coordinations_service(db)


@router.get("/{coordination_id}", response_model=CoordinationResponse)
def get_coordination(
    coordination_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("view.donations")),
):
    return get_coordination_or_404(coordination_id, db)


@router.post("/", response_model=CoordinationResponse, status_code=201)
def create_coordination(
    payload: CoordinationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    return create_coordination_service(payload=payload, changed_by_id=current_user.id, db=db)


@router.patch("/{coordination_id}", response_model=CoordinationResponse)
def update_coordination(
    coordination_id: int,
    payload: CoordinationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    return update_coordination_service(
        coordination_id=coordination_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.delete("/{coordination_id}", status_code=204)
def delete_coordination(
    coordination_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    delete_coordination_service(coordination_id=coordination_id, db=db)
