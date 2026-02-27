from __future__ import annotations

from collections.abc import Iterable

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload

from ...models import (
    DatatypeDefinition,
    Episode,
    MedicalValue,
    MedicalValueGroup,
    MedicalValueGroupTemplate,
    MedicalValueTemplate,
    MedicalValueTemplateContextTemplate,
    Patient,
)
from ...schemas import MedicalValueCreate, MedicalValueUpdate


def build_context_key(
    *,
    organ_id: int | None = None,
    is_donor_context: bool = False,
) -> str:
    if is_donor_context:
        return "DONOR"
    if organ_id is None:
        return "STATIC"
    return f"ORGAN:{organ_id}"


def _iter_episode_organs(episode: Episode) -> Iterable[int]:
    if episode.organs:
        for organ in episode.organs:
            if organ and organ.id is not None:
                yield organ.id
        return
    if episode.organ_id is not None:
        yield episode.organ_id


def _context_token(*, organ_id: int | None, is_donor_context: bool) -> tuple[str, int | None]:
    if is_donor_context:
        return ("DONOR", None)
    if organ_id is None:
        return ("STATIC", None)
    return ("ORGAN", organ_id)


def ensure_group_instance(
    db: Session,
    *,
    patient_id: int,
    medical_value_group_id: int,
    context_key: str,
    organ_id: int | None,
    is_donor_context: bool,
    changed_by_id: int | None = None,
) -> MedicalValueGroup:
    instance = (
        db.query(MedicalValueGroup)
        .filter(
            MedicalValueGroup.patient_id == patient_id,
            MedicalValueGroup.medical_value_group_id == medical_value_group_id,
            MedicalValueGroup.context_key == context_key,
        )
        .first()
    )
    if instance:
        return instance
    instance = MedicalValueGroup(
        patient_id=patient_id,
        medical_value_group_id=medical_value_group_id,
        context_key=context_key,
        organ_id=organ_id,
        is_donor_context=is_donor_context,
        changed_by_id=changed_by_id,
    )
    db.add(instance)
    db.flush()
    return instance


def instantiate_templates_for_patient(
    db: Session,
    patient_id: int,
    *,
    include_donor_context: bool = False,
    changed_by_id: int | None = None,
) -> dict[str, int]:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return {"created_values": 0}

    groups = (
        db.query(MedicalValueGroupTemplate)
        .options(selectinload(MedicalValueGroupTemplate.context_templates))
        .all()
    )
    group_by_id = {group.id: group for group in groups}
    templates = (
        db.query(MedicalValueTemplate)
        .options(selectinload(MedicalValueTemplate.context_templates))
        .filter(MedicalValueTemplate.medical_value_group_id.isnot(None))
        .order_by(MedicalValueTemplate.pos.asc(), MedicalValueTemplate.id.asc())
        .all()
    )

    contexts: list[dict[str, int | str | bool | None]] = [{"organ_id": None, "organ_key": None, "is_donor_context": False}]
    open_episodes = db.query(Episode).filter(Episode.patient_id == patient_id, Episode.closed.is_(False)).all()
    seen_organ_ids: set[int] = set()
    for episode in open_episodes:
        for organ_id in _iter_episode_organs(episode):
            if organ_id in seen_organ_ids:
                continue
            seen_organ_ids.add(organ_id)
            organ_key = None
            if episode.organs:
                organ = next((entry for entry in episode.organs if entry and entry.id == organ_id), None)
                organ_key = organ.key if organ else None
            contexts.append(
                {
                    "organ_id": organ_id,
                    "organ_key": organ_key,
                    "is_donor_context": False,
                }
            )

    if include_donor_context:
        contexts.append({"organ_id": None, "organ_key": None, "is_donor_context": True})

    existing = {
        (
            row.medical_value_template_id,
            row.context_key or build_context_key(organ_id=row.organ_id, is_donor_context=row.is_donor_context),
        )
        for row in db.query(MedicalValue).filter(MedicalValue.patient_id == patient_id).all()
        if row.medical_value_template_id is not None
    }

    created = 0
    for context in contexts:
        token = _context_token(
            organ_id=context["organ_id"],  # type: ignore[arg-type]
            is_donor_context=bool(context["is_donor_context"]),
        )
        context_key = build_context_key(
            organ_id=context["organ_id"],  # type: ignore[arg-type]
            is_donor_context=bool(context["is_donor_context"]),
        )
        for template in templates:
            group = group_by_id.get(template.medical_value_group_id or -1)
            if not group:
                continue
            group_tokens = {(entry.context_kind, entry.organ_id) for entry in group.context_templates}
            template_tokens = {(entry.context_kind, entry.organ_id) for entry in template.context_templates}
            if token not in group_tokens or token not in template_tokens:
                continue
            key = (template.id, context_key)
            if key in existing:
                continue
            group_instance = ensure_group_instance(
                db,
                patient_id=patient_id,
                medical_value_group_id=template.medical_value_group_id,
                context_key=context_key,
                organ_id=context["organ_id"],  # type: ignore[arg-type]
                is_donor_context=bool(context["is_donor_context"]),
                changed_by_id=changed_by_id,
            )
            db.add(
                MedicalValue(
                    patient_id=patient_id,
                    medical_value_template_id=template.id,
                    datatype_id=template.datatype_id,
                    medical_value_group_id=template.medical_value_group_id,
                    medical_value_group_instance_id=group_instance.id,
                    name=template.name_default or "",
                    pos=template.pos or 0,
                    value="",
                    renew_date=None,
                    organ_id=context["organ_id"],  # type: ignore[arg-type]
                    is_donor_context=bool(context["is_donor_context"]),
                    context_key=context_key,
                    changed_by_id=changed_by_id,
                )
            )
            existing.add(key)
            created += 1

    db.commit()
    return {"created_values": created}


def _get_patient_or_404(patient_id: int, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


def _get_default_group_id(db: Session) -> int | None:
    group = (
        db.query(MedicalValueGroupTemplate)
        .filter(MedicalValueGroupTemplate.key == "USER_CAPTURED")
        .first()
    )
    return group.id if group else None


def list_medical_values_for_patient(*, patient_id: int, db: Session) -> list[MedicalValue]:
    _get_patient_or_404(patient_id, db)
    return (
        db.query(MedicalValue)
        .options(
            joinedload(MedicalValue.medical_value_template).joinedload(MedicalValueTemplate.datatype),
            joinedload(MedicalValue.medical_value_template).joinedload(MedicalValueTemplate.medical_value_group_template),
            joinedload(MedicalValue.medical_value_group_template),
            joinedload(MedicalValue.medical_value_group).joinedload(MedicalValueGroup.medical_value_group_template),
            joinedload(MedicalValue.datatype),
            joinedload(MedicalValue.changed_by_user),
        )
        .filter(MedicalValue.patient_id == patient_id)
        .order_by(MedicalValue.medical_value_group_id.asc(), MedicalValue.pos.asc(), MedicalValue.id.asc())
        .all()
    )


def create_medical_value_for_patient(
    *,
    patient_id: int,
    payload: MedicalValueCreate,
    changed_by_id: int,
    db: Session,
) -> MedicalValue:
    _get_patient_or_404(patient_id, db)
    data = payload.model_dump()
    template_id = data.get("medical_value_template_id")
    template = None
    if template_id:
        template = db.query(MedicalValueTemplate).filter(MedicalValueTemplate.id == template_id).first()
    if data.get("medical_value_group_id") is None:
        if template and template.medical_value_group_id is not None:
            data["medical_value_group_id"] = template.medical_value_group_id
        else:
            data["medical_value_group_id"] = _get_default_group_id(db)
    data.pop("episode_id", None)
    context_key = data.get("context_key") or build_context_key(
        organ_id=data.get("organ_id"),
        is_donor_context=bool(data.get("is_donor_context")),
    )
    data["context_key"] = context_key
    group_id = data.get("medical_value_group_id")
    if group_id is not None:
        group_instance = ensure_group_instance(
            db,
            patient_id=patient_id,
            medical_value_group_id=group_id,
            context_key=context_key,
            organ_id=data.get("organ_id"),
            is_donor_context=bool(data.get("is_donor_context")),
            changed_by_id=changed_by_id,
        )
        data["medical_value_group_instance_id"] = group_instance.id
    mv = MedicalValue(
        patient_id=patient_id,
        **data,
        changed_by_id=changed_by_id,
    )
    db.add(mv)
    db.commit()
    db.refresh(mv)
    return mv


def update_medical_value_for_patient(
    *,
    patient_id: int,
    medical_value_id: int,
    payload: MedicalValueUpdate,
    changed_by_id: int,
    db: Session,
) -> MedicalValue:
    mv = (
        db.query(MedicalValue)
        .filter(MedicalValue.id == medical_value_id, MedicalValue.patient_id == patient_id)
        .first()
    )
    if not mv:
        raise HTTPException(status_code=404, detail="Medical value not found")
    update_data = payload.model_dump(exclude_unset=True)
    update_data.pop("episode_id", None)
    for key, value in update_data.items():
        setattr(mv, key, value)
    if "medical_value_template_id" in update_data and "medical_value_group_id" not in update_data:
        template_id = update_data.get("medical_value_template_id")
        template = None
        if template_id:
            template = db.query(MedicalValueTemplate).filter(MedicalValueTemplate.id == template_id).first()
        mv.medical_value_group_id = (
            template.medical_value_group_id
            if template and template.medical_value_group_id is not None
            else _get_default_group_id(db)
        )
    if any(key in update_data for key in ("organ_id", "is_donor_context", "context_key", "medical_value_group_id")):
        mv.episode_id = None
        mv.context_key = update_data.get("context_key") or build_context_key(
            organ_id=mv.organ_id,
            is_donor_context=bool(mv.is_donor_context),
        )
        if mv.medical_value_group_id is not None:
            group_instance = ensure_group_instance(
                db,
                patient_id=patient_id,
                medical_value_group_id=mv.medical_value_group_id,
                context_key=mv.context_key,
                organ_id=mv.organ_id,
                is_donor_context=bool(mv.is_donor_context),
                changed_by_id=changed_by_id,
            )
            mv.medical_value_group_instance_id = group_instance.id
    mv.changed_by_id = changed_by_id
    db.commit()
    db.refresh(mv)
    return mv


def delete_medical_value_for_patient(*, patient_id: int, medical_value_id: int, db: Session) -> None:
    mv = (
        db.query(MedicalValue)
        .filter(MedicalValue.id == medical_value_id, MedicalValue.patient_id == patient_id)
        .first()
    )
    if not mv:
        raise HTTPException(status_code=404, detail="Medical value not found")
    db.delete(mv)
    db.commit()


def list_medical_value_templates(db: Session) -> list[MedicalValueTemplate]:
    return (
        db.query(MedicalValueTemplate)
        .options(
            joinedload(MedicalValueTemplate.datatype),
            joinedload(MedicalValueTemplate.datatype_definition).joinedload(DatatypeDefinition.code),
            joinedload(MedicalValueTemplate.medical_value_group_template),
            joinedload(MedicalValueTemplate.context_templates).joinedload(MedicalValueTemplateContextTemplate.organ),
            joinedload(MedicalValueTemplate.context_templates).joinedload(MedicalValueTemplateContextTemplate.changed_by_user),
        )
        .order_by(MedicalValueTemplate.pos)
        .all()
    )


def get_medical_value_template_or_404(template_id: int, db: Session) -> MedicalValueTemplate:
    mv = (
        db.query(MedicalValueTemplate)
        .options(
            joinedload(MedicalValueTemplate.datatype),
            joinedload(MedicalValueTemplate.datatype_definition).joinedload(DatatypeDefinition.code),
            joinedload(MedicalValueTemplate.medical_value_group_template),
            joinedload(MedicalValueTemplate.context_templates).joinedload(MedicalValueTemplateContextTemplate.organ),
            joinedload(MedicalValueTemplate.context_templates).joinedload(MedicalValueTemplateContextTemplate.changed_by_user),
        )
        .filter(MedicalValueTemplate.id == template_id)
        .first()
    )
    if not mv:
        raise HTTPException(status_code=404, detail="Medical value template not found")
    return mv
