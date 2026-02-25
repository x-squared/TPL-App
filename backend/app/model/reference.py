from sqlalchemy import Column, Integer, String, UniqueConstraint

from ..database import Base


class Code(Base):
    """Reference code table for typed key/value dictionaries."""

    __tablename__ = "CODE"
    __table_args__ = (UniqueConstraint("TYPE", "KEY"),)

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the code entry.",
        info={"label": "ID"},
    )
    type = Column(
        "TYPE",
        String,
        nullable=False,
        index=True,
        comment="Logical code namespace (e.g. DATATYPE, ROLE, ORGAN).",
        info={"label": "Code Type"},
    )
    key = Column(
        "KEY",
        String,
        nullable=False,
        comment="Stable technical key unique within a type.",
        info={"label": "Key"},
    )
    pos = Column(
        "POS",
        Integer,
        nullable=False,
        comment="Display/sort order inside one code type.",
        info={"label": "Position"},
    )
    ext_sys = Column(
        "EXT_SYS",
        String(24),
        default="",
        comment="Optional external source system identifier.",
        info={"label": "External System"},
    )
    ext_key = Column(
        "EXT_KEY",
        String,
        default="",
        comment="Optional key of this code in an external system.",
        info={"label": "External Key"},
    )
    name_default = Column(
        "NAME_DEFAULT",
        String,
        default="",
        comment="Default display name for the code entry.",
        info={"label": "Name"},
    )


class Catalogue(Base):
    """Reference catalogue table for structured, maintainable value lists."""

    __tablename__ = "CATALOGUE"
    __table_args__ = (UniqueConstraint("TYPE", "KEY"),)

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the catalogue entry.",
        info={"label": "ID"},
    )
    type = Column(
        "TYPE",
        String,
        nullable=False,
        index=True,
        comment="Logical catalogue namespace (e.g. LANGUAGE, DIAGNOSIS, BLOOD_TYPE).",
        info={"label": "Catalogue Type"},
    )
    key = Column(
        "KEY",
        String,
        nullable=False,
        comment="Stable technical key unique within a catalogue type.",
        info={"label": "Key"},
    )
    pos = Column(
        "POS",
        Integer,
        nullable=False,
        comment="Display/sort order inside one catalogue type.",
        info={"label": "Position"},
    )
    ext_sys = Column(
        "EXT_SYS",
        String(24),
        default="",
        comment="Optional external source system identifier.",
        info={"label": "External System"},
    )
    ext_key = Column(
        "EXT_KEY",
        String,
        default="",
        comment="Optional key of this catalogue entry in an external system.",
        info={"label": "External Key"},
    )
    name_default = Column(
        "NAME_DEFAULT",
        String,
        default="",
        comment="Default display name for the catalogue entry.",
        info={"label": "Name"},
    )
