from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from ...enums import ProcurementSlotKey
from ...models import (
    Coordination,
    CoordinationEpisode,
    CoordinationProcurementFieldGroupTemplate,
    CoordinationProcurement,
    CoordinationProcurementFieldTemplate,
    CoordinationProcurementOrgan,
    CoordinationProcurementSlot,
    CoordinationProcurementValue,
    CoordinationProcurementValueEpisode,
    CoordinationProcurementValuePerson,
    CoordinationProcurementValueTeam,
    Person,
    PersonTeam,
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
        joinedload(CoordinationProcurementOrgan.slots)
        .joinedload(CoordinationProcurementSlot.values)
        .joinedload(CoordinationProcurementValue.field_template)
        .joinedload(CoordinationProcurementFieldTemplate.group_template),
        joinedload(CoordinationProcurementOrgan.slots)
        .joinedload(CoordinationProcurementSlot.values)
        .joinedload(CoordinationProcurementValue.persons)
        .joinedload(CoordinationProcurementValuePerson.person),
        joinedload(CoordinationProcurementOrgan.slots)
        .joinedload(CoordinationProcurementSlot.values)
        .joinedload(CoordinationProcurementValue.teams)
        .joinedload(CoordinationProcurementValueTeam.team),
        joinedload(CoordinationProcurementOrgan.slots)
        .joinedload(CoordinationProcurementSlot.values)
        .joinedload(CoordinationProcurementValue.episode_ref)
        .joinedload(CoordinationProcurementValueEpisode.episode),
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
    return CoordinationProcurementFlexResponse(
        procurement=procurement,
        organs=organs,
        field_group_templates=field_group_templates,
        field_templates=field_templates,
    )


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
    slot_key: ProcurementSlotKey,
    field_template_id: int,
    payload: CoordinationProcurementValueCreate,
    changed_by_id: int,
    db: Session,
) -> CoordinationProcurementValue:
    field_template = db.query(CoordinationProcurementFieldTemplate).filter(CoordinationProcurementFieldTemplate.id == field_template_id).first()
    if not field_template:
        raise HTTPException(status_code=404, detail="Field template not found")
    if not field_template.is_active:
        raise HTTPException(status_code=422, detail="Field template is inactive")

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
            CoordinationProcurementSlot.slot_key == slot_key.value,
        )
        .first()
    )
    if not slot:
        slot = CoordinationProcurementSlot(
            coordination_procurement_organ_id=organ.id,
            slot_key=slot_key.value,
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
        db.flush()
    else:
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
        db.flush()
        for index, person_id in enumerate(unique_person_ids):
            value.persons.append(
                CoordinationProcurementValuePerson(
                    person_id=person_id,
                    pos=index,
                    changed_by_id=changed_by_id,
                )
            )
        value.episode_ref = None
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
        db.flush()
        for index, person_id in enumerate(unique_person_ids):
            value.persons.append(
                CoordinationProcurementValuePerson(
                    person_id=person_id,
                    pos=index,
                    changed_by_id=changed_by_id,
                )
            )
        value.episode_ref = None
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
        value.teams.clear()
        value.persons.clear()
        db.flush()
        for index, team_id in enumerate(unique_team_ids):
            value.teams.append(
                CoordinationProcurementValueTeam(
                    team_id=team_id,
                    pos=index,
                    changed_by_id=changed_by_id,
                )
            )
        value.episode_ref = None
    elif value_mode == "TEAM_LIST":
        unique_team_ids = list(dict.fromkeys(payload.team_ids))
        if unique_team_ids:
            existing_teams = db.query(PersonTeam).filter(PersonTeam.id.in_(unique_team_ids)).all()
            by_id = {row.id: row for row in existing_teams}
            missing = [team_id for team_id in unique_team_ids if team_id not in by_id]
            if missing:
                raise HTTPException(status_code=422, detail=f"Unknown team_ids: {', '.join(map(str, missing))}")
        value.teams.clear()
        value.persons.clear()
        db.flush()
        for index, team_id in enumerate(unique_team_ids):
            value.teams.append(
                CoordinationProcurementValueTeam(
                    team_id=team_id,
                    pos=index,
                    changed_by_id=changed_by_id,
                )
            )
        value.episode_ref = None
    elif value_mode == "EPISODE":
        episode_id = payload.episode_id
        value.persons.clear()
        value.teams.clear()
        if episode_id is None:
            value.episode_ref = None
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
            if value.episode_ref:
                value.episode_ref.episode_id = episode_id
                value.episode_ref.changed_by_id = changed_by_id
            else:
                value.episode_ref = CoordinationProcurementValueEpisode(
                    episode_id=episode_id,
                    changed_by_id=changed_by_id,
                )
    else:
        value.persons.clear()
        value.teams.clear()
        value.episode_ref = None

    db.commit()
    return (
        db.query(CoordinationProcurementValue)
        .options(
            joinedload(CoordinationProcurementValue.field_template),
            joinedload(CoordinationProcurementValue.persons).joinedload(CoordinationProcurementValuePerson.person),
            joinedload(CoordinationProcurementValue.teams).joinedload(CoordinationProcurementValueTeam.team),
            joinedload(CoordinationProcurementValue.episode_ref).joinedload(CoordinationProcurementValueEpisode.episode),
            joinedload(CoordinationProcurementValue.changed_by_user),
        )
        .filter(CoordinationProcurementValue.id == value.id)
        .first()
    )
