from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from ...models import (
    Coordination,
    CoordinationProcurement,
    CoordinationProcurementFieldTemplate,
    CoordinationProcurementOrgan,
    CoordinationProcurementSlot,
    CoordinationProcurementValue,
)
from ...schemas import (
    CoordinationProcurementFlexResponse,
    CoordinationProcurementOrganCreate,
    CoordinationProcurementOrganUpdate,
    CoordinationProcurementValueCreate,
)


def _ensure_coordination_exists(coordination_id: int, db: Session) -> None:
    item = db.query(Coordination).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")


def _organ_query(db: Session):
    return db.query(CoordinationProcurementOrgan).options(
        joinedload(CoordinationProcurementOrgan.organ),
        joinedload(CoordinationProcurementOrgan.changed_by_user),
        joinedload(CoordinationProcurementOrgan.slots).joinedload(CoordinationProcurementSlot.values).joinedload(CoordinationProcurementValue.field_template),
        joinedload(CoordinationProcurementOrgan.slots).joinedload(CoordinationProcurementSlot.changed_by_user),
    )


def get_procurement_flex(*, coordination_id: int, db: Session) -> CoordinationProcurementFlexResponse:
    _ensure_coordination_exists(coordination_id, db)
    procurement = (
        db.query(CoordinationProcurement)
        .options(joinedload(CoordinationProcurement.changed_by_user))
        .filter(CoordinationProcurement.coordination_id == coordination_id)
        .first()
    )
    organs = (
        _organ_query(db)
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


def upsert_procurement_organ(
    *,
    coordination_id: int,
    organ_id: int,
    payload: CoordinationProcurementOrganCreate,
    changed_by_id: int,
    db: Session,
) -> CoordinationProcurementOrgan:
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
            changed_by_id=changed_by_id,
        )
        db.add(item)
        db.flush()
    else:
        item.procurement_surgeon = payload.procurement_surgeon
        item.changed_by_id = changed_by_id

    if not item.slots:
        db.add(
            CoordinationProcurementSlot(
                coordination_procurement_organ_id=item.id,
                slot_key="MAIN",
                changed_by_id=changed_by_id,
            )
        )
    db.commit()
    return _organ_query(db).filter(CoordinationProcurementOrgan.id == item.id).first()


def update_procurement_organ(
    *,
    coordination_id: int,
    organ_id: int,
    payload: CoordinationProcurementOrganUpdate,
    changed_by_id: int,
    db: Session,
) -> CoordinationProcurementOrgan:
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
    item.changed_by_id = changed_by_id
    db.commit()
    return _organ_query(db).filter(CoordinationProcurementOrgan.id == item.id).first()


def upsert_procurement_value(
    *,
    coordination_id: int,
    organ_id: int,
    slot_key: str,
    field_template_id: int,
    payload: CoordinationProcurementValueCreate,
    changed_by_id: int,
    db: Session,
) -> CoordinationProcurementValue:
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
            changed_by_id=changed_by_id,
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
            changed_by_id=changed_by_id,
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
            changed_by_id=changed_by_id,
        )
        db.add(value)
    else:
        value.value = payload.value
        value.changed_by_id = changed_by_id

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
