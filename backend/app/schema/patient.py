from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from .clinical import (
    AbsenceResponse,
    ContactInfoResponse,
    DiagnosisResponse,
    EpisodeResponse,
    MedicalValueResponse,
)
from .reference import CatalogueResponse, UserResponse


class PatientBase(BaseModel):
    pid: str
    first_name: str
    name: str
    date_of_birth: date
    date_of_death: date | None = None
    ahv_nr: str = ""
    lang: str = ""
    blood_type_id: int | None = None
    resp_coord_id: int | None = None
    translate: bool = False


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    pid: str | None = None
    first_name: str | None = None
    name: str | None = None
    date_of_birth: date | None = None
    date_of_death: date | None = None
    ahv_nr: str | None = None
    lang: str | None = None
    blood_type_id: int | None = None
    resp_coord_id: int | None = None
    translate: bool | None = None


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    blood_type: CatalogueResponse | None = None
    resp_coord: UserResponse | None = None
    contact_infos: list[ContactInfoResponse] = []
    absences: list[AbsenceResponse] = []
    diagnoses: list[DiagnosisResponse] = []
    medical_values: list[MedicalValueResponse] = []
    episodes: list[EpisodeResponse] = []
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class PatientListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pid: str
    first_name: str
    name: str
    date_of_birth: date | None = None
    date_of_death: date | None = None
    ahv_nr: str = ""
    lang: str = ""
    blood_type_id: int | None = None
    blood_type: CatalogueResponse | None = None
    resp_coord_id: int | None = None
    resp_coord: UserResponse | None = None
    translate: bool = False
    contact_info_count: int = 0
    open_episode_count: int = 0
    open_episode_indicators: list[str] = []
    episode_organ_ids: list[int] = []
    open_episode_organ_ids: list[int] = []
