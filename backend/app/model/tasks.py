from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class TaskGroupTemplate(Base):
    """Reusable blueprint for creating task groups in a defined transplant scope."""

    __tablename__ = "TASK_GROUP_TEMPLATE"
    __table_args__ = (UniqueConstraint("KEY"),)

    id = Column("ID", Integer, primary_key=True, index=True)
    key = Column("KEY", String(64), nullable=False)
    name = Column("NAME", String(128), nullable=False)
    description = Column("DESCRIPTION", String(512), default="")
    scope_id = Column("SCOPE_ID", Integer, ForeignKey("CODE.ID"), nullable=False)
    organ_id = Column("ORGAN_ID", Integer, ForeignKey("CODE.ID"), nullable=True)
    tpl_phase_id = Column("TPL_PHASE_ID", Integer, ForeignKey("CODE.ID"), nullable=True)
    is_active = Column("IS_ACTIVE", Boolean, default=True)
    sort_pos = Column("SORT_POS", Integer, default=0)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    scope = relationship("Code", foreign_keys=[scope_id])
    organ = relationship("Code", foreign_keys=[organ_id])
    tpl_phase = relationship("Code", foreign_keys=[tpl_phase_id])
    changed_by_user = relationship("User", foreign_keys=[changed_by])
    task_templates = relationship("TaskTemplate", back_populates="task_group_template", cascade="all, delete-orphan")
    task_groups = relationship("TaskGroup", back_populates="task_group_template")


class TaskTemplate(Base):
    """Reusable task definition copied into concrete tasks during instantiation."""

    __tablename__ = "TASK_TEMPLATE"

    id = Column("ID", Integer, primary_key=True, index=True)
    task_group_template_id = Column(
        "TASK_GROUP_TEMPLATE_ID",
        Integer,
        ForeignKey("TASK_GROUP_TEMPLATE.ID"),
        nullable=False,
        index=True,
    )
    description = Column("DESCRIPTION", String(512), nullable=False, default="")
    priority_id = Column("PRIORITY_ID", Integer, ForeignKey("CODE.ID"), nullable=False)
    is_must = Column("IS_MUST", Boolean, default=False)
    due_days_default = Column("DUE_DAYS_DEFAULT", Integer, nullable=True)
    is_active = Column("IS_ACTIVE", Boolean, default=True)
    sort_pos = Column("SORT_POS", Integer, default=0)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    task_group_template = relationship("TaskGroupTemplate", back_populates="task_templates")
    priority = relationship("Code", foreign_keys=[priority_id])
    changed_by_user = relationship("User", foreign_keys=[changed_by])


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
    task_group_template_id = Column(
        "TASK_GROUP_TEMPLATE_ID",
        Integer,
        ForeignKey("TASK_GROUP_TEMPLATE.ID"),
        nullable=True,
        index=True,
        comment="Optional source template used to instantiate this task group.",
        info={"label": "Task Group Template"},
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
    task_group_template = relationship("TaskGroupTemplate", back_populates="task_groups")
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
