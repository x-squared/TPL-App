from sqlalchemy import Column, Date, ForeignKey, Integer, String, Boolean, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


def _to_human_label(attr_name: str) -> str:
    """Convert attribute name to human-readable label."""
    label = attr_name.replace("_", " ").strip().title()
    label = label.replace(" Id", " ID").replace(" Nr", " Nr.")
    return label


def _apply_entity_metadata_defaults() -> None:
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
        info={"label": "Type"},
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
        info={"label": "Type"},
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

class User(Base):
    """Application user used for authentication, role assignment, and auditing."""

    __tablename__ = "USER"

    id = Column("ID", Integer, primary_key=True, index=True)
    ext_id = Column("EXT_ID", String, nullable=False, unique=True)
    name = Column("NAME", String, nullable=False)
    role_id = Column("ROLE", Integer, ForeignKey("CODE.ID"), nullable=True)

    role = relationship("Code", foreign_keys=[role_id])
    assigned_tasks = relationship("Task", foreign_keys="Task.assigned_to_id", back_populates="assigned_to")
    closed_tasks = relationship("Task", foreign_keys="Task.closed_by_id", back_populates="closed_by")


class Patient(Base):
    """Core patient entity with demographic, language, and linked clinical data."""

    __tablename__ = "PATIENT"

    id = Column("ID", Integer, primary_key=True, index=True)
    pid = Column("PID", String, nullable=False, unique=True, index=True)
    first_name = Column("FIRST_NAME", String, nullable=False)
    name = Column("NAME", String, nullable=False)
    date_of_birth = Column("DATE_OF_BIRTH", Date, nullable=False)
    date_of_death = Column("DATE_OF_DEATH", Date, nullable=True)
    ahv_nr = Column("AHV_NR", String, default="")
    lang = Column("LANG", String, default="")
    blood_type_id = Column("BLOOD_TYPE_ID", Integer, ForeignKey("CATALOGUE.ID"), nullable=True)
    resp_coord_id = Column("RESP_COORD", Integer, ForeignKey("USER.ID"), nullable=True)
    translate = Column("TRANSLATE", Boolean, default=False)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    changed_by_user = relationship("User", foreign_keys=[changed_by])
    blood_type = relationship("Catalogue", foreign_keys=[blood_type_id])
    resp_coord = relationship("User", foreign_keys=[resp_coord_id])
    contact_infos = relationship("ContactInfo", back_populates="patient", cascade="all, delete-orphan")
    absences = relationship("Absence", back_populates="patient", cascade="all, delete-orphan")
    diagnoses = relationship("Diagnosis", back_populates="patient", cascade="all, delete-orphan")
    medical_values = relationship("MedicalValue", back_populates="patient", cascade="all, delete-orphan")
    episodes = relationship("Episode", back_populates="patient", cascade="all, delete-orphan")
    task_groups = relationship("TaskGroup", back_populates="patient", cascade="all, delete-orphan")


class Absence(Base):
    """Date interval where the patient is marked as absent."""

    __tablename__ = "ABSENCE"

    id = Column("ID", Integer, primary_key=True, index=True)
    patient_id = Column("PATIENT_ID", Integer, ForeignKey("PATIENT.ID"), nullable=False, index=True)
    start = Column("START", Date, nullable=False)
    end = Column("END", Date, nullable=False)
    comment = Column("COMMENT", String(1024), default="")
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="absences")
    changed_by_user = relationship("User")


class Diagnosis(Base):
    """Patient diagnosis linked to diagnosis catalogue entries."""

    __tablename__ = "DIAGNOSIS"

    id = Column("ID", Integer, primary_key=True, index=True)
    patient_id = Column("PATIENT_ID", Integer, ForeignKey("PATIENT.ID"), nullable=False, index=True)
    catalogue_id = Column("CATALOGUE_ID", Integer, ForeignKey("CATALOGUE.ID"), nullable=False)
    comment = Column("COMMENT", String(128), default="")
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="diagnoses")
    catalogue = relationship("Catalogue")
    changed_by_user = relationship("User")


class ContactInfo(Base):
    """Patient contact channel row including type, value, and sort position."""

    __tablename__ = "CONTACT_INFO"

    id = Column("ID", Integer, primary_key=True, index=True)
    patient_id = Column("PATIENT_ID", Integer, ForeignKey("PATIENT.ID"), nullable=False, index=True)
    type_id = Column("TYPE_ID", Integer, ForeignKey("CODE.ID"), nullable=False)
    data = Column("DATA", String(128), nullable=False)
    comment = Column("COMMENT", String(128), default="")
    main = Column("MAIN", Boolean, default=False)
    pos = Column("POS", Integer, default=0)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="contact_infos")
    type = relationship("Code")
    changed_by_user = relationship("User")

class MedicalValueTemplate(Base):
    """Template definition for medical values and organ applicability flags."""

    __tablename__ = "MEDICAL_VALUE_TEMPLATE"

    id = Column("ID", Integer, primary_key=True, index=True)
    lab_key = Column("LAB_KEY", String(12), nullable=False)
    kis_key = Column("KIS_KEY", String(64), nullable=False)
    datatype_id = Column("DATATYPE_ID", Integer, ForeignKey("CODE.ID"), nullable=False)
    name_default = Column("NAME_DEFAULT", String(64), default="")
    pos = Column("POS", Integer, nullable=False)
    use_base = Column("USE_BASE", Boolean, default=False)
    use_liver = Column("USE_LIVER", Boolean, default=False)
    use_kidney = Column("USE_KIDNEY", Boolean, default=False)
    use_heart = Column("USE_HEART", Boolean, default=False)
    use_lung = Column("USE_LUNG", Boolean, default=False)
    use_donor = Column("USE_DONOR", Boolean, default=False)

    datatype = relationship("Code")

class MedicalValue(Base):
    """Patient-specific medical value instance created from template or custom input."""

    __tablename__ = "MEDICAL_VALUE"

    id = Column("ID", Integer, primary_key=True, index=True)
    patient_id = Column("PATIENT_ID", Integer, ForeignKey("PATIENT.ID"), nullable=False, index=True)
    medical_value_template_id = Column("MEDICAL_VALUE_TEMPLATE_ID", Integer, ForeignKey("MEDICAL_VALUE_TEMPLATE.ID"), nullable=True)
    datatype_id = Column("DATATYPE_ID", Integer, ForeignKey("CODE.ID"), nullable=True)
    name = Column("NAME", String(64), default="")
    pos = Column("POS", Integer, default=0)
    value = Column("VALUE", String, default="")
    renew_date = Column("RENEW_DATE", Date, nullable=True)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="medical_values")
    medical_value_template = relationship("MedicalValueTemplate")
    datatype = relationship("Code")
    changed_by_user = relationship("User")


class Episode(Base):
    """Patient episode covering evaluation, listing, transplantation and follow-up."""

    __tablename__ = "EPISODE"

    id = Column("ID", Integer, primary_key=True, index=True)
    patient_id = Column("PATIENT_ID", Integer, ForeignKey("PATIENT.ID"), nullable=False, index=True)
    organ_id = Column("ORGAN_ID", Integer, ForeignKey("CODE.ID"), nullable=False)
    start = Column("START", Date, nullable=True)
    end = Column("END", Date, nullable=True)
    fall_nr = Column("FALL_NR", String(24), default="")
    status_id = Column("STATUS_ID", Integer, ForeignKey("CODE.ID"), nullable=True)
    closed = Column("CLOSED", Boolean, default=False)
    comment = Column("COMMENT", String(1024), default="")
    cave = Column("CAVE", String(512), default="")
    eval_start = Column("EVAL_START", Date, nullable=True)
    eval_end = Column("EVAL_END", Date, nullable=True)
    eval_assigned_to = Column("EVAL_ASSIGNED_TO", String, default="")
    eval_stat = Column("EVAL_STAT", String, default="")
    eval_register_date = Column("EVAL_REGISTER_DATE", Date, nullable=True)
    eval_excluded = Column("EVAL_EXCLUDED", Boolean, default=False)
    eval_non_list_sent = Column("EVAL_NON_LIST_SENT", Date, nullable=True)
    list_start = Column("LIST_START", Date, nullable=True)
    list_end = Column("LIST_END", Date, nullable=True)
    list_rs_nr = Column("LIST_RS_NR", String(12), default="")
    list_reason_delist = Column("LIST_REASON_DELIST", String, default="")
    list_expl_delist = Column("LIST_EXPL_DELIST", String(1024), default="")
    list_delist_sent = Column("LIST_DELIST_SENT", Date, nullable=True)
    tpl_date = Column("TPL_DATE", Date, nullable=True)
    fup_recipient_card_done = Column("FUP_RECIPIENT_CARD_DONE", Boolean, default=False)
    fup_recipient_card_date = Column("FUP_RECIPIENT_CARD_DATE", Date, nullable=True)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="episodes")
    organ = relationship("Code", foreign_keys=[organ_id])
    status = relationship("Code", foreign_keys=[status_id])
    changed_by_user = relationship("User")
    task_groups = relationship("TaskGroup", back_populates="episode")


class TaskGroup(Base):
    """Task group bound to a patient, optionally scoped to episode and phase."""

    __tablename__ = "TASK_GROUP"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the task group.",
        info={"label": "ID"},
    )
    patient_id = Column(
        "PATIENT_ID",
        Integer,
        ForeignKey("PATIENT.ID"),
        nullable=False,
        index=True,
        comment="Required patient context of the task group.",
        info={"label": "Patient"},
    )
    episode_id = Column(
        "EPISODE_ID",
        Integer,
        ForeignKey("EPISODE.ID"),
        nullable=True,
        index=True,
        comment="Optional episode context; if set it must belong to the same patient.",
        info={"label": "Episode"},
    )
    tpl_phase_id = Column(
        "TPL_PHASE_ID",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=True,
        comment="Optional transplant phase (`CODE.TPL_PHASE`), only allowed when episode is set.",
        info={"label": "TPL Phase"},
    )
    done = Column(
        "DONE",
        Boolean,
        default=False,
        comment="Completion state of the task group.",
        info={"label": "Done"},
    )
    changed_by = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the task group.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the task group.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the task group.",
        info={"label": "Updated At"},
    )

    patient = relationship("Patient", back_populates="task_groups")
    episode = relationship("Episode", back_populates="task_groups")
    tpl_phase = relationship("Code", foreign_keys=[tpl_phase_id])
    changed_by_user = relationship("User", foreign_keys=[changed_by])
    tasks = relationship("Task", back_populates="task_group", cascade="all, delete-orphan")


class Task(Base):
    """Task entry linked to a task group with ownership, timing, and closure state."""

    __tablename__ = "TASK"

    id = Column("ID", Integer, primary_key=True, index=True)
    task_group_id = Column("TASK_GROUP_ID", Integer, ForeignKey("TASK_GROUP.ID"), nullable=False, index=True)
    description = Column("DESCRIPTION", String(512), default="")
    priority_id = Column("PRIORITY", Integer, ForeignKey("CODE.ID"), nullable=False)
    must = Column("MUST", Boolean, default=False)
    assigned_to_id = Column("ASSIGNED_TO", Integer, ForeignKey("USER.ID"), nullable=True)
    until = Column("UNTIL", Date, nullable=True)
    status_id = Column("STATUS", Integer, ForeignKey("CODE.ID"), nullable=False)
    closed_at = Column("CLOSED_AT", Date, nullable=True)
    closed_by_id = Column("CLOSED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    comment = Column("COMMENT", String(512), default="")
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    task_group = relationship("TaskGroup", back_populates="tasks")
    priority = relationship("Code", foreign_keys=[priority_id])
    status = relationship("Code", foreign_keys=[status_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_tasks")
    closed_by = relationship("User", foreign_keys=[closed_by_id], back_populates="closed_tasks")
    changed_by_user = relationship("User", foreign_keys=[changed_by])

    @property
    def closed(self) -> bool:
        status_key = self.status.key if self.status else None
        return self.closed_at is not None and status_key in {"COMPLETED", "CANCELLED"}


_apply_entity_metadata_defaults()




