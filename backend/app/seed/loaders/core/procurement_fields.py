from sqlalchemy.orm import Session

from ....models import (
    Code,
    CoordinationProcurementFieldScopeTemplate,
    CoordinationProcurementFieldTemplate,
    DatatypeDefinition,
)


def sync_coordination_procurement_field_templates(db: Session) -> None:
    """Replace procurement field templates with core definitions."""
    from ...datasets.core.coordination_procurement_field_templates import RECORDS as records

    datatype_def_by_code_key = {
        row.code.key: row.id
        for row in db.query(DatatypeDefinition).all()
        if row.code is not None
    }

    db.query(CoordinationProcurementFieldTemplate).delete()
    for entry in records:
        raw = dict(entry)
        datatype_key = raw.pop("datatype_key")
        datatype_def_id = datatype_def_by_code_key.get(datatype_key)
        if datatype_def_id is None:
            continue
        db.add(CoordinationProcurementFieldTemplate(datatype_def_id=datatype_def_id, changed_by_id=1, **raw))
    db.commit()


def sync_coordination_procurement_field_scopes(db: Session) -> None:
    """Replace procurement field scope templates with core definitions."""
    from ...datasets.core.coordination_procurement_field_scopes import RECORDS as records

    field_by_key = {
        row.key: row.id
        for row in db.query(CoordinationProcurementFieldTemplate).all()
    }
    organ_by_key = {
        row.key: row.id
        for row in db.query(Code).filter(Code.type == "ORGAN").all()
    }

    db.query(CoordinationProcurementFieldScopeTemplate).delete()
    for entry in records:
        raw = dict(entry)
        field_id = field_by_key.get(raw.pop("field_key"))
        organ_id = organ_by_key.get(raw.pop("organ_key"))
        if field_id is None or organ_id is None:
            continue
        db.add(
            CoordinationProcurementFieldScopeTemplate(
                field_template_id=field_id,
                organ_id=organ_id,
                changed_by_id=1,
                **raw,
            )
        )
    db.commit()
