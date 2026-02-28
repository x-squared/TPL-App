from sqlalchemy import Boolean, Column, DateTime, Enum as SqlEnum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base
from ..enums import ProcurementSlotKey, ProcurementValueMode


class CoordinationProcurement(Base):
    """Procurement-specific 1:1 extension of the coordination core entity."""

    __tablename__ = "COORDINATION_PROCUREMENT"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the coordination procurement row.",
        info={"label": "ID"},
    )
    coordination_id = Column(
        "COORDINATION_ID",
        Integer,
        ForeignKey("COORDINATION.ID"),
        nullable=False,
        unique=True,
        index=True,
        comment="1:1 reference to the coordination core row.",
        info={"label": "Coordination"},
    )
    time_of_death = Column(
        "TIME_OF_DEATH",
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of donor death.",
        info={"label": "Time Of Death"},
    )
    moe_performed = Column(
        "MOE_PERFORMED",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether MOE was performed.",
        info={"label": "MOE Performed"},
    )
    moe_time = Column(
        "MOE_TIME",
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when MOE was performed.",
        info={"label": "MOE Time"},
    )
    nrp_abdominal_done = Column(
        "NRP_ABDOMINAL_DONE",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether abdominal NRP was performed.",
        info={"label": "NRP Abdominal Done"},
    )
    nrp_thoracic_done = Column(
        "NRP_THORACIC_DONE",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether thoracic NRP was performed.",
        info={"label": "NRP Thoracic Done"},
    )
    nrp_time = Column(
        "NRP_TIME",
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when NRP was performed.",
        info={"label": "NRP Time"},
    )
    changed_by_id = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the coordination procurement row.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the coordination procurement row.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the coordination procurement row.",
        info={"label": "Updated At"},
    )

    coordination = relationship("Coordination", back_populates="procurement")
    changed_by_user = relationship("User")


class CoordinationProcurementOrgan(Base):
    """Runtime procurement organ row per coordination and organ."""

    __tablename__ = "COORDINATION_PROCUREMENT_ORGAN"
    __table_args__ = (
        UniqueConstraint("COORDINATION_ID", "ORGAN_ID", name="uq_coordination_procurement_organ"),
    )

    id = Column("ID", Integer, primary_key=True, index=True)
    coordination_id = Column("COORDINATION_ID", Integer, ForeignKey("COORDINATION.ID"), nullable=False, index=True)
    organ_id = Column("ORGAN_ID", Integer, ForeignKey("CODE.ID"), nullable=False, index=True)
    procurement_surgeon = Column("PROCUREMENT_SURGEON", String(64), default="")
    changed_by_id = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    coordination = relationship("Coordination", back_populates="procurement_organs")
    organ = relationship("Code", foreign_keys=[organ_id])
    changed_by_user = relationship("User")
    slots = relationship("CoordinationProcurementSlot", back_populates="procurement_organ", cascade="all, delete-orphan")


class CoordinationProcurementSlot(Base):
    """Optional slot dimension (MAIN/LEFT/RIGHT) for organ procurement values."""

    __tablename__ = "COORDINATION_PROCUREMENT_SLOT"
    __table_args__ = (
        UniqueConstraint("COORDINATION_PROCUREMENT_ORGAN_ID", "SLOT_KEY", name="uq_coordination_procurement_slot"),
    )

    id = Column("ID", Integer, primary_key=True, index=True)
    coordination_procurement_organ_id = Column(
        "COORDINATION_PROCUREMENT_ORGAN_ID",
        Integer,
        ForeignKey("COORDINATION_PROCUREMENT_ORGAN.ID"),
        nullable=False,
        index=True,
    )
    slot_key = Column(
        "SLOT_KEY",
        SqlEnum(
            ProcurementSlotKey,
            native_enum=False,
            validate_strings=True,
            values_callable=lambda enum_cls: [entry.value for entry in enum_cls],
            length=16,
        ),
        nullable=False,
        default=ProcurementSlotKey.MAIN.value,
    )
    changed_by_id = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    procurement_organ = relationship("CoordinationProcurementOrgan", back_populates="slots")
    changed_by_user = relationship("User")
    values = relationship("CoordinationProcurementValue", back_populates="slot", cascade="all, delete-orphan")


class CoordinationProcurementFieldTemplate(Base):
    """Template definition of flexible procurement fields."""

    __tablename__ = "COORDINATION_PROCUREMENT_FIELD_TEMPLATE"

    id = Column("ID", Integer, primary_key=True, index=True)
    key = Column("KEY", String(64), nullable=False, unique=True, index=True)
    name_default = Column("NAME_DEFAULT", String(128), nullable=False, default="")
    comment = Column("COMMENT", String(512), nullable=False, default="")
    is_active = Column("IS_ACTIVE", Boolean, nullable=False, default=True)
    pos = Column("POS", Integer, nullable=False, default=0)
    group_template_id = Column(
        "GROUP_TEMPLATE_ID",
        Integer,
        ForeignKey("COORDINATION_PROCUREMENT_FIELD_GROUP_TEMPLATE.ID"),
        nullable=True,
        index=True,
    )
    value_mode = Column(
        "VALUE_MODE",
        SqlEnum(
            ProcurementValueMode,
            native_enum=False,
            validate_strings=True,
            values_callable=lambda enum_cls: [entry.value for entry in enum_cls],
            length=24,
        ),
        nullable=False,
        default=ProcurementValueMode.SCALAR.value,
    )
    datatype_def_id = Column("DATATYPE_DEF_ID", Integer, ForeignKey("MEDICAL_VALUE_DATATYPE.ID"), nullable=False, index=True)
    changed_by_id = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    datatype_definition = relationship("DatatypeDefinition")
    group_template = relationship("CoordinationProcurementFieldGroupTemplate", back_populates="field_templates")
    changed_by_user = relationship("User")
    scopes = relationship(
        "CoordinationProcurementFieldScopeTemplate",
        back_populates="field_template",
        cascade="all, delete-orphan",
    )


class CoordinationProcurementFieldScopeTemplate(Base):
    """Applicability scope of procurement field templates by organ and slot."""

    __tablename__ = "COORDINATION_PROCUREMENT_FIELD_SCOPE_TEMPLATE"
    __table_args__ = (
        UniqueConstraint("FIELD_TEMPLATE_ID", "ORGAN_ID", "SLOT_KEY", name="uq_coordination_procurement_field_scope"),
    )

    id = Column("ID", Integer, primary_key=True, index=True)
    field_template_id = Column("FIELD_TEMPLATE_ID", Integer, ForeignKey("COORDINATION_PROCUREMENT_FIELD_TEMPLATE.ID"), nullable=False, index=True)
    organ_id = Column("ORGAN_ID", Integer, ForeignKey("CODE.ID"), nullable=True, index=True)
    slot_key = Column(
        "SLOT_KEY",
        SqlEnum(
            ProcurementSlotKey,
            native_enum=False,
            validate_strings=True,
            values_callable=lambda enum_cls: [entry.value for entry in enum_cls],
            length=16,
        ),
        nullable=False,
        default=ProcurementSlotKey.MAIN.value,
    )
    changed_by_id = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    field_template = relationship("CoordinationProcurementFieldTemplate", back_populates="scopes")
    organ = relationship("Code", foreign_keys=[organ_id])
    changed_by_user = relationship("User")


class CoordinationProcurementValue(Base):
    """Runtime procurement value bound to a slot and field template."""

    __tablename__ = "COORDINATION_PROCUREMENT_VALUE"
    __table_args__ = (
        UniqueConstraint("SLOT_ID", "FIELD_TEMPLATE_ID", name="uq_coordination_procurement_value"),
    )

    id = Column("ID", Integer, primary_key=True, index=True)
    slot_id = Column("SLOT_ID", Integer, ForeignKey("COORDINATION_PROCUREMENT_SLOT.ID"), nullable=False, index=True)
    field_template_id = Column("FIELD_TEMPLATE_ID", Integer, ForeignKey("COORDINATION_PROCUREMENT_FIELD_TEMPLATE.ID"), nullable=False, index=True)
    value = Column("VALUE", String, default="")
    changed_by_id = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    slot = relationship("CoordinationProcurementSlot", back_populates="values")
    field_template = relationship("CoordinationProcurementFieldTemplate")
    changed_by_user = relationship("User")
    persons = relationship(
        "CoordinationProcurementValuePerson",
        back_populates="value_row",
        cascade="all, delete-orphan",
    )
    teams = relationship(
        "CoordinationProcurementValueTeam",
        back_populates="value_row",
        cascade="all, delete-orphan",
    )
    episode_ref = relationship(
        "CoordinationProcurementValueEpisode",
        back_populates="value_row",
        cascade="all, delete-orphan",
        uselist=False,
    )


class CoordinationProcurementFieldGroupTemplate(Base):
    """Template grouping for procurement field rendering and grouped capture."""

    __tablename__ = "COORDINATION_PROCUREMENT_FIELD_GROUP_TEMPLATE"

    id = Column("ID", Integer, primary_key=True, index=True)
    key = Column("KEY", String(64), nullable=False, unique=True, index=True)
    name_default = Column("NAME_DEFAULT", String(128), nullable=False, default="")
    comment = Column("COMMENT", String(512), nullable=False, default="")
    is_active = Column("IS_ACTIVE", Boolean, nullable=False, default=True)
    pos = Column("POS", Integer, nullable=False, default=0)
    changed_by_id = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    changed_by_user = relationship("User")
    field_templates = relationship("CoordinationProcurementFieldTemplate", back_populates="group_template")


class CoordinationProcurementValuePerson(Base):
    """Person references attached to a procurement value row."""

    __tablename__ = "COORDINATION_PROCUREMENT_VALUE_PERSON"
    __table_args__ = (
        UniqueConstraint("VALUE_ID", "PERSON_ID", name="uq_coordination_procurement_value_person"),
    )

    id = Column("ID", Integer, primary_key=True, index=True)
    value_id = Column("VALUE_ID", Integer, ForeignKey("COORDINATION_PROCUREMENT_VALUE.ID"), nullable=False, index=True)
    person_id = Column("PERSON_ID", Integer, ForeignKey("PERSON.ID"), nullable=False, index=True)
    pos = Column("POS", Integer, nullable=False, default=0)
    changed_by_id = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    value_row = relationship("CoordinationProcurementValue", back_populates="persons")
    person = relationship("Person")
    changed_by_user = relationship("User")


class CoordinationProcurementValueTeam(Base):
    """Team references attached to a procurement value row."""

    __tablename__ = "COORDINATION_PROCUREMENT_VALUE_TEAM"
    __table_args__ = (
        UniqueConstraint("VALUE_ID", "TEAM_ID", name="uq_coordination_procurement_value_team"),
    )

    id = Column("ID", Integer, primary_key=True, index=True)
    value_id = Column("VALUE_ID", Integer, ForeignKey("COORDINATION_PROCUREMENT_VALUE.ID"), nullable=False, index=True)
    team_id = Column("TEAM_ID", Integer, ForeignKey("PERSON_TEAM.ID"), nullable=False, index=True)
    pos = Column("POS", Integer, nullable=False, default=0)
    changed_by_id = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    value_row = relationship("CoordinationProcurementValue", back_populates="teams")
    team = relationship("PersonTeam")
    changed_by_user = relationship("User")


class CoordinationProcurementValueEpisode(Base):
    """Episode reference attached to a procurement value row."""

    __tablename__ = "COORDINATION_PROCUREMENT_VALUE_EPISODE"
    __table_args__ = (
        UniqueConstraint("VALUE_ID", name="uq_coordination_procurement_value_episode"),
    )

    id = Column("ID", Integer, primary_key=True, index=True)
    value_id = Column("VALUE_ID", Integer, ForeignKey("COORDINATION_PROCUREMENT_VALUE.ID"), nullable=False, index=True)
    episode_id = Column("EPISODE_ID", Integer, ForeignKey("EPISODE.ID"), nullable=False, index=True)
    changed_by_id = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    value_row = relationship("CoordinationProcurementValue", back_populates="episode_ref")
    episode = relationship("Episode")
    changed_by_user = relationship("User")
