from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import require_permission
from ..database import get_db
from ..models import (
    Coordination,
    CoordinationProcurement,
    CoordinationProcurementFieldTemplate,
    CoordinationProcurementOrgan,
    CoordinationProcurementSlot,
    CoordinationProcurementValue,
    User,
)
from ..schemas import (
    CoordinationProcurementFlexResponse,
    CoordinationProcurementOrganCreate,
    CoordinationProcurementOrganResponse,
    CoordinationProcurementOrganUpdate,
    CoordinationProcurementValueCreate,
    CoordinationProcurementValueResponse,
)

router = APIRouter(prefix="/coordinations/{coordination_id}/procurement-flex", tags=["coordination_procurement_flex"])


def _ensure_coordination_exists(coordination_id: int, db: Session) -> None:
    item = db.query(Coordination).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")


@router.get("/", response_model=CoordinationProcurementFlexResponse)
def get_procurement_flex(
    coordination_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("view.donations")),
):
    _ensure_coordination_exists(coordination_id, db)
    procurement = (
        db.query(CoordinationProcurement)
        .options(joinedload(CoordinationProcurement.changed_by_user))
        .filter(CoordinationProcurement.coordination_id == coordination_id)
        .first()
    )
    organs = (
        db.query(CoordinationProcurementOrgan)
        .options(
            joinedload(CoordinationProcurementOrgan.organ),
            joinedload(CoordinationProcurementOrgan.changed_by_user),
            joinedload(CoordinationProcurementOrgan.slots).joinedload(CoordinationProcurementSlot.values).joinedload(CoordinationProcurementValue.field_template),
            joinedload(CoordinationProcurementOrgan.slots).joinedload(CoordinationProcurementSlot.changed_by_user),
        )
        .filter(CoordinationProcurementOrgan.coordination_id == coordination_id)
        .all()
    )
    field_templates = (
        db.query(CoordinationProcurementFieldTemplate)
        .options(joinedload(CoordinationProcurementFieldTemplate.datatype_definition))
        .order_by(CoordinationProcurementFieldTemplate.pos.asc(), CoordinationProcurementFieldTemplate.id.asc())
        .all()
    )
    return CoordinationProcurementFlexResponse(procurement=procurement, organs=organs, field_templates=field_templates)


@router.put("/organs/{organ_id}", response_model=CoordinationProcurementOrganResponse)
def upsert_procurement_organ(
    coordination_id: int,
    organ_id: int,
    payload: CoordinationProcurementOrganCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationProcurementOrgan)
        .filter(
            CoordinationProcurementOrgan.coordination_id == coordination_id,
            CoordinationProcurementOrgan.organ_id == organ_id,
        )
        .first()
    )
    if not item:
        item = CoordinationProcurementOrgan(
            coordination_id=coordination_id,
            organ_id=organ_id,
            procurement_surgeon=payload.procurement_surgeon,
            changed_by_id=current_user.id,
        )
        db.add(item)
        db.flush()
    else:
        item.procurement_surgeon = payload.procurement_surgeon
        item.changed_by_id = current_user.id

    if not item.slots:
        db.add(
            CoordinationProcurementSlot(
                coordination_procurement_organ_id=item.id,
                slot_key="MAIN",
                changed_by_id=current_user.id,
            )
        )
    db.commit()
    return (
        db.query(CoordinationProcurementOrgan)
        .options(
            joinedload(CoordinationProcurementOrgan.organ),
            joinedload(CoordinationProcurementOrgan.changed_by_user),
            joinedload(CoordinationProcurementOrgan.slots).joinedload(CoordinationProcurementSlot.values).joinedload(CoordinationProcurementValue.field_template),
            joinedload(CoordinationProcurementOrgan.slots).joinedload(CoordinationProcurementSlot.changed_by_user),
        )
        .filter(CoordinationProcurementOrgan.id == item.id)
        .first()
    )


@router.patch("/organs/{organ_id}", response_model=CoordinationProcurementOrganResponse)
def update_procurement_organ(
    coordination_id: int,
    organ_id: int,
    payload: CoordinationProcurementOrganUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    _ensure_coordination_exists(coordination_id, db)
    item = (
        db.query(CoordinationProcurementOrgan)
        .filter(
            CoordinationProcurementOrgan.coordination_id == coordination_id,
            CoordinationProcurementOrgan.organ_id == organ_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Coordination procurement organ not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    item.changed_by_id = current_user.id
    db.commit()
    return (
        db.query(CoordinationProcurementOrgan)
        .options(
            joinedload(CoordinationProcurementOrgan.organ),
            joinedload(CoordinationProcurementOrgan.changed_by_user),
            joinedload(CoordinationProcurementOrgan.slots).joinedload(CoordinationProcurementSlot.values).joinedload(CoordinationProcurementValue.field_template),
            joinedload(CoordinationProcurementOrgan.slots).joinedload(CoordinationProcurementSlot.changed_by_user),
        )
        .filter(CoordinationProcurementOrgan.id == item.id)
        .first()
    )


@router.put("/organs/{organ_id}/slots/{slot_key}/values/{field_template_id}", response_model=CoordinationProcurementValueResponse)
def upsert_procurement_value(
    coordination_id: int,
    organ_id: int,
    slot_key: str,
    field_template_id: int,
    payload: CoordinationProcurementValueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    _ensure_coordination_exists(coordination_id, db)
    organ = (
        db.query(CoordinationProcurementOrgan)
        .filter(
            CoordinationProcurementOrgan.coordination_id == coordination_id,
            CoordinationProcurementOrgan.organ_id == organ_id,
        )
        .first()
    )
    if not organ:
        organ = CoordinationProcurementOrgan(
            coordination_id=coordination_id,
            organ_id=organ_id,
            procurement_surgeon="",
            changed_by_id=current_user.id,
        )
        db.add(organ)
        db.flush()

    slot = (
        db.query(CoordinationProcurementSlot)
        .filter(
            CoordinationProcurementSlot.coordination_procurement_organ_id == organ.id,
            CoordinationProcurementSlot.slot_key == slot_key.upper(),
        )
        .first()
    )
    if not slot:
        slot = CoordinationProcurementSlot(
            coordination_procurement_organ_id=organ.id,
            slot_key=slot_key.upper(),
            changed_by_id=current_user.id,
        )
        db.add(slot)
        db.flush()

    value = (
        db.query(CoordinationProcurementValue)
        .filter(
            CoordinationProcurementValue.slot_id == slot.id,
            CoordinationProcurementValue.field_template_id == field_template_id,
        )
        .first()
    )
    if not value:
        value = CoordinationProcurementValue(
            slot_id=slot.id,
            field_template_id=field_template_id,
            value=payload.value,
            changed_by_id=current_user.id,
        )
        db.add(value)
    else:
        value.value = payload.value
        value.changed_by_id = current_user.id

    db.commit()
    return (
        db.query(CoordinationProcurementValue)
        .options(
            joinedload(CoordinationProcurementValue.field_template),
            joinedload(CoordinationProcurementValue.changed_by_user),
        )
        .filter(CoordinationProcurementValue.id == value.id)
        .first()
    )
