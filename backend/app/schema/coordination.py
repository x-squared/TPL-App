from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator

from .clinical import EpisodeResponse
from .reference import CatalogueResponse, CodeResponse, UserResponse
from .tasking import TaskResponse


class CoordinationBase(BaseModel):
    start: date | None = None
    end: date | None = None
    status_id: int
    donor_nr: str = ""
    swtpl_nr: str = ""
    national_coordinator: str = ""
    comment: str = ""


class CoordinationCreate(BaseModel):
    start: date | None = None
    end: date | None = None
    status_id: int | None = None
    donor_nr: str = ""
    swtpl_nr: str = ""
    national_coordinator: str = ""
    comment: str = ""


class CoordinationUpdate(BaseModel):
    start: date | None = None
    end: date | None = None
    status_id: int | None = None
    donor_nr: str | None = None
    swtpl_nr: str | None = None
    national_coordinator: str | None = None
    comment: str | None = None


class CoordinationResponse(CoordinationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: CodeResponse | None = None
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationDonorBase(BaseModel):
    coordination_id: int
    full_name: str = ""
    sex_id: int | None = None
    birth_date: date | None = None
    blood_type_id: int | None = None
    height: int | None = None
    weight: int | None = None
    organ_fo: str = ""
    diagnosis_id: int | None = None
    death_kind_id: int | None = None


class CoordinationDonorCreate(BaseModel):
    full_name: str = ""
    sex_id: int | None = None
    birth_date: date | None = None
    blood_type_id: int | None = None
    height: int | None = None
    weight: int | None = None
    organ_fo: str = ""
    diagnosis_id: int | None = None
    death_kind_id: int | None = None


class CoordinationDonorUpdate(BaseModel):
    full_name: str | None = None
    sex_id: int | None = None
    birth_date: date | None = None
    blood_type_id: int | None = None
    height: int | None = None
    weight: int | None = None
    organ_fo: str | None = None
    diagnosis_id: int | None = None
    death_kind_id: int | None = None


class CoordinationDonorResponse(CoordinationDonorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sex: CodeResponse | None = None
    blood_type: CatalogueResponse | None = None
    diagnosis: CatalogueResponse | None = None
    death_kind: CodeResponse | None = None
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationTimeLogBase(BaseModel):
    coordination_id: int
    user_id: int
    start: datetime | None = None
    end: datetime | None = None
    comment: str = ""


class CoordinationTimeLogCreate(BaseModel):
    user_id: int
    start: datetime | None = None
    end: datetime | None = None
    comment: str = ""


class CoordinationTimeLogUpdate(BaseModel):
    user_id: int | None = None
    start: datetime | None = None
    end: datetime | None = None
    comment: str | None = None


class CoordinationTimeLogResponse(CoordinationTimeLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user: UserResponse | None = None
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProtocolEventLogBase(BaseModel):
    coordination_id: int
    organ_id: int
    event: str
    time: datetime
    task_id: int | None = None


class CoordinationProtocolEventLogCreate(BaseModel):
    organ_id: int
    event: str
    task_id: int | None = None

    @field_validator("event")
    @classmethod
    def _validate_event(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("event must not be empty")
        if len(trimmed) > 128:
            raise ValueError("event must be at most 128 characters")
        return trimmed


class CoordinationProtocolEventLogResponse(CoordinationProtocolEventLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organ: CodeResponse | None = None
    task: TaskResponse | None = None
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationEpisodeBase(BaseModel):
    coordination_id: int
    episode_id: int
    organ_id: int
    tpl_date: date | None = None
    procurement_team: str = ""
    exvivo_perfusion_done: bool = False
    is_organ_rejected: bool = False
    organ_rejection_sequel_id: int | None = None


class CoordinationEpisodeCreate(BaseModel):
    episode_id: int
    organ_id: int
    tpl_date: date | None = None
    procurement_team: str = ""
    exvivo_perfusion_done: bool = False
    is_organ_rejected: bool = False
    organ_rejection_sequel_id: int | None = None


class CoordinationEpisodeUpdate(BaseModel):
    episode_id: int | None = None
    organ_id: int | None = None
    tpl_date: date | None = None
    procurement_team: str | None = None
    exvivo_perfusion_done: bool | None = None
    is_organ_rejected: bool | None = None
    organ_rejection_sequel_id: int | None = None


class CoordinationEpisodeResponse(CoordinationEpisodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    episode: EpisodeResponse | None = None
    organ: CodeResponse | None = None
    organ_rejection_sequel: CatalogueResponse | None = None
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementBase(BaseModel):
    coordination_id: int
    time_of_death: datetime | None = None
    moe_performed: bool = False
    moe_time: datetime | None = None
    nrp_abdominal_done: bool = False
    nrp_thoracic_done: bool = False
    nrp_time: datetime | None = None


class CoordinationProcurementCreate(BaseModel):
    time_of_death: datetime | None = None
    moe_performed: bool = False
    moe_time: datetime | None = None
    nrp_abdominal_done: bool = False
    nrp_thoracic_done: bool = False
    nrp_time: datetime | None = None


class CoordinationProcurementUpdate(BaseModel):
    time_of_death: datetime | None = None
    moe_performed: bool | None = None
    moe_time: datetime | None = None
    nrp_abdominal_done: bool | None = None
    nrp_thoracic_done: bool | None = None
    nrp_time: datetime | None = None


class CoordinationProcurementResponse(CoordinationProcurementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementFieldTemplateBase(BaseModel):
    key: str
    name_default: str = ""
    pos: int = 0
    datatype_def_id: int


class CoordinationProcurementFieldTemplateResponse(CoordinationProcurementFieldTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementFieldScopeTemplateBase(BaseModel):
    field_template_id: int
    organ_id: int | None = None
    slot_key: str = "MAIN"


class CoordinationProcurementFieldScopeTemplateResponse(CoordinationProcurementFieldScopeTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organ: CodeResponse | None = None
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementValueBase(BaseModel):
    slot_id: int
    field_template_id: int
    value: str = ""


class CoordinationProcurementValueCreate(BaseModel):
    value: str = ""


class CoordinationProcurementValueResponse(CoordinationProcurementValueBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    field_template: CoordinationProcurementFieldTemplateResponse | None = None
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementSlotBase(BaseModel):
    coordination_procurement_organ_id: int
    slot_key: str = "MAIN"


class CoordinationProcurementSlotResponse(CoordinationProcurementSlotBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    values: list[CoordinationProcurementValueResponse] = []
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementOrganBase(BaseModel):
    coordination_id: int
    organ_id: int
    procurement_surgeon: str = ""


class CoordinationProcurementOrganCreate(BaseModel):
    procurement_surgeon: str = ""


class CoordinationProcurementOrganUpdate(BaseModel):
    procurement_surgeon: str | None = None


class CoordinationProcurementOrganResponse(CoordinationProcurementOrganBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organ: CodeResponse | None = None
    slots: list[CoordinationProcurementSlotResponse] = []
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementFlexResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    procurement: CoordinationProcurementResponse | None = None
    organs: list[CoordinationProcurementOrganResponse] = []
    field_templates: list[CoordinationProcurementFieldTemplateResponse] = []


class CoordinationOrganEffectBase(BaseModel):
    coordination_id: int
    organ_id: int
    procurement_effect_id: int | None = None


class CoordinationOrganEffectCreate(BaseModel):
    organ_id: int
    procurement_effect_id: int | None = None


class CoordinationOrganEffectUpdate(BaseModel):
    organ_id: int | None = None
    procurement_effect_id: int | None = None


class CoordinationOrganEffectResponse(CoordinationOrganEffectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organ: CodeResponse | None = None
    procurement_effect: CatalogueResponse | None = None
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationOriginBase(BaseModel):
    coordination_id: int
    detection_hospital_id: int | None = None
    procurement_hospital_id: int | None = None


class CoordinationOriginCreate(BaseModel):
    detection_hospital_id: int | None = None
    procurement_hospital_id: int | None = None


class CoordinationOriginUpdate(BaseModel):
    detection_hospital_id: int | None = None
    procurement_hospital_id: int | None = None


class CoordinationOriginResponse(CoordinationOriginBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    detection_hospital: CatalogueResponse | None = None
    procurement_hospital: CatalogueResponse | None = None
    organs_declined: bool = False
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None
