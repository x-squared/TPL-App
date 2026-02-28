from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import require_permission
from ..database import get_db
from ..enums import ProcurementSlotKey
from ..features.coordination_procurement_flex import (
    get_procurement_flex as get_procurement_flex_service,
    update_procurement_organ as update_procurement_organ_service,
    upsert_procurement_organ as upsert_procurement_organ_service,
    upsert_procurement_value as upsert_procurement_value_service,
)
from ..models import User
from ..schemas import (
    CoordinationProcurementFlexResponse,
    CoordinationProcurementOrganCreate,
    CoordinationProcurementOrganResponse,
    CoordinationProcurementOrganUpdate,
    CoordinationProcurementValueCreate,
    CoordinationProcurementValueResponse,
)

router = APIRouter(prefix="/coordinations/{coordination_id}/procurement-flex", tags=["coordination_procurement_flex"])


@router.get("/", response_model=CoordinationProcurementFlexResponse)
def get_procurement_flex(
    coordination_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("view.donations")),
):
    return get_procurement_flex_service(coordination_id=coordination_id, db=db)


@router.put("/organs/{organ_id}", response_model=CoordinationProcurementOrganResponse)
def upsert_procurement_organ(
    coordination_id: int,
    organ_id: int,
    payload: CoordinationProcurementOrganCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    return upsert_procurement_organ_service(
        coordination_id=coordination_id,
        organ_id=organ_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.patch("/organs/{organ_id}", response_model=CoordinationProcurementOrganResponse)
def update_procurement_organ(
    coordination_id: int,
    organ_id: int,
    payload: CoordinationProcurementOrganUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    return update_procurement_organ_service(
        coordination_id=coordination_id,
        organ_id=organ_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.put("/organs/{organ_id}/slots/{slot_key}/values/{field_template_id}", response_model=CoordinationProcurementValueResponse)
def upsert_procurement_value(
    coordination_id: int,
    organ_id: int,
    slot_key: ProcurementSlotKey,
    field_template_id: int,
    payload: CoordinationProcurementValueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    return upsert_procurement_value_service(
        coordination_id=coordination_id,
        organ_id=organ_id,
        slot_key=slot_key,
        field_template_id=field_template_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )
