from __future__ import annotations

from datetime import date as dt_date, datetime

from pydantic import BaseModel, ConfigDict

from .clinical import EpisodeResponse
from .reference import CodeResponse, UserResponse


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
    changed_by_id: int | None = None
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
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class ColloqiumAgendaBase(BaseModel):
    colloqium_id: int
    episode_id: int
    presented_by: str = ""
    decision: str = ""
    comment: str = ""


class ColloqiumAgendaCreate(ColloqiumAgendaBase):
    pass


class ColloqiumAgendaUpdate(BaseModel):
    colloqium_id: int | None = None
    episode_id: int | None = None
    presented_by: str | None = None
    decision: str | None = None
    comment: str | None = None


class ColloqiumAgendaResponse(ColloqiumAgendaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    colloqium: ColloqiumResponse | None = None
    episode: EpisodeResponse | None = None
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None
