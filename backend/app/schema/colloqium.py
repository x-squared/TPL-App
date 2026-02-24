from __future__ import annotations

from datetime import date as dt_date, datetime

from pydantic import BaseModel, ConfigDict

from .reference import CodeResponse, UserResponse
from .tasking import TaskResponse


class ColloqiumTypeBase(BaseModel):
    name: str
    organ_id: int
    participants: str = ""


class ColloqiumTypeCreate(ColloqiumTypeBase):
    pass


class ColloqiumTypeUpdate(BaseModel):
    name: str | None = None
    organ_id: int | None = None
    participants: str | None = None


class ColloqiumTypeResponse(ColloqiumTypeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organ: CodeResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class ColloqiumBase(BaseModel):
    colloqium_type_id: int
    date: dt_date
    participants: str = ""


class ColloqiumCreate(ColloqiumBase):
    pass


class ColloqiumUpdate(BaseModel):
    colloqium_type_id: int | None = None
    date: dt_date | None = None
    participants: str | None = None


class ColloqiumResponse(ColloqiumBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    colloqium_type: ColloqiumTypeResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class ColloqiumAgendaBase(BaseModel):
    colloqium_id: int
    ref_entity_type: str = "EPISODE"
    ref_entity_id: int | None = None
    presented_by: str = ""
    decision: str = ""
    comment: str = ""


class ColloqiumAgendaCreate(ColloqiumAgendaBase):
    pass


class ColloqiumAgendaUpdate(BaseModel):
    colloqium_id: int | None = None
    ref_entity_type: str | None = None
    ref_entity_id: int | None = None
    presented_by: str | None = None
    decision: str | None = None
    comment: str | None = None


class ColloqiumAgendaResponse(ColloqiumAgendaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    colloqium: ColloqiumResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class ColloqiumTaskBase(BaseModel):
    colloqium_agenda_id: int
    task_id: int


class ColloqiumTaskCreate(ColloqiumTaskBase):
    pass


class ColloqiumTaskUpdate(BaseModel):
    colloqium_agenda_id: int | None = None
    task_id: int | None = None


class ColloqiumTaskResponse(ColloqiumTaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agenda: ColloqiumAgendaResponse | None = None
    task: TaskResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None
