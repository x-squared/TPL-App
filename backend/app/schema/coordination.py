from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from .clinical import EpisodeResponse
from .reference import CatalogueResponse, CodeResponse, UserResponse


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


class CoordinationProcurementHeartBase(BaseModel):
    coordination_id: int
    cold_perfusion: datetime | None = None
    procurment_surgeon: str = ""
    nmp_used: bool = False
    evlp_used: bool = False


class CoordinationProcurementHeartCreate(BaseModel):
    cold_perfusion: datetime | None = None
    procurment_surgeon: str = ""
    nmp_used: bool = False
    evlp_used: bool = False


class CoordinationProcurementHeartUpdate(BaseModel):
    cold_perfusion: datetime | None = None
    procurment_surgeon: str | None = None
    nmp_used: bool | None = None
    evlp_used: bool | None = None


class CoordinationProcurementHeartResponse(CoordinationProcurementHeartBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementLiverBase(BaseModel):
    coordination_id: int
    cold_perfusion_abdominal: datetime | None = None
    procurement_surgeo: str = ""
    nmp_used: bool = False
    hope_used: bool = False


class CoordinationProcurementLiverCreate(BaseModel):
    cold_perfusion_abdominal: datetime | None = None
    procurement_surgeo: str = ""
    nmp_used: bool = False
    hope_used: bool = False


class CoordinationProcurementLiverUpdate(BaseModel):
    cold_perfusion_abdominal: datetime | None = None
    procurement_surgeo: str | None = None
    nmp_used: bool | None = None
    hope_used: bool | None = None


class CoordinationProcurementLiverResponse(CoordinationProcurementLiverBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementKidneyBase(BaseModel):
    coordination_id: int
    procurement_surgeon_left: str = ""
    procurement_surgeon_right: str = ""
    lifeport_right_used: bool = False
    lifeport_left_used: bool = False
    ope_used: bool = False


class CoordinationProcurementKidneyCreate(BaseModel):
    procurement_surgeon_left: str = ""
    procurement_surgeon_right: str = ""
    lifeport_right_used: bool = False
    lifeport_left_used: bool = False
    ope_used: bool = False


class CoordinationProcurementKidneyUpdate(BaseModel):
    procurement_surgeon_left: str | None = None
    procurement_surgeon_right: str | None = None
    lifeport_right_used: bool | None = None
    lifeport_left_used: bool | None = None
    ope_used: bool | None = None


class CoordinationProcurementKidneyResponse(CoordinationProcurementKidneyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementHeartValvesBase(BaseModel):
    coordination_id: int
    procurement_surgeon: str = ""
    ehb_box_nr: str = ""
    ehb_nr: str = ""


class CoordinationProcurementHeartValvesCreate(BaseModel):
    procurement_surgeon: str = ""
    ehb_box_nr: str = ""
    ehb_nr: str = ""


class CoordinationProcurementHeartValvesUpdate(BaseModel):
    procurement_surgeon: str | None = None
    ehb_box_nr: str | None = None
    ehb_nr: str | None = None


class CoordinationProcurementHeartValvesResponse(CoordinationProcurementHeartValvesBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementPancreasBase(BaseModel):
    coordination_id: int
    procurement_surgeon: str = ""


class CoordinationProcurementPancreasCreate(BaseModel):
    procurement_surgeon: str = ""


class CoordinationProcurementPancreasUpdate(BaseModel):
    procurement_surgeon: str | None = None


class CoordinationProcurementPancreasResponse(CoordinationProcurementPancreasBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementIsletsBase(BaseModel):
    coordination_id: int
    procurement_surgeon: str = ""


class CoordinationProcurementIsletsCreate(BaseModel):
    procurement_surgeon: str = ""


class CoordinationProcurementIsletsUpdate(BaseModel):
    procurement_surgeon: str | None = None


class CoordinationProcurementIsletsResponse(CoordinationProcurementIsletsBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class CoordinationProcurementIntestinesBase(BaseModel):
    coordination_id: int
    procurement_surgeon: str = ""


class CoordinationProcurementIntestinesCreate(BaseModel):
    procurement_surgeon: str = ""


class CoordinationProcurementIntestinesUpdate(BaseModel):
    procurement_surgeon: str | None = None


class CoordinationProcurementIntestinesResponse(CoordinationProcurementIntestinesBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    changed_by_id: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


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
