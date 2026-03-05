from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from ...enums import ProcurementSlotKey
from ...features.coordination_procurement_flex.catalog import (
    PERSON_LIST_KEY_BY_FIELD,
    PROCUREMENT_TYPED_SPEC_BY_KEY,
    TEAM_LIST_KEY_BY_FIELD,
    format_scalar_value,
    get_typed_column_value,
    parse_scalar_value,
    set_typed_column_value,
)
from ...models import (
    Code,
    Coordination,
    CoordinationEpisode,
    CoordinationProcurementFieldGroupTemplate,
    CoordinationProcurementFieldScopeTemplate,
    CoordinationProcurementProtocolTaskGroupSelection,
    CoordinationProcurement,
    CoordinationProcurementOrganRejection,
    CoordinationProcurementFieldTemplate,
    CoordinationProcurementTypedData,
    CoordinationProcurementTypedDataPersonList,
    CoordinationProcurementTypedDataTeamList,
    Episode,
    Person,
    PersonTeam,
    TaskGroupTemplate,
)
from ...schemas import (
    CoordinationProcurementFlexResponse,
    CoordinationProcurementOrganCreate,
    CoordinationProcurementOrganUpdate,
    CoordinationProcurementValueCreate,
    CoordinationProcurementFieldTemplateResponse,
    CoordinationProcurementFieldScopeTemplateResponse,
    CoordinationProcurementFieldGroupTemplateResponse,
    CoordinationProcurementOrganResponse,
    CoordinationProcurementSlotResponse,
    CoordinationProcurementValueResponse,
)

_DUAL_ASSIGNMENT_ORGAN_KEYS = {"KIDNEY", "LUNG"}


def _ensure_coordination_exists(coordination_id: int, db: Session) -> None:
    item = db.query(Coordination).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")


def _load_typed_rows(*, coordination_id: int, db: Session) -> list[CoordinationProcurementTypedData]:
    return (
        db.query(CoordinationProcurementTypedData)
        .options(
            joinedload(CoordinationProcurementTypedData.organ),
            joinedload(CoordinationProcurementTypedData.arzt_responsible_person),
            joinedload(CoordinationProcurementTypedData.chirurg_responsible_person),
            joinedload(CoordinationProcurementTypedData.procurment_team_team),
            joinedload(CoordinationProcurementTypedData.recipient_episode),
            joinedload(CoordinationProcurementTypedData.person_lists).joinedload(CoordinationProcurementTypedDataPersonList.person),
            joinedload(CoordinationProcurementTypedData.team_lists).joinedload(CoordinationProcurementTypedDataTeamList.team),
            joinedload(CoordinationProcurementTypedData.changed_by_user),
        )
        .filter(CoordinationProcurementTypedData.coordination_id == coordination_id)
        .all()
    )


def _next_value_id(row: CoordinationProcurementTypedData, field_template_id: int) -> int:
    return (row.id * 10000) + field_template_id


def _enum_value(raw: object) -> str:
    return raw.value if hasattr(raw, "value") else str(raw or "")


def _max_assignments_for_organ(*, organ_id: int, db: Session) -> int:
    organ = db.query(Code).filter(Code.id == organ_id, Code.type == "ORGAN").first()
    organ_key = ((organ.key if organ else "") or "").strip().upper()
    return 2 if organ_key in _DUAL_ASSIGNMENT_ORGAN_KEYS else 1


def _attach_episode_link(
    *,
    coordination_id: int,
    organ_id: int,
    episode_id: int,
    changed_by_id: int,
    db: Session,
) -> CoordinationEpisode:
    existing_for_episode = (
        db.query(CoordinationEpisode)
        .filter(
            CoordinationEpisode.coordination_id == coordination_id,
            CoordinationEpisode.organ_id == organ_id,
            CoordinationEpisode.episode_id == episode_id,
        )
        .first()
    )
    if existing_for_episode:
        return existing_for_episode

    existing_rows = (
        db.query(CoordinationEpisode)
        .filter(
            CoordinationEpisode.coordination_id == coordination_id,
            CoordinationEpisode.organ_id == organ_id,
        )
        .order_by(CoordinationEpisode.id.asc())
        .all()
    )
    max_allowed = _max_assignments_for_organ(organ_id=organ_id, db=db)

    # For single-assignment organs, treat a new selection as replacement.
    if max_allowed == 1 and existing_rows:
        row = existing_rows[0]
        row.episode_id = episode_id
        row.changed_by_id = changed_by_id
        db.flush()
        return row

    if len(existing_rows) >= max_allowed:
        raise HTTPException(
            status_code=422,
            detail=f"At most {max_allowed} episode assignment(s) are allowed for the selected organ in this coordination.",
        )

    row = CoordinationEpisode(
        coordination_id=coordination_id,
        episode_id=episode_id,
        organ_id=organ_id,
        changed_by_id=changed_by_id,
    )
    db.add(row)
    db.flush()
    return row


def _sync_episode_links_from_typed_rows(
    *,
    coordination_id: int,
    organ_id: int,
    changed_by_id: int,
    db: Session,
) -> None:
    referenced_episode_ids = {
        row.recipient_episode_id
        for row in (
            db.query(CoordinationProcurementTypedData)
            .filter(
                CoordinationProcurementTypedData.coordination_id == coordination_id,
                CoordinationProcurementTypedData.organ_id == organ_id,
                CoordinationProcurementTypedData.recipient_episode_id.isnot(None),
            )
            .all()
        )
        if row.recipient_episode_id is not None
    }
    existing_rows = (
        db.query(CoordinationEpisode)
        .filter(
            CoordinationEpisode.coordination_id == coordination_id,
            CoordinationEpisode.organ_id == organ_id,
        )
        .order_by(CoordinationEpisode.id.asc())
        .all()
    )
    existing_by_episode_id: dict[int, CoordinationEpisode] = {}
    duplicate_row_ids: set[int] = set()
    for row in existing_rows:
        if row.episode_id in existing_by_episode_id:
            duplicate_row_ids.add(row.id)
            continue
        existing_by_episode_id[row.episode_id] = row

    for row in existing_rows:
        if row.id in duplicate_row_ids:
            db.delete(row)
            continue
        if row.episode_id not in referenced_episode_ids and not row.is_organ_rejected:
            db.delete(row)

    for episode_id in referenced_episode_ids:
        existing = existing_by_episode_id.get(episode_id)
        if existing is None:
            continue
        if existing.is_organ_rejected:
            existing.is_organ_rejected = False
            existing.changed_by_id = changed_by_id

    existing_episode_ids = set(existing_by_episode_id.keys())
    missing_episode_ids = referenced_episode_ids - existing_episode_ids
    for episode_id in missing_episode_ids:
        db.add(
            CoordinationEpisode(
                coordination_id=coordination_id,
                organ_id=organ_id,
                episode_id=episode_id,
                changed_by_id=changed_by_id,
            )
        )


def _build_value_response(
    *,
    row: CoordinationProcurementTypedData,
    field_template: CoordinationProcurementFieldTemplate,
) -> CoordinationProcurementValueResponse | None:
    spec = PROCUREMENT_TYPED_SPEC_BY_KEY.get(field_template.key)
    if not spec:
        return None

    persons: list[dict[str, object]] = []
    teams: list[dict[str, object]] = []
    episode_ref = None
    value_text = ""

    if spec.kind in {"string", "date", "datetime", "boolean"}:
        raw_value = get_typed_column_value(row, field_template.key)
        if raw_value is None:
            return None
        value_text = format_scalar_value(spec.kind, raw_value)
    elif spec.kind == "person_single":
        person = row.arzt_responsible_person if field_template.key == "ARZT_RESPONSIBLE" else row.chirurg_responsible_person
        if not person:
            return None
        persons = [{"id": _next_value_id(row, field_template.id), "pos": 0, "person": person}]
    elif spec.kind == "team_single":
        team = row.procurment_team_team
        if not team:
            return None
        teams = [{"id": _next_value_id(row, field_template.id), "pos": 0, "team": team}]
    elif spec.kind == "episode_single":
        episode = row.recipient_episode
        if not episode:
            return None
        episode_ref = {"id": _next_value_id(row, field_template.id), "episode_id": episode.id, "episode": episode}
    elif spec.kind == "person_list":
        list_key = PERSON_LIST_KEY_BY_FIELD.get(field_template.key)
        selected = [entry for entry in sorted(row.person_lists, key=lambda item: item.pos) if _enum_value(entry.list_key) == list_key]
        if not selected:
            return None
        persons = [{"id": entry.id, "pos": entry.pos, "person": entry.person} for entry in selected if entry.person is not None]
    elif spec.kind == "team_list":
        list_key = TEAM_LIST_KEY_BY_FIELD.get(field_template.key)
        selected = [entry for entry in sorted(row.team_lists, key=lambda item: item.pos) if _enum_value(entry.list_key) == list_key]
        if not selected:
            return None
        teams = [{"id": entry.id, "pos": entry.pos, "team": entry.team} for entry in selected if entry.team is not None]
    else:
        return None

    return CoordinationProcurementValueResponse(
        id=_next_value_id(row, field_template.id),
        slot_id=row.id,
        field_template_id=field_template.id,
        value=value_text,
        field_template=field_template,
        changed_by_id=row.changed_by_id,
        changed_by_user=row.changed_by_user,
        created_at=row.created_at,
        updated_at=row.updated_at,
        persons=persons,
        teams=teams,
        episode_ref=episode_ref,
    )


def _build_flex_response_from_typed_data(
    *,
    coordination_id: int,
    procurement: CoordinationProcurement | None,
    field_templates: list[CoordinationProcurementFieldTemplate],
    field_scope_templates: list[CoordinationProcurementFieldScopeTemplate],
    field_group_templates: list[CoordinationProcurementFieldGroupTemplate],
    protocol_task_group_selections: list[CoordinationProcurementProtocolTaskGroupSelection],
    typed_rows: list[CoordinationProcurementTypedData],
    organ_rejections: list[CoordinationProcurementOrganRejection],
) -> CoordinationProcurementFlexResponse:
    slot_rows_by_organ: dict[int, list[CoordinationProcurementTypedData]] = {}
    for row in typed_rows:
        slot_rows_by_organ.setdefault(row.organ_id, []).append(row)
    rejection_by_organ_id = {entry.organ_id: entry for entry in organ_rejections}
    organ_ids = sorted(set(slot_rows_by_organ.keys()) | set(rejection_by_organ_id.keys()))
    organs: list[CoordinationProcurementOrganResponse] = []
    for organ_id in organ_ids:
        rows_for_organ = sorted(
            slot_rows_by_organ.get(organ_id, []),
            key=lambda item: item.slot_key.value if hasattr(item.slot_key, "value") else item.slot_key,
        )
        sample_row = rows_for_organ[0] if rows_for_organ else None
        rejection_row = rejection_by_organ_id.get(organ_id)
        slots: list[CoordinationProcurementSlotResponse] = []
        for row in rows_for_organ:
            values = []
            for field_template in field_templates:
                value = _build_value_response(row=row, field_template=field_template)
                if value is not None:
                    values.append(value)
            slot_key = row.slot_key.value if hasattr(row.slot_key, "value") else row.slot_key
            slots.append(
                CoordinationProcurementSlotResponse(
                    id=row.id,
                    coordination_procurement_organ_id=organ_id,
                    slot_key=slot_key,
                    values=values,
                    changed_by_id=row.changed_by_id,
                    changed_by_user=row.changed_by_user,
                    created_at=row.created_at,
                    updated_at=row.updated_at,
                )
            )
        organs.append(
            CoordinationProcurementOrganResponse(
                id=organ_id,
                coordination_id=coordination_id,
                organ_id=organ_id,
                procurement_surgeon="",
                organ_rejected=bool(rejection_row.is_rejected) if rejection_row else False,
                organ_rejection_comment=(rejection_row.rejection_comment or "") if rejection_row else "",
                organ=sample_row.organ if sample_row else None,
                slots=slots,
                changed_by_id=(
                    rejection_row.changed_by_id
                    if rejection_row is not None
                    else (sample_row.changed_by_id if sample_row else None)
                ),
                changed_by_user=(
                    rejection_row.changed_by_user
                    if rejection_row is not None
                    else (sample_row.changed_by_user if sample_row else None)
                ),
                created_at=(
                    rejection_row.created_at
                    if rejection_row is not None
                    else (sample_row.created_at if sample_row else None)
                ),
                updated_at=(
                    rejection_row.updated_at
                    if rejection_row is not None
                    else (sample_row.updated_at if sample_row else None)
                ),
            )
        )

    return CoordinationProcurementFlexResponse(
        procurement=procurement,
        organs=organs,
        field_group_templates=[
            CoordinationProcurementFieldGroupTemplateResponse.model_validate(group, from_attributes=True)
            for group in field_group_templates
        ],
        field_templates=[
            CoordinationProcurementFieldTemplateResponse.model_validate(template, from_attributes=True)
            for template in field_templates
        ],
        field_scope_templates=[
            CoordinationProcurementFieldScopeTemplateResponse.model_validate(scope, from_attributes=True)
            for scope in field_scope_templates
        ],
        protocol_task_group_selections=protocol_task_group_selections,
    )


def get_procurement_flex(*, coordination_id: int, db: Session) -> CoordinationProcurementFlexResponse:
    _ensure_coordination_exists(coordination_id, db)
    procurement = (
        db.query(CoordinationProcurement)
        .options(joinedload(CoordinationProcurement.changed_by_user))
        .filter(CoordinationProcurement.coordination_id == coordination_id)
        .first()
    )
    typed_rows = _load_typed_rows(coordination_id=coordination_id, db=db)
    field_templates = (
        db.query(CoordinationProcurementFieldTemplate)
        .options(
            joinedload(CoordinationProcurementFieldTemplate.datatype_definition),
            joinedload(CoordinationProcurementFieldTemplate.group_template),
        )
        .filter(CoordinationProcurementFieldTemplate.is_active.is_(True))
        .order_by(CoordinationProcurementFieldTemplate.pos.asc(), CoordinationProcurementFieldTemplate.id.asc())
        .all()
    )
    field_group_templates = (
        db.query(CoordinationProcurementFieldGroupTemplate)
        .filter(CoordinationProcurementFieldGroupTemplate.is_active.is_(True))
        .order_by(CoordinationProcurementFieldGroupTemplate.pos.asc(), CoordinationProcurementFieldGroupTemplate.id.asc())
        .all()
    )
    field_scope_templates = (
        db.query(CoordinationProcurementFieldScopeTemplate)
        .options(
            joinedload(CoordinationProcurementFieldScopeTemplate.organ),
            joinedload(CoordinationProcurementFieldScopeTemplate.field_template),
        )
        .order_by(CoordinationProcurementFieldScopeTemplate.id.asc())
        .all()
    )
    protocol_task_group_selections = (
        db.query(CoordinationProcurementProtocolTaskGroupSelection)
        .options(
            joinedload(CoordinationProcurementProtocolTaskGroupSelection.task_group_template).joinedload(TaskGroupTemplate.scope),
            joinedload(CoordinationProcurementProtocolTaskGroupSelection.task_group_template).joinedload(TaskGroupTemplate.organ),
            joinedload(CoordinationProcurementProtocolTaskGroupSelection.organ),
            joinedload(CoordinationProcurementProtocolTaskGroupSelection.changed_by_user),
        )
        .order_by(CoordinationProcurementProtocolTaskGroupSelection.pos.asc(), CoordinationProcurementProtocolTaskGroupSelection.id.asc())
        .all()
    )
    organ_rejections = (
        db.query(CoordinationProcurementOrganRejection)
        .options(
            joinedload(CoordinationProcurementOrganRejection.organ),
            joinedload(CoordinationProcurementOrganRejection.changed_by_user),
        )
        .filter(CoordinationProcurementOrganRejection.coordination_id == coordination_id)
        .all()
    )
    return _build_flex_response_from_typed_data(
        coordination_id=coordination_id,
        procurement=procurement,
        field_templates=field_templates,
        field_scope_templates=field_scope_templates,
        field_group_templates=field_group_templates,
        protocol_task_group_selections=protocol_task_group_selections,
        typed_rows=typed_rows,
        organ_rejections=organ_rejections,
    )


def upsert_procurement_organ(
    *,
    coordination_id: int,
    organ_id: int,
    payload: CoordinationProcurementOrganCreate,
    changed_by_id: int,
    db: Session,
) -> CoordinationProcurementOrganResponse:
    _ensure_coordination_exists(coordination_id, db)
    row = (
        db.query(CoordinationProcurementOrganRejection)
        .filter(
            CoordinationProcurementOrganRejection.coordination_id == coordination_id,
            CoordinationProcurementOrganRejection.organ_id == organ_id,
        )
        .first()
    )
    if not row:
        row = CoordinationProcurementOrganRejection(
            coordination_id=coordination_id,
            organ_id=organ_id,
            is_rejected=bool(payload.organ_rejected),
            rejection_comment=(payload.organ_rejection_comment or "").strip(),
            changed_by_id=changed_by_id,
        )
        db.add(row)
    else:
        row.is_rejected = bool(payload.organ_rejected)
        row.rejection_comment = (payload.organ_rejection_comment or "").strip()
        row.changed_by_id = changed_by_id

    if row.is_rejected:
        db.query(CoordinationProcurementTypedData).filter(
            CoordinationProcurementTypedData.coordination_id == coordination_id,
            CoordinationProcurementTypedData.organ_id == organ_id,
        ).update(
            {CoordinationProcurementTypedData.recipient_episode_id: None},
            synchronize_session=False,
        )
        db.query(CoordinationEpisode).filter(
            CoordinationEpisode.coordination_id == coordination_id,
            CoordinationEpisode.organ_id == organ_id,
        ).delete(synchronize_session=False)

    db.commit()
    response = get_procurement_flex(coordination_id=coordination_id, db=db)
    existing = next((item for item in response.organs if item.organ_id == organ_id), None)
    if existing:
        return existing
    return CoordinationProcurementOrganResponse(
        id=organ_id,
        coordination_id=coordination_id,
        organ_id=organ_id,
        procurement_surgeon="",
        organ_rejected=bool(payload.organ_rejected),
        organ_rejection_comment=(payload.organ_rejection_comment or "").strip(),
        organ=None,
        slots=[],
        changed_by_id=changed_by_id,
        changed_by_user=None,
        created_at=datetime.now(),
        updated_at=None,
    )


def update_procurement_organ(
    *,
    coordination_id: int,
    organ_id: int,
    payload: CoordinationProcurementOrganUpdate,
    changed_by_id: int,
    db: Session,
) -> CoordinationProcurementOrganResponse:
    _ensure_coordination_exists(coordination_id, db)
    existing = (
        db.query(CoordinationProcurementOrganRejection)
        .filter(
            CoordinationProcurementOrganRejection.coordination_id == coordination_id,
            CoordinationProcurementOrganRejection.organ_id == organ_id,
        )
        .first()
    )
    if existing is None:
        return upsert_procurement_organ(
            coordination_id=coordination_id,
            organ_id=organ_id,
            payload=CoordinationProcurementOrganCreate(
                procurement_surgeon=payload.procurement_surgeon or "",
                organ_rejected=bool(payload.organ_rejected),
                organ_rejection_comment=payload.organ_rejection_comment or "",
            ),
            changed_by_id=changed_by_id,
            db=db,
        )

    if payload.organ_rejected is not None:
        existing.is_rejected = bool(payload.organ_rejected)
    if payload.organ_rejection_comment is not None:
        existing.rejection_comment = payload.organ_rejection_comment.strip()
    existing.changed_by_id = changed_by_id

    if existing.is_rejected:
        db.query(CoordinationProcurementTypedData).filter(
            CoordinationProcurementTypedData.coordination_id == coordination_id,
            CoordinationProcurementTypedData.organ_id == organ_id,
        ).update(
            {CoordinationProcurementTypedData.recipient_episode_id: None},
            synchronize_session=False,
        )
        db.query(CoordinationEpisode).filter(
            CoordinationEpisode.coordination_id == coordination_id,
            CoordinationEpisode.organ_id == organ_id,
        ).delete(synchronize_session=False)

    db.commit()
    response = get_procurement_flex(coordination_id=coordination_id, db=db)
    item = next((entry for entry in response.organs if entry.organ_id == organ_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Coordination procurement organ not found")
    return item


def upsert_procurement_value(
    *,
    coordination_id: int,
    organ_id: int,
    slot_key: ProcurementSlotKey,
    field_template_id: int,
    payload: CoordinationProcurementValueCreate,
    changed_by_id: int,
    db: Session,
) -> CoordinationProcurementValueResponse:
    field_template = (
        db.query(CoordinationProcurementFieldTemplate)
        .options(joinedload(CoordinationProcurementFieldTemplate.group_template))
        .filter(CoordinationProcurementFieldTemplate.id == field_template_id)
        .first()
    )
    if not field_template:
        raise HTTPException(status_code=404, detail="Field template not found")
    if not field_template.is_active:
        raise HTTPException(status_code=422, detail="Field template is inactive")
    spec = PROCUREMENT_TYPED_SPEC_BY_KEY.get(field_template.key)
    if not spec:
        raise HTTPException(status_code=422, detail=f"No typed attribute mapping defined for field key '{field_template.key}'")

    _ensure_coordination_exists(coordination_id, db)
    rejection = (
        db.query(CoordinationProcurementOrganRejection)
        .filter(
            CoordinationProcurementOrganRejection.coordination_id == coordination_id,
            CoordinationProcurementOrganRejection.organ_id == organ_id,
            CoordinationProcurementOrganRejection.is_rejected.is_(True),
        )
        .first()
    )
    if rejection is not None and payload.episode_id is not None:
        raise HTTPException(
            status_code=422,
            detail="Cannot assign recipient episode while organ is marked as rejected",
        )
    typed_row = (
        db.query(CoordinationProcurementTypedData)
        .filter(
            CoordinationProcurementTypedData.coordination_id == coordination_id,
            CoordinationProcurementTypedData.organ_id == organ_id,
            CoordinationProcurementTypedData.slot_key == slot_key.value,
        )
        .first()
    )
    if not typed_row:
        typed_row = CoordinationProcurementTypedData(
            coordination_id=coordination_id,
            organ_id=organ_id,
            slot_key=slot_key.value,
            changed_by_id=changed_by_id,
        )
        db.add(typed_row)
        db.flush()

    if spec.kind in {"string", "date", "datetime", "boolean"}:
        parsed_value = parse_scalar_value(spec.kind, payload.value or "")
        set_typed_column_value(typed_row, field_template.key, parsed_value)
    elif spec.kind == "person_single":
        unique_person_ids = list(dict.fromkeys(payload.person_ids))
        if len(unique_person_ids) > 1:
            raise HTTPException(status_code=422, detail="PERSON_SINGLE mode accepts at most one person_id")
        if unique_person_ids:
            existing_people = db.query(Person).filter(Person.id.in_(unique_person_ids)).all()
            by_id = {row.id: row for row in existing_people}
            missing = [person_id for person_id in unique_person_ids if person_id not in by_id]
            if missing:
                raise HTTPException(status_code=422, detail=f"Unknown person_ids: {', '.join(map(str, missing))}")
        set_typed_column_value(typed_row, field_template.key, unique_person_ids[0] if unique_person_ids else None)
    elif spec.kind == "person_list":
        list_key = PERSON_LIST_KEY_BY_FIELD[field_template.key]
        unique_person_ids = list(dict.fromkeys(payload.person_ids))
        if unique_person_ids:
            existing_people = db.query(Person).filter(Person.id.in_(unique_person_ids)).all()
            by_id = {row.id: row for row in existing_people}
            missing = [person_id for person_id in unique_person_ids if person_id not in by_id]
            if missing:
                raise HTTPException(status_code=422, detail=f"Unknown person_ids: {', '.join(map(str, missing))}")
        typed_row.person_lists = [entry for entry in typed_row.person_lists if _enum_value(entry.list_key) != list_key]
        for index, person_id in enumerate(unique_person_ids):
            typed_row.person_lists.append(
                CoordinationProcurementTypedDataPersonList(
                    list_key=list_key,
                    person_id=person_id,
                    pos=index,
                    changed_by_id=changed_by_id,
                )
            )
    elif spec.kind == "team_single":
        unique_team_ids = list(dict.fromkeys(payload.team_ids))
        if len(unique_team_ids) > 1:
            raise HTTPException(status_code=422, detail="TEAM_SINGLE mode accepts at most one team_id")
        if unique_team_ids:
            existing_teams = db.query(PersonTeam).filter(PersonTeam.id.in_(unique_team_ids)).all()
            by_id = {row.id: row for row in existing_teams}
            missing = [team_id for team_id in unique_team_ids if team_id not in by_id]
            if missing:
                raise HTTPException(status_code=422, detail=f"Unknown team_ids: {', '.join(map(str, missing))}")
        set_typed_column_value(typed_row, field_template.key, unique_team_ids[0] if unique_team_ids else None)
    elif spec.kind == "team_list":
        list_key = TEAM_LIST_KEY_BY_FIELD[field_template.key]
        unique_team_ids = list(dict.fromkeys(payload.team_ids))
        if field_template.key == "IMPLANT_TEAM" and len(unique_team_ids) > 1:
            raise HTTPException(status_code=422, detail="IMPLANT_TEAM accepts at most one team_id")
        if unique_team_ids:
            existing_teams = db.query(PersonTeam).filter(PersonTeam.id.in_(unique_team_ids)).all()
            by_id = {row.id: row for row in existing_teams}
            missing = [team_id for team_id in unique_team_ids if team_id not in by_id]
            if missing:
                raise HTTPException(status_code=422, detail=f"Unknown team_ids: {', '.join(map(str, missing))}")
        typed_row.team_lists = [entry for entry in typed_row.team_lists if _enum_value(entry.list_key) != list_key]
        for index, team_id in enumerate(unique_team_ids):
            typed_row.team_lists.append(
                CoordinationProcurementTypedDataTeamList(
                    list_key=list_key,
                    team_id=team_id,
                    pos=index,
                    changed_by_id=changed_by_id,
                )
            )
    elif spec.kind == "episode_single":
        episode_id = payload.episode_id
        if episode_id is None:
            previous_episode_id = get_typed_column_value(typed_row, field_template.key)
            set_typed_column_value(typed_row, field_template.key, None)
            if previous_episode_id is not None:
                # Keep coordination_episode rows in sync with slot-level recipient selection.
                # Remove the link only when no other slot for this organ still references it.
                db.flush()
                still_referenced = (
                    db.query(CoordinationProcurementTypedData)
                    .filter(
                        CoordinationProcurementTypedData.coordination_id == coordination_id,
                        CoordinationProcurementTypedData.organ_id == organ_id,
                        CoordinationProcurementTypedData.recipient_episode_id == previous_episode_id,
                    )
                    .first()
                )
                if not still_referenced:
                    (
                        db.query(CoordinationEpisode)
                        .filter(
                            CoordinationEpisode.coordination_id == coordination_id,
                            CoordinationEpisode.organ_id == organ_id,
                            CoordinationEpisode.episode_id == previous_episode_id,
                        )
                        .delete()
                    )
        else:
            other_slot_rows = (
                db.query(CoordinationProcurementTypedData)
                .filter(
                    CoordinationProcurementTypedData.coordination_id == coordination_id,
                    CoordinationProcurementTypedData.organ_id == organ_id,
                    CoordinationProcurementTypedData.id != typed_row.id,
                    CoordinationProcurementTypedData.recipient_episode_id.isnot(None),
                )
                .all()
            )
            current_slot_value = slot_key.value
            has_main_assignment_elsewhere = any(
                (row.slot_key.value if hasattr(row.slot_key, "value") else str(row.slot_key)) == ProcurementSlotKey.MAIN.value
                for row in other_slot_rows
            )
            has_side_assignment_elsewhere = any(
                (row.slot_key.value if hasattr(row.slot_key, "value") else str(row.slot_key))
                in {ProcurementSlotKey.LEFT.value, ProcurementSlotKey.RIGHT.value}
                for row in other_slot_rows
            )
            if current_slot_value == ProcurementSlotKey.MAIN.value and has_side_assignment_elsewhere:
                raise HTTPException(
                    status_code=422,
                    detail="Use either MAIN or LEFT/RIGHT recipient assignment slots, not both",
                )
            if current_slot_value in {ProcurementSlotKey.LEFT.value, ProcurementSlotKey.RIGHT.value} and has_main_assignment_elsewhere:
                raise HTTPException(
                    status_code=422,
                    detail="Use either MAIN or LEFT/RIGHT recipient assignment slots, not both",
                )
            duplicate_slot = (
                db.query(CoordinationProcurementTypedData)
                .filter(
                    CoordinationProcurementTypedData.coordination_id == coordination_id,
                    CoordinationProcurementTypedData.organ_id == organ_id,
                    CoordinationProcurementTypedData.id != typed_row.id,
                    CoordinationProcurementTypedData.recipient_episode_id == episode_id,
                )
                .first()
            )
            if duplicate_slot is not None:
                raise HTTPException(
                    status_code=422,
                    detail="episode_id is already assigned to another slot for this organ in this coordination",
                )
            episode = (
                db.query(Episode)
                .options(joinedload(Episode.organs))
                .filter(Episode.id == episode_id)
                .first()
            )
            if not episode:
                raise HTTPException(status_code=422, detail="episode_id must reference EPISODE")
            organ_ids = [entry.id for entry in (episode.organs or []) if entry and entry.id is not None]
            if not organ_ids and episode.organ_id is not None:
                organ_ids = [episode.organ_id]
            if organ_id not in organ_ids:
                raise HTTPException(
                    status_code=422,
                    detail="episode_id must reference an episode with the selected organ",
                )
            _attach_episode_link(
                coordination_id=coordination_id,
                organ_id=organ_id,
                episode_id=episode_id,
                changed_by_id=changed_by_id,
                db=db,
            )
            set_typed_column_value(typed_row, field_template.key, episode_id)
        # SessionLocal uses autoflush=False, so persist slot recipient changes
        # before synchronizing coordination_episode links from typed rows.
        db.flush()
        _sync_episode_links_from_typed_rows(
            coordination_id=coordination_id,
            organ_id=organ_id,
            changed_by_id=changed_by_id,
            db=db,
        )

    typed_row.changed_by_id = changed_by_id
    db.commit()
    refreshed = (
        db.query(CoordinationProcurementTypedData)
        .options(
            joinedload(CoordinationProcurementTypedData.arzt_responsible_person),
            joinedload(CoordinationProcurementTypedData.chirurg_responsible_person),
            joinedload(CoordinationProcurementTypedData.procurment_team_team),
            joinedload(CoordinationProcurementTypedData.recipient_episode),
            joinedload(CoordinationProcurementTypedData.person_lists).joinedload(CoordinationProcurementTypedDataPersonList.person),
            joinedload(CoordinationProcurementTypedData.team_lists).joinedload(CoordinationProcurementTypedDataTeamList.team),
            joinedload(CoordinationProcurementTypedData.changed_by_user),
        )
        .filter(CoordinationProcurementTypedData.id == typed_row.id)
        .first()
    )
    response = _build_value_response(row=refreshed, field_template=field_template)
    if response is None:
        return CoordinationProcurementValueResponse(
            id=_next_value_id(refreshed, field_template.id),
            slot_id=refreshed.id,
            field_template_id=field_template.id,
            value="",
            field_template=field_template,
            changed_by_id=refreshed.changed_by_id,
            changed_by_user=refreshed.changed_by_user,
            created_at=refreshed.created_at,
            updated_at=refreshed.updated_at,
            persons=[],
            teams=[],
            episode_ref=None,
        )
    return response
