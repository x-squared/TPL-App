from ..database import Base


def _to_human_label(attr_name: str) -> str:
    """Convert attribute name to human-readable label."""
    label = attr_name.replace("_", " ").strip().title()
    label = label.replace(" Id", " ID").replace(" Nr", " Nr.")
    return label


def apply_entity_metadata_defaults() -> None:
    """Add default label/comment metadata for all mapped columns."""
    for mapper in Base.registry.mappers:
        cls = mapper.class_
        for column in mapper.local_table.columns:
            attr_name = column.key
            if column.info is None:
                column.info = {}
            column.info.setdefault("label", _to_human_label(attr_name))
            if not column.comment:
                column.comment = f"{_to_human_label(attr_name)} ({cls.__name__})."
