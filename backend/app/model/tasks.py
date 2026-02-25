from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class TaskGroupTemplate(Base):
    """Reusable blueprint for creating task groups in a defined transplant scope."""

    __tablename__ = "TASK_GROUP_TEMPLATE"
    __table_args__ = (UniqueConstraint("KEY"),)

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the task group template.",
        info={"label": "ID"},
    )
    key = Column(
        "KEY",
        String(64),
        nullable=False,
        comment="Stable technical key of the task group template.",
        info={"label": "Key"},
    )
    name = Column(
        "NAME",
        String(128),
        nullable=False,
        comment="Display name of the task group template.",
        info={"label": "Name"},
    )
    description = Column(
        "DESCRIPTION",
        String(512),
        default="",
        comment="Description of the task group template purpose.",
        info={"label": "Description"},
    )
    scope_id = Column(
        "SCOPE_ID",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=False,
        comment="Template scope reference (`CODE.TASK_SCOPE`).",
        info={"label": "Task Scope"},
    )
    organ_id = Column(
        "ORGAN_ID",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=True,
        comment="Optional organ constraint (`CODE.ORGAN`) for template applicability.",
        info={"label": "Template Organ"},
    )
    tpl_phase_id = Column(
        "TPL_PHASE_ID",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=True,
        comment="Optional transplant phase constraint (`CODE.TPL_PHASE`).",
        info={"label": "TPL Phase"},
    )
    is_active = Column(
        "IS_ACTIVE",
        Boolean,
        default=True,
        comment="Whether the task group template can be instantiated.",
        info={"label": "Is Active"},
    )
    sort_pos = Column(
        "SORT_POS",
        Integer,
        default=0,
        comment="Sort position of the template.",
        info={"label": "Sort Position"},
    )
    changed_by_id = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the task group template.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the task group template row.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the task group template row.",
        info={"label": "Updated At"},
    )

    scope = relationship("Code", foreign_keys=[scope_id])
    organ = relationship("Code", foreign_keys=[organ_id])
    tpl_phase = relationship("Code", foreign_keys=[tpl_phase_id])
    changed_by_user = relationship("User", foreign_keys=[changed_by_id])
    task_templates = relationship("TaskTemplate", back_populates="task_group_template", cascade="all, delete-orphan")
    task_groups = relationship("TaskGroup", back_populates="task_group_template")


class TaskTemplate(Base):
    """Reusable task definition copied into concrete tasks during instantiation."""

    __tablename__ = "TASK_TEMPLATE"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the task template.",
        info={"label": "ID"},
    )
    task_group_template_id = Column(
        "TASK_GROUP_TEMPLATE_ID",
        Integer,
        ForeignKey("TASK_GROUP_TEMPLATE.ID"),
        nullable=False,
        index=True,
        comment="Parent task group template reference.",
        info={"label": "Task Group Template"},
    )
    description = Column(
        "DESCRIPTION",
        String(512),
        nullable=False,
        default="",
        comment="Template description copied into concrete task descriptions.",
        info={"label": "Description"},
    )
    priority_id = Column(
        "PRIORITY_ID",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=False,
        comment="Default priority reference (`CODE.PRIORITY`).",
        info={"label": "Default Priority"},
    )
    due_days_default = Column(
        "DUE_DAYS_DEFAULT",
        Integer,
        nullable=True,
        comment="Default due offset in days from anchor date.",
        info={"label": "Due Days Default"},
    )
    is_active = Column(
        "IS_ACTIVE",
        Boolean,
        default=True,
        comment="Whether the task template is active for instantiation.",
        info={"label": "Is Active"},
    )
    sort_pos = Column(
        "SORT_POS",
        Integer,
        default=0,
        comment="Sort position of the task template within its group template.",
        info={"label": "Sort Position"},
    )
    changed_by_id = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the task template.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the task template row.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the task template row.",
        info={"label": "Updated At"},
    )

    task_group_template = relationship("TaskGroupTemplate", back_populates="task_templates")
    priority = relationship("Code", foreign_keys=[priority_id])
    changed_by_user = relationship("User", foreign_keys=[changed_by_id])


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
    name = Column(
        "NAME",
        String(128),
        nullable=False,
        default="",
        comment="Display name of the task group.",
        info={"label": "Name"},
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
    colloqium_agenda_id = Column(
        "COLLOQIUM_AGENDA_ID",
        Integer,
        ForeignKey("COLLOQIUM_AGENDA.ID"),
        nullable=True,
        index=True,
        comment="Optional colloqium agenda origin for this task group.",
        info={"label": "Colloqium Agenda"},
    )
    tpl_phase_id = Column(
        "TPL_PHASE_ID",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=True,
        comment="Optional transplant phase (`CODE.TPL_PHASE`), only allowed when episode is set.",
        info={"label": "TPL Phase"},
    )
    changed_by_id = Column(
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
    colloqium_agenda = relationship("ColloqiumAgenda")
    tpl_phase = relationship("Code", foreign_keys=[tpl_phase_id])
    changed_by_user = relationship("User", foreign_keys=[changed_by_id])
    tasks = relationship("Task", back_populates="task_group", cascade="all, delete-orphan")


class Task(Base):
    """Task entry linked to a task group with ownership, timing, and closure state."""

    __tablename__ = "TASK"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the task.",
        info={"label": "ID"},
    )
    task_group_id = Column(
        "TASK_GROUP_ID",
        Integer,
        ForeignKey("TASK_GROUP.ID"),
        nullable=False,
        index=True,
        comment="Parent task group reference.",
        info={"label": "Task Group"},
    )
    description = Column(
        "DESCRIPTION",
        String(512),
        default="",
        comment="Task description text.",
        info={"label": "Description"},
    )
    priority_id = Column(
        "PRIORITY",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=False,
        comment="Priority reference (`CODE.PRIORITY`) of the task.",
        info={"label": "Task Priority"},
    )
    assigned_to_id = Column(
        "ASSIGNED_TO",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Optional assignee user reference.",
        info={"label": "Assigned To"},
    )
    until = Column(
        "UNTIL",
        Date,
        nullable=False,
        comment="Due date of the task.",
        info={"label": "Until"},
    )
    status_id = Column(
        "STATUS",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=False,
        comment="Status reference (`CODE.TASK_STATUS`) of the task.",
        info={"label": "Task Status"},
    )
    closed_at = Column(
        "CLOSED_AT",
        Date,
        nullable=True,
        comment="Closure date when task becomes completed or discarded.",
        info={"label": "Closed At"},
    )
    closed_by_id = Column(
        "CLOSED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="User reference that closed the task.",
        info={"label": "Closed By"},
    )
    comment = Column(
        "COMMENT",
        String(512),
        default="",
        comment="Free-text comment on task processing.",
        info={"label": "Comment"},
    )
    changed_by_id = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the task.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the task row.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the task row.",
        info={"label": "Updated At"},
    )

    task_group = relationship("TaskGroup", back_populates="tasks")
    priority = relationship("Code", foreign_keys=[priority_id])
    status = relationship("Code", foreign_keys=[status_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_tasks")
    closed_by = relationship("User", foreign_keys=[closed_by_id], back_populates="closed_tasks")
    changed_by_user = relationship("User", foreign_keys=[changed_by_id])

    @property
    def closed(self) -> bool:
        status_key = self.status.key if self.status else None
        return self.closed_at is not None and status_key in {"COMPLETED", "CANCELLED"}
