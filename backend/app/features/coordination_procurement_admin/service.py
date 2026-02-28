from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from ...models import (
    Code,
    CoordinationProcurementFieldGroupTemplate,
    CoordinationProcurementFieldScopeTemplate,
    CoordinationProcurementFieldTemplate,
    CoordinationProcurementValue,
    CoordinationProcurementValuePerson,
    CoordinationProcurementValueTeam,
    DatatypeDefinition,
)
from ...schemas import (
    CoordinationProcurementAdminConfigResponse,
    CoordinationProcurementFieldGroupTemplateCreate,
    CoordinationProcurementFieldGroupTemplateUpdate,
    CoordinationProcurementFieldScopeTemplateCreate,
    CoordinationProcurementFieldTemplateCreate,
    CoordinationProcurementFieldTemplateUpdate,
)


def _field_template_query(db: Session):
    return db.query(CoordinationProcurementFieldTemplate).options(
        joinedload(CoordinationProcurementFieldTemplate.datatype_definition).joinedload(DatatypeDefinition.code),
        joinedload(CoordinationProcurementFieldTemplate.group_template),
    )


def _scope_template_query(db: Session):
    return db.query(CoordinationProcurementFieldScopeTemplate).options(
        joinedload(CoordinationProcurementFieldScopeTemplate.organ),
        joinedload(CoordinationProcurementFieldScopeTemplate.field_template),
    )


def _resolve_string_datatype_def_id(db: Session) -> int:
    item = (
        db.query(DatatypeDefinition)
        .join(Code, DatatypeDefinition.code_id == Code.id)
        .filter(Code.type == "DATATYPE", Code.key == "STRING")
        .first()
    )
    if not item:
        raise HTTPException(status_code=422, detail="STRING datatype definition not found")
    return item.id


def _mode_requires_user_datatype(value_mode: str | None) -> bool:
    return value_mode == "SCALAR"


def get_procurement_admin_config(*, db: Session) -> CoordinationProcurementAdminConfigResponse:
    field_group_templates = (
        db.query(CoordinationProcurementFieldGroupTemplate)
        .order_by(CoordinationProcurementFieldGroupTemplate.pos.asc(), CoordinationProcurementFieldGroupTemplate.id.asc())
        .all()
    )
    field_templates = (
        _field_template_query(db)
        .order_by(CoordinationProcurementFieldTemplate.pos.asc(), CoordinationProcurementFieldTemplate.id.asc())
        .all()
    )
    field_scope_templates = (
        _scope_template_query(db)
        .order_by(CoordinationProcurementFieldScopeTemplate.id.asc())
        .all()
    )
    datatype_definitions = (
        db.query(DatatypeDefinition)
        .options(joinedload(DatatypeDefinition.code))
        .order_by(DatatypeDefinition.id.asc())
        .all()
    )
    organs = (
        db.query(Code)
        .filter(Code.type == "ORGAN")
        .order_by(Code.pos.asc(), Code.name_default.asc(), Code.id.asc())
        .all()
    )
    return CoordinationProcurementAdminConfigResponse(
        field_group_templates=field_group_templates,
        field_templates=field_templates,
        field_scope_templates=field_scope_templates,
        datatype_definitions=datatype_definitions,
        organs=organs,
    )


def create_field_group_template(
    *,
    payload: CoordinationProcurementFieldGroupTemplateCreate,
    changed_by_id: int,
    db: Session,
) -> CoordinationProcurementFieldGroupTemplate:
    existing = db.query(CoordinationProcurementFieldGroupTemplate).filter(CoordinationProcurementFieldGroupTemplate.key == payload.key).first()
    if existing:
        raise HTTPException(status_code=422, detail="group key already exists")
    item = CoordinationProcurementFieldGroupTemplate(
        **payload.model_dump(),
        changed_by_id=changed_by_id,
    )
    db.add(item)
    db.commit()
    return item


def update_field_group_template(
    *,
    group_template_id: int,
    payload: CoordinationProcurementFieldGroupTemplateUpdate,
    changed_by_id: int,
    db: Session,
) -> CoordinationProcurementFieldGroupTemplate:
    item = db.query(CoordinationProcurementFieldGroupTemplate).filter(CoordinationProcurementFieldGroupTemplate.id == group_template_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Field group template not found")
    data = payload.model_dump(exclude_unset=True)
    if "key" in data and data["key"] != item.key:
        existing = db.query(CoordinationProcurementFieldGroupTemplate).filter(CoordinationProcurementFieldGroupTemplate.key == data["key"]).first()
        if existing:
            raise HTTPException(status_code=422, detail="group key already exists")
    for key, value in data.items():
        setattr(item, key, value)
    if data.get("is_active") is False:
        db.query(CoordinationProcurementFieldTemplate).filter(
            CoordinationProcurementFieldTemplate.group_template_id == group_template_id
        ).update(
            {
                CoordinationProcurementFieldTemplate.is_active: False,
                CoordinationProcurementFieldTemplate.changed_by_id: changed_by_id,
            },
            synchronize_session=False,
        )
    item.changed_by_id = changed_by_id
    db.commit()
    return item


def delete_field_group_template(*, group_template_id: int, db: Session) -> None:
    item = db.query(CoordinationProcurementFieldGroupTemplate).filter(CoordinationProcurementFieldGroupTemplate.id == group_template_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Field group template not found")
    db.query(CoordinationProcurementFieldTemplate).filter(
        CoordinationProcurementFieldTemplate.group_template_id == group_template_id
    ).update({CoordinationProcurementFieldTemplate.group_template_id: None})
    db.delete(item)
    db.commit()


def create_field_template(
    *,
    payload: CoordinationProcurementFieldTemplateCreate,
    changed_by_id: int,
    db: Session,
) -> CoordinationProcurementFieldTemplate:
    existing = db.query(CoordinationProcurementFieldTemplate).filter(CoordinationProcurementFieldTemplate.key == payload.key).first()
    if existing:
        raise HTTPException(status_code=422, detail="field key already exists")
    data = payload.model_dump()
    value_mode = payload.value_mode.value if hasattr(payload.value_mode, "value") else payload.value_mode
    if not _mode_requires_user_datatype(value_mode):
        data["datatype_def_id"] = _resolve_string_datatype_def_id(db)
    datatype_definition = db.query(DatatypeDefinition).filter(DatatypeDefinition.id == data["datatype_def_id"]).first()
    if not datatype_definition:
        raise HTTPException(status_code=422, detail="datatype_def_id not found")
    if payload.group_template_id is not None:
        group_template = db.query(CoordinationProcurementFieldGroupTemplate).filter(
            CoordinationProcurementFieldGroupTemplate.id == payload.group_template_id
        ).first()
        if not group_template:
            raise HTTPException(status_code=422, detail="group_template_id not found")
    item = CoordinationProcurementFieldTemplate(
        **data,
        changed_by_id=changed_by_id,
    )
    db.add(item)
    db.commit()
    return _field_template_query(db).filter(CoordinationProcurementFieldTemplate.id == item.id).first()


def update_field_template(
    *,
    field_template_id: int,
    payload: CoordinationProcurementFieldTemplateUpdate,
    changed_by_id: int,
    db: Session,
) -> CoordinationProcurementFieldTemplate:
    item = db.query(CoordinationProcurementFieldTemplate).filter(CoordinationProcurementFieldTemplate.id == field_template_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Field template not found")
    data = payload.model_dump(exclude_unset=True)
    current_value_mode = item.value_mode.value if hasattr(item.value_mode, "value") else item.value_mode
    next_mode_raw = data.get("value_mode")
    next_value_mode = next_mode_raw.value if hasattr(next_mode_raw, "value") else next_mode_raw
    if next_value_mode is not None and not _mode_requires_user_datatype(next_value_mode):
        data["datatype_def_id"] = _resolve_string_datatype_def_id(db)
    elif (
        "datatype_def_id" in data
        and not _mode_requires_user_datatype(current_value_mode)
        and (next_value_mode is None or not _mode_requires_user_datatype(next_value_mode))
    ):
        raise HTTPException(status_code=422, detail="datatype_def_id cannot be changed while value_mode is non-scalar")
    if "key" in data and data["key"] != item.key:
        existing = db.query(CoordinationProcurementFieldTemplate).filter(CoordinationProcurementFieldTemplate.key == data["key"]).first()
        if existing:
            raise HTTPException(status_code=422, detail="field key already exists")
    if "datatype_def_id" in data and data["datatype_def_id"] is not None:
        datatype_definition = db.query(DatatypeDefinition).filter(DatatypeDefinition.id == data["datatype_def_id"]).first()
        if not datatype_definition:
            raise HTTPException(status_code=422, detail="datatype_def_id not found")
    if "group_template_id" in data and data["group_template_id"] is not None:
        group_template = db.query(CoordinationProcurementFieldGroupTemplate).filter(
            CoordinationProcurementFieldGroupTemplate.id == data["group_template_id"]
        ).first()
        if not group_template:
            raise HTTPException(status_code=422, detail="group_template_id not found")
    old_value_mode = item.value_mode.value if hasattr(item.value_mode, "value") else item.value_mode
    for key, value in data.items():
        setattr(item, key, value)
    new_value_mode = item.value_mode.value if hasattr(item.value_mode, "value") else item.value_mode
    if new_value_mode != old_value_mode:
        value_rows = db.query(CoordinationProcurementValue).filter(
            CoordinationProcurementValue.field_template_id == field_template_id
        ).all()
        for value_row in value_rows:
            value_row.changed_by_id = changed_by_id
            if new_value_mode == "PERSON_SINGLE":
                kept_person_id = None
                if value_row.persons:
                    sorted_people = sorted(value_row.persons, key=lambda row: row.pos)
                    kept_person_id = sorted_people[0].person_id
                value_row.persons.clear()
                value_row.teams.clear()
                value_row.episode_ref = None
                value_row.value = ""
                if kept_person_id is not None:
                    value_row.persons.append(
                        CoordinationProcurementValuePerson(
                            person_id=kept_person_id,
                            pos=0,
                            changed_by_id=changed_by_id,
                        )
                    )
            elif new_value_mode == "TEAM_SINGLE":
                kept_team_id = None
                if value_row.teams:
                    sorted_teams = sorted(value_row.teams, key=lambda row: row.pos)
                    kept_team_id = sorted_teams[0].team_id
                value_row.teams.clear()
                value_row.persons.clear()
                value_row.episode_ref = None
                value_row.value = ""
                if kept_team_id is not None:
                    value_row.teams.append(
                        CoordinationProcurementValueTeam(
                            team_id=kept_team_id,
                            pos=0,
                            changed_by_id=changed_by_id,
                        )
                    )
            elif new_value_mode == "PERSON_LIST":
                value_row.teams.clear()
                value_row.episode_ref = None
                value_row.value = ""
            elif new_value_mode == "TEAM_LIST":
                value_row.persons.clear()
                value_row.episode_ref = None
                value_row.value = ""
            elif new_value_mode == "EPISODE":
                value_row.persons.clear()
                value_row.teams.clear()
                value_row.value = ""
            else:
                value_row.persons.clear()
                value_row.teams.clear()
                value_row.episode_ref = None
    item.changed_by_id = changed_by_id
    db.commit()
    return _field_template_query(db).filter(CoordinationProcurementFieldTemplate.id == item.id).first()


def delete_field_template(*, field_template_id: int, db: Session) -> None:
    item = db.query(CoordinationProcurementFieldTemplate).filter(CoordinationProcurementFieldTemplate.id == field_template_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Field template not found")
    raise HTTPException(
        status_code=422,
        detail="Field templates are protected and cannot be deleted",
    )


def create_field_scope_template(
    *,
    payload: CoordinationProcurementFieldScopeTemplateCreate,
    changed_by_id: int,
    db: Session,
) -> CoordinationProcurementFieldScopeTemplate:
    field_template = db.query(CoordinationProcurementFieldTemplate).filter(
        CoordinationProcurementFieldTemplate.id == payload.field_template_id
    ).first()
    if not field_template:
        raise HTTPException(status_code=422, detail="field_template_id not found")
    if payload.organ_id is not None:
        organ = db.query(Code).filter(Code.id == payload.organ_id, Code.type == "ORGAN").first()
        if not organ:
            raise HTTPException(status_code=422, detail="organ_id must reference CODE.ORGAN")
    duplicate = db.query(CoordinationProcurementFieldScopeTemplate).filter(
        CoordinationProcurementFieldScopeTemplate.field_template_id == payload.field_template_id,
        CoordinationProcurementFieldScopeTemplate.organ_id == payload.organ_id,
        CoordinationProcurementFieldScopeTemplate.slot_key == payload.slot_key.value,
    ).first()
    if duplicate:
        raise HTTPException(status_code=422, detail="Field scope already exists")
    item = CoordinationProcurementFieldScopeTemplate(
        field_template_id=payload.field_template_id,
        organ_id=payload.organ_id,
        slot_key=payload.slot_key.value,
        changed_by_id=changed_by_id,
    )
    db.add(item)
    db.commit()
    return _scope_template_query(db).filter(CoordinationProcurementFieldScopeTemplate.id == item.id).first()


def delete_field_scope_template(*, scope_template_id: int, db: Session) -> None:
    item = db.query(CoordinationProcurementFieldScopeTemplate).filter(CoordinationProcurementFieldScopeTemplate.id == scope_template_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Field scope template not found")
    db.delete(item)
    db.commit()
