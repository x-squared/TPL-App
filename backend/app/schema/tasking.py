from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, model_validator

from .reference import CodeResponse, UserResponse


class TaskGroupTemplateBase(BaseModel):
    key: str
    name: str
    description: str = ""
    scope_id: int
    organ_id: int | None = None
    tpl_phase_id: int | None = None
    is_active: bool = True
    sort_pos: int = 0


class TaskGroupTemplateCreate(TaskGroupTemplateBase):
    pass


class TaskGroupTemplateUpdate(BaseModel):
    key: str | None = None
    name: str | None = None
    description: str | None = None
    scope_id: int | None = None
    organ_id: int | None = None
    tpl_phase_id: int | None = None
    is_active: bool | None = None
    sort_pos: int | None = None


class TaskGroupTemplateResponse(TaskGroupTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scope: CodeResponse | None = None
    organ: CodeResponse | None = None
    tpl_phase: CodeResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class TaskTemplateBase(BaseModel):
    task_group_template_id: int
    description: str
    priority_id: int | None = None
    due_days_default: int | None = None
    is_active: bool = True
    sort_pos: int = 0


class TaskTemplateCreate(TaskTemplateBase):
    pass


class TaskTemplateUpdate(BaseModel):
    task_group_template_id: int | None = None
    description: str | None = None
    priority_id: int | None = None
    due_days_default: int | None = None
    is_active: bool | None = None
    sort_pos: int | None = None


class TaskTemplateResponse(TaskTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_group_template: TaskGroupTemplateResponse | None = None
    priority: CodeResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class TaskGroupTemplateInstantiateRequest(BaseModel):
    patient_id: int
    episode_id: int | None = None
    tpl_phase_id: int | None = None
    anchor_date: date


class TaskGroupBase(BaseModel):
    patient_id: int
    task_group_template_id: int | None = None
    name: str = ""
    episode_id: int | None = None
    colloqium_agenda_id: int | None = None
    tpl_phase_id: int | None = None


class TaskGroupCreate(TaskGroupBase):
    @model_validator(mode="after")
    def tpl_phase_requires_episode(self):
        if self.tpl_phase_id is not None and self.episode_id is None:
            raise ValueError("tpl_phase_id can only be set if episode_id is set")
        return self


class TaskGroupUpdate(BaseModel):
    patient_id: int | None = None
    task_group_template_id: int | None = None
    name: str | None = None
    episode_id: int | None = None
    colloqium_agenda_id: int | None = None
    tpl_phase_id: int | None = None


class TaskGroupResponse(TaskGroupBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tpl_phase: CodeResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class TaskBase(BaseModel):
    task_group_id: int
    description: str = ""
    priority_id: int | None = None
    assigned_to_id: int | None = None
    until: date
    status_id: int | None = None
    closed_at: date | None = None
    closed_by_id: int | None = None
    comment: str = ""


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    task_group_id: int | None = None
    description: str | None = None
    priority_id: int | None = None
    assigned_to_id: int | None = None
    until: date | None = None
    status_id: int | None = None
    closed_at: date | None = None
    closed_by_id: int | None = None
    comment: str | None = None


class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    priority: CodeResponse | None = None
    status: CodeResponse | None = None
    assigned_to: UserResponse | None = None
    closed_by: UserResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    closed: bool = False
    created_at: datetime
    updated_at: datetime | None = None
