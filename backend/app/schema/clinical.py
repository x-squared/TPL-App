from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, model_validator

from .reference import CatalogueResponse, CodeResponse, UserResponse


class MedicalValueTemplateBase(BaseModel):
    lab_key: str
    kis_key: str
    datatype_id: int
    name_default: str = ""
    pos: int
    use_base: bool = False
    use_liver: bool = False
    use_kidney: bool = False
    use_heart: bool = False
    use_lung: bool = False
    use_donor: bool = False


class MedicalValueTemplateCreate(MedicalValueTemplateBase):
    pass


class MedicalValueTemplateResponse(MedicalValueTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    datatype: CodeResponse | None = None


class MedicalValueBase(BaseModel):
    patient_id: int
    medical_value_template_id: int | None = None
    datatype_id: int | None = None
    name: str = ""
    pos: int = 0
    value: str = ""
    renew_date: date | None = None


class MedicalValueCreate(BaseModel):
    medical_value_template_id: int | None = None
    datatype_id: int | None = None
    name: str = ""
    pos: int = 0
    value: str = ""
    renew_date: date | None = None


class MedicalValueUpdate(BaseModel):
    medical_value_template_id: int | None = None
    datatype_id: int | None = None
    name: str | None = None
    pos: int | None = None
    value: str | None = None
    renew_date: date | None = None


class MedicalValueResponse(MedicalValueBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    medical_value_template: MedicalValueTemplateResponse | None = None
    datatype: CodeResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class DiagnosisBase(BaseModel):
    patient_id: int
    catalogue_id: int
    comment: str = ""


class DiagnosisCreate(BaseModel):
    catalogue_id: int
    comment: str = ""


class DiagnosisUpdate(BaseModel):
    catalogue_id: int | None = None
    comment: str | None = None


class DiagnosisResponse(DiagnosisBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    catalogue: CatalogueResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class AbsenceBase(BaseModel):
    patient_id: int
    start: date
    end: date
    comment: str = ""


class AbsenceCreate(BaseModel):
    start: date
    end: date
    comment: str = ""

    @model_validator(mode="after")
    def end_not_before_start(self):
        if self.end < self.start:
            raise ValueError("end must be equal to or after start")
        return self


class AbsenceUpdate(BaseModel):
    start: date | None = None
    end: date | None = None
    comment: str | None = None

    @model_validator(mode="after")
    def end_not_before_start(self):
        if self.start is not None and self.end is not None and self.end < self.start:
            raise ValueError("end must be equal to or after start")
        return self


class AbsenceResponse(AbsenceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class ContactInfoBase(BaseModel):
    patient_id: int
    type_id: int
    data: str
    comment: str = ""
    main: bool = False
    pos: int = 0


class ContactInfoCreate(BaseModel):
    type_id: int
    data: str
    comment: str = ""
    main: bool = False


class ContactInfoUpdate(BaseModel):
    type_id: int | None = None
    data: str | None = None
    comment: str | None = None
    main: bool | None = None
    pos: int | None = None


class ContactInfoResponse(ContactInfoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: CodeResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class EpisodeBase(BaseModel):
    patient_id: int
    organ_id: int
    start: date | None = None
    end: date | None = None
    fall_nr: str = ""
    status_id: int | None = None
    closed: bool = False
    comment: str = ""
    cave: str = ""
    eval_start: date | None = None
    eval_end: date | None = None
    eval_assigned_to: str = ""
    eval_stat: str = ""
    eval_register_date: date | None = None
    eval_excluded: bool = False
    eval_non_list_sent: date | None = None
    list_start: date | None = None
    list_end: date | None = None
    list_rs_nr: str = ""
    list_reason_delist: str = ""
    list_expl_delist: str = ""
    list_delist_sent: date | None = None
    tpl_date: date | None = None
    fup_recipient_card_done: bool = False
    fup_recipient_card_date: date | None = None


class EpisodeCreate(BaseModel):
    organ_id: int
    start: date | None = None
    end: date | None = None
    fall_nr: str = ""
    status_id: int | None = None
    closed: bool = False
    comment: str = ""
    cave: str = ""
    eval_start: date | None = None
    eval_end: date | None = None
    eval_assigned_to: str = ""
    eval_stat: str = ""
    eval_register_date: date | None = None
    eval_excluded: bool = False
    eval_non_list_sent: date | None = None
    list_start: date | None = None
    list_end: date | None = None
    list_rs_nr: str = ""
    list_reason_delist: str = ""
    list_expl_delist: str = ""
    list_delist_sent: date | None = None
    tpl_date: date | None = None
    fup_recipient_card_done: bool = False
    fup_recipient_card_date: date | None = None

    @model_validator(mode="after")
    def closed_requires_end(self):
        if self.closed and not self.end:
            raise ValueError("closed can only be true if end date is set")
        return self


class EpisodeUpdate(BaseModel):
    organ_id: int | None = None
    start: date | None = None
    end: date | None = None
    fall_nr: str | None = None
    status_id: int | None = None
    closed: bool | None = None
    comment: str | None = None
    cave: str | None = None
    eval_start: date | None = None
    eval_end: date | None = None
    eval_assigned_to: str | None = None
    eval_stat: str | None = None
    eval_register_date: date | None = None
    eval_excluded: bool | None = None
    eval_non_list_sent: date | None = None
    list_start: date | None = None
    list_end: date | None = None
    list_rs_nr: str | None = None
    list_reason_delist: str | None = None
    list_expl_delist: str | None = None
    list_delist_sent: date | None = None
    tpl_date: date | None = None
    fup_recipient_card_done: bool | None = None
    fup_recipient_card_date: date | None = None


class EpisodeResponse(EpisodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organ: CodeResponse | None = None
    status: CodeResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None
