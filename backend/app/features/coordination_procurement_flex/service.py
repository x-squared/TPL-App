from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from ...enums import ProcurementSlotKey
from ...models import (
    Coordination,
    CoordinationEpisode,
    CoordinationProcurementFieldGroupTemplate,
    CoordinationProcurement,
    CoordinationProcurementFieldTemplate,
    CoordinationProcurementData,
    CoordinationProcurementDataPerson,
    CoordinationProcurementDataTeam,
    Person,
    PersonTeam,
)
from ...schemas import (
    CoordinationProcurementFlexResponse,
    CoordinationProcurementOrganCreate,
    CoordinationProcurementOrganUpdate,
    CoordinationProcurementValueCreate,
    CoordinationProcurementFieldTemplateResponse,
    CoordinationProcurementFieldGroupTemplateResponse,
    CoordinationProcurementOrganResponse,
    CoordinationProcurementSlotResponse,
    CoordinationProcurementValueResponse,
)


def _ensure_coordination_exists(coordination_id: int, db: Session) -> None:
    item = db.query(Coordination).filter(Coordination.id == coordination_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Coordination not found")


def _build_flex_response_from_unified_data(
    *,
    coordination_id: int,
    procurement: CoordinationProcurement | None,
    field_templates: list[CoordinationProcurementFieldTemplate],
    field_group_templates: list[CoordinationProcurementFieldGroupTemplate],
    data_rows: list[CoordinationProcurementData],
) -> CoordinationProcurementFlexResponse:
    values_by_organ_slot: dict[int, dict[str, list[CoordinationProcurementValueResponse]]] = {}
    for row in data_rows:
        persons = [
            {
                "id": person_ref.id,
                "pos": person_ref.pos,
                "person": person_ref.person,
            }
            for person_ref in sorted(row.persons, key=lambda item: item.pos)
        ]
        teams = [
            {
                "id": team_ref.id,
                "pos": team_ref.pos,
                "team": team_ref.team,
            }
            for team_ref in sorted(row.teams, key=lambda item: item.pos)
        ]
        episode_ref = None
        if row.episode_id is not None:
            episode_ref = {"id": row.id, "episode_id": row.episode_id, "episode": row.episode}
        value_row = CoordinationProcurementValueResponse(
            id=row.id,
            slot_id=row.id,
            field_template_id=row.field_template_id,
            value=row.value or "",
            field_template=row.field_template,
            changed_by_id=row.changed_by_id,
            changed_by_user=row.changed_by_user,
            created_at=row.created_at,
            updated_at=row.updated_at,
            persons=persons,
            teams=teams,
            episode_ref=episode_ref,
        )
        values_by_organ_slot.setdefault(row.organ_id, {}).setdefault(row.slot_key.value if hasattr(row.slot_key, "value") else row.slot_key, []).append(value_row)

    all_organ_ids = sorted(set(values_by_organ_slot.keys()))

    organs: list[CoordinationProcurementOrganResponse] = []
    for organ_id in all_organ_ids:
        slot_map = values_by_organ_slot.get(organ_id, {})
        sample_row = next((row for row in data_rows if row.organ_id == organ_id), None)
        slots: list[CoordinationProcurementSlotResponse] = []
        for slot_key, values in sorted(slot_map.items(), key=lambda item: item[0]):
            slots.append(
                CoordinationProcurementSlotResponse(
                    id=(organ_id * 1000) + len(slots) + 1,
                    coordination_procurement_organ_id=organ_id,
                    slot_key=slot_key,
                    values=values,
                    changed_by_id=sample_row.changed_by_id if sample_row else None,
                    changed_by_user=sample_row.changed_by_user if sample_row else None,
                    created_at=sample_row.created_at if sample_row else None,
                    updated_at=sample_row.updated_at if sample_row else None,
                )
            )
        organs.append(
            CoordinationProcurementOrganResponse(
                id=organ_id,
                coordination_id=coordination_id,
                organ_id=organ_id,
                procurement_surgeon="",
                organ=sample_row.organ if sample_row else None,
                slots=slots,
                changed_by_id=sample_row.changed_by_id if sample_row else None,
                changed_by_user=sample_row.changed_by_user if sample_row else None,
                created_at=sample_row.created_at if sample_row else None,
                updated_at=sample_row.updated_at if sample_row else None,
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
    )


def get_procurement_flex(*, coordination_id: int, db: Session) -> CoordinationProcurementFlexResponse:
    _ensure_coordination_exists(coordination_id, db)
    procurement = (
        db.query(CoordinationProcurement)
        .options(joinedload(CoordinationProcurement.changed_by_user))
        .filter(CoordinationProcurement.coordination_id == coordination_id)
        .first()
    )
    data_rows = (
        db.query(CoordinationProcurementData)
        .options(
            joinedload(CoordinationProcurementData.organ),
            joinedload(CoordinationProcurementData.field_template).joinedload(CoordinationProcurementFieldTemplate.group_template),
            joinedload(CoordinationProcurementData.field_template).joinedload(CoordinationProcurementFieldTemplate.datatype_definition),
            joinedload(CoordinationProcurementData.persons).joinedload(CoordinationProcurementDataPerson.person),
            joinedload(CoordinationProcurementData.teams).joinedload(CoordinationProcurementDataTeam.team),
            joinedload(CoordinationProcurementData.episode),
            joinedload(CoordinationProcurementData.changed_by_user),
        )
        .filter(CoordinationProcurementData.coordination_id == coordination_id)
        .all()
    )
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
    return _build_flex_response_from_unified_data(
        coordination_id=coordination_id,
        procurement=procurement,
        field_templates=field_templates,
        field_group_templates=field_group_templates,
        data_rows=data_rows,
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
    _ = payload
    _ = changed_by_id
    response = get_procurement_flex(coordination_id=coordination_id, db=db)
    existing = next((item for item in response.organs if item.organ_id == organ_id), None)
    if existing:
        return existing
    return CoordinationProcurementOrganResponse(
        id=organ_id,
        coordination_id=coordination_id,
        organ_id=organ_id,
        procurement_surgeon="",
        organ=None,
        slots=[],
        changed_by_id=None,
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
    _ = payload
    _ = changed_by_id
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
    field_template = db.query(CoordinationProcurementFieldTemplate).filter(CoordinationProcurementFieldTemplate.id == field_template_id).first()
    if not field_template:
        raise HTTPException(status_code=404, detail="Field template not found")
    if not field_template.is_active:
        raise HTTPException(status_code=422, detail="Field template is inactive")

    _ensure_coordination_exists(coordination_id, db)
    value = (
        db.query(CoordinationProcurementData)
        .filter(
            CoordinationProcurementData.coordination_id == coordination_id,
            CoordinationProcurementData.organ_id == organ_id,
            CoordinationProcurementData.slot_key == slot_key.value,
            CoordinationProcurementData.field_template_id == field_template_id,
        )
        .first()
    )
    if not value:
        value = CoordinationProcurementData(
            coordination_id=coordination_id,
            organ_id=organ_id,
            slot_key=slot_key.value,
            field_template_id=field_template_id,
            changed_by_id=changed_by_id,
        )
        db.add(value)
        db.flush()
    value.value = payload.value
    value.changed_by_id = changed_by_id

    value_mode = field_template.value_mode.value if hasattr(field_template.value_mode, "value") else field_template.value_mode

    if value_mode == "PERSON_SINGLE":
        unique_person_ids = list(dict.fromkeys(payload.person_ids))
        if len(unique_person_ids) > 1:
            raise HTTPException(status_code=422, detail="PERSON_SINGLE mode accepts at most one person_id")
        if unique_person_ids:
            existing_people = db.query(Person).filter(Person.id.in_(unique_person_ids)).all()
            by_id = {row.id: row for row in existing_people}
            missing = [person_id for person_id in unique_person_ids if person_id not in by_id]
            if missing:
                raise HTTPException(status_code=422, detail=f"Unknown person_ids: {', '.join(map(str, missing))}")
        value.persons.clear()
        value.teams.clear()
        for index, person_id in enumerate(unique_person_ids):
            value.persons.append(
                CoordinationProcurementDataPerson(
                    person_id=person_id,
                    pos=index,
                    changed_by_id=changed_by_id,
                )
            )
        value.episode_id = None
    elif value_mode == "PERSON_LIST":
        unique_person_ids = list(dict.fromkeys(payload.person_ids))
        if unique_person_ids:
            existing_people = db.query(Person).filter(Person.id.in_(unique_person_ids)).all()
            by_id = {row.id: row for row in existing_people}
            missing = [person_id for person_id in unique_person_ids if person_id not in by_id]
            if missing:
                raise HTTPException(status_code=422, detail=f"Unknown person_ids: {', '.join(map(str, missing))}")
        value.persons.clear()
        value.teams.clear()
        for index, person_id in enumerate(unique_person_ids):
            value.persons.append(
                CoordinationProcurementDataPerson(
                    person_id=person_id,
                    pos=index,
                    changed_by_id=changed_by_id,
                )
            )
        value.episode_id = None
    elif value_mode == "TEAM_SINGLE":
        unique_team_ids = list(dict.fromkeys(payload.team_ids))
        if len(unique_team_ids) > 1:
            raise HTTPException(status_code=422, detail="TEAM_SINGLE mode accepts at most one team_id")
        if unique_team_ids:
            existing_teams = db.query(PersonTeam).filter(PersonTeam.id.in_(unique_team_ids)).all()
            by_id = {row.id: row for row in existing_teams}
            missing = [team_id for team_id in unique_team_ids if team_id not in by_id]
            if missing:
                raise HTTPException(status_code=422, detail=f"Unknown team_ids: {', '.join(map(str, missing))}")
        value.persons.clear()
        value.teams.clear()
        for index, team_id in enumerate(unique_team_ids):
            value.teams.append(
                CoordinationProcurementDataTeam(
                    team_id=team_id,
                    pos=index,
                    changed_by_id=changed_by_id,
                )
            )
        value.episode_id = None
    elif value_mode == "TEAM_LIST":
        unique_team_ids = list(dict.fromkeys(payload.team_ids))
        if unique_team_ids:
            existing_teams = db.query(PersonTeam).filter(PersonTeam.id.in_(unique_team_ids)).all()
            by_id = {row.id: row for row in existing_teams}
            missing = [team_id for team_id in unique_team_ids if team_id not in by_id]
            if missing:
                raise HTTPException(status_code=422, detail=f"Unknown team_ids: {', '.join(map(str, missing))}")
        value.persons.clear()
        value.teams.clear()
        for index, team_id in enumerate(unique_team_ids):
            value.teams.append(
                CoordinationProcurementDataTeam(
                    team_id=team_id,
                    pos=index,
                    changed_by_id=changed_by_id,
                )
            )
        value.episode_id = None
    elif value_mode == "EPISODE":
        episode_id = payload.episode_id
        value.persons.clear()
        value.teams.clear()
        if episode_id is None:
            value.episode_id = None
        else:
            linked_episode = (
                db.query(CoordinationEpisode)
                .filter(
                    CoordinationEpisode.coordination_id == coordination_id,
                    CoordinationEpisode.organ_id == organ_id,
                    CoordinationEpisode.episode_id == episode_id,
                )
                .first()
            )
            if not linked_episode:
                raise HTTPException(
                    status_code=422,
                    detail="episode_id must reference a coordination episode linked to this coordination and organ",
                )
            value.episode_id = episode_id
    else:
        value.persons.clear()
        value.teams.clear()
        value.episode_id = None

    db.commit()
    refreshed = (
        db.query(CoordinationProcurementData)
        .options(
            joinedload(CoordinationProcurementData.field_template).joinedload(CoordinationProcurementFieldTemplate.group_template),
            joinedload(CoordinationProcurementData.field_template).joinedload(CoordinationProcurementFieldTemplate.datatype_definition),
            joinedload(CoordinationProcurementData.persons).joinedload(CoordinationProcurementDataPerson.person),
            joinedload(CoordinationProcurementData.teams).joinedload(CoordinationProcurementDataTeam.team),
            joinedload(CoordinationProcurementData.episode),
            joinedload(CoordinationProcurementData.changed_by_user),
        )
        .filter(CoordinationProcurementData.id == value.id)
        .first()
    )
    episode = refreshed.episode if refreshed and refreshed.episode_id else None
    persons = [
        {
            "id": person_ref.id,
            "pos": person_ref.pos,
            "person": person_ref.person,
        }
        for person_ref in sorted(refreshed.persons, key=lambda item: item.pos)
    ]
    team_rows = [
        {
            "id": team_ref.id,
            "pos": team_ref.pos,
            "team": team_ref.team,
        }
        for team_ref in sorted(refreshed.teams, key=lambda item: item.pos)
    ]
    episode_ref = None
    if refreshed.episode_id is not None:
        episode_ref = {"id": refreshed.id, "episode_id": refreshed.episode_id, "episode": episode}
    return CoordinationProcurementValueResponse(
        id=refreshed.id,
        slot_id=refreshed.id,
        field_template_id=refreshed.field_template_id,
        value=refreshed.value or "",
        field_template=refreshed.field_template,
        changed_by_id=refreshed.changed_by_id,
        changed_by_user=refreshed.changed_by_user,
        created_at=refreshed.created_at,
        updated_at=refreshed.updated_at,
        persons=persons,
        teams=team_rows,
        episode_ref=episode_ref,
    )
