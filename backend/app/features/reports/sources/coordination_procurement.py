from __future__ import annotations

from sqlalchemy.orm import Session, joinedload

from ....models import (
    CoordinationProcurementData,
    CoordinationProcurementDataPerson,
    CoordinationProcurementDataTeam,
    CoordinationProcurementFieldTemplate,
)
from ..engine import join_unique_text
from ..types import FieldDef, JoinDef, SourceDef


def _person_label(person) -> str:
    if not person:
        return ""
    return f"{person.first_name} {person.surname}".strip()


def build_coordination_procurement_source() -> SourceDef:
    fields: tuple[FieldDef, ...] = (
        FieldDef("id", "ID", "number", ("eq", "gte", "lte"), lambda row: row.id),
        FieldDef("coordination_id", "Coordination ID", "number", ("eq", "gte", "lte"), lambda row: row.coordination_id),
        FieldDef("organ_id", "Organ ID", "number", ("eq", "gte", "lte"), lambda row: row.organ_id),
        FieldDef("slot_key", "Slot Key", "string", ("eq", "contains"), lambda row: row.slot_key.value if hasattr(row.slot_key, "value") else (row.slot_key or "")),
        FieldDef("field_template_id", "Field Template ID", "number", ("eq", "gte", "lte"), lambda row: row.field_template_id),
        FieldDef("value", "Value", "string", ("eq", "contains"), lambda row: row.value or ""),
        FieldDef("episode_id", "Episode ID", "number", ("eq", "gte", "lte"), lambda row: row.episode_id),
        FieldDef("person_count", "Person Count", "number", ("eq", "gte", "lte"), lambda row: len(row.persons or [])),
        FieldDef("team_count", "Team Count", "number", ("eq", "gte", "lte"), lambda row: len(row.teams or [])),
        FieldDef("created_at", "Created At", "datetime", ("gte", "lte"), lambda row: row.created_at),
        FieldDef("updated_at", "Updated At", "datetime", ("gte", "lte"), lambda row: row.updated_at),
    )

    joins: tuple[JoinDef, ...] = (
        JoinDef(
            key="ORGAN",
            label="Organ",
            fields=(
                FieldDef("organ_key", "Organ Key", "string", ("eq", "contains"), lambda row: row.organ.key if row.organ else ""),
                FieldDef("organ_name", "Organ Name", "string", ("eq", "contains"), lambda row: row.organ.name_default if row.organ else ""),
            ),
        ),
        JoinDef(
            key="FIELD_TEMPLATE",
            label="Field Template",
            fields=(
                FieldDef("field_key", "Field Key", "string", ("eq", "contains"), lambda row: row.field_template.key if row.field_template else ""),
                FieldDef("field_name", "Field Name", "string", ("eq", "contains"), lambda row: row.field_template.name_default if row.field_template else ""),
                FieldDef("value_mode", "Value Mode", "string", ("eq", "contains"), lambda row: row.field_template.value_mode.value if row.field_template and hasattr(row.field_template.value_mode, "value") else (row.field_template.value_mode if row.field_template else "")),
            ),
        ),
        JoinDef(
            key="GROUP_TEMPLATE",
            label="Group Template",
            fields=(
                FieldDef("group_key", "Group Key", "string", ("eq", "contains"), lambda row: row.field_template.group_template.key if row.field_template and row.field_template.group_template else ""),
                FieldDef("group_name", "Group Name", "string", ("eq", "contains"), lambda row: row.field_template.group_template.name_default if row.field_template and row.field_template.group_template else ""),
            ),
        ),
        JoinDef(
            key="PERSON_REFS",
            label="Person Refs",
            fields=(
                FieldDef("person_ids", "Person IDs", "string", ("eq", "contains"), lambda row: join_unique_text([ref.person_id for ref in sorted((row.persons or []), key=lambda item: item.pos)])),
                FieldDef("person_names", "Person Names", "string", ("eq", "contains"), lambda row: join_unique_text([_person_label(ref.person) for ref in sorted((row.persons or []), key=lambda item: item.pos)])),
            ),
        ),
        JoinDef(
            key="TEAM_REFS",
            label="Team Refs",
            fields=(
                FieldDef("team_ids", "Team IDs", "string", ("eq", "contains"), lambda row: join_unique_text([ref.team_id for ref in sorted((row.teams or []), key=lambda item: item.pos)])),
                FieldDef("team_names", "Team Names", "string", ("eq", "contains"), lambda row: join_unique_text([ref.team.name for ref in sorted((row.teams or []), key=lambda item: item.pos) if ref.team])),
            ),
        ),
        JoinDef(
            key="EPISODE_REF",
            label="Episode Ref",
            fields=(
                FieldDef("episode_fall_nr", "Episode Fall Nr", "string", ("eq", "contains"), lambda row: row.episode.fall_nr if row.episode else ""),
            ),
        ),
    )

    def query(db: Session) -> list[CoordinationProcurementData]:
        return (
            db.query(CoordinationProcurementData)
            .options(
                joinedload(CoordinationProcurementData.organ),
                joinedload(CoordinationProcurementData.field_template).joinedload(CoordinationProcurementFieldTemplate.group_template),
                joinedload(CoordinationProcurementData.persons).joinedload(CoordinationProcurementDataPerson.person),
                joinedload(CoordinationProcurementData.teams).joinedload(CoordinationProcurementDataTeam.team),
                joinedload(CoordinationProcurementData.episode),
            )
            .all()
        )

    return SourceDef("COORDINATION_PROCUREMENT", "Coordination Procurement", fields, joins, query)
