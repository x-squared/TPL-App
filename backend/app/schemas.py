from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class CodeBase(BaseModel):
    type: str
    key: str
    pos: int
    ext_key: str = ""
    name_default: str = ""


class CodeCreate(CodeBase):
    pass


class CodeResponse(CodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class UserBase(BaseModel):
    ext_id: str
    name: str
    profile: str = ""


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class CatalogueBase(BaseModel):
    type: str
    key: str
    pos: int
    ext_key: str = ""
    name_default: str = ""


class CatalogueCreate(CatalogueBase):
    pass


class CatalogueResponse(CatalogueBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ContactInfoBase(BaseModel):
    patient_id: int
    type_id: int
    data: str
    comment: str = ""
    main: bool = False


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


class ContactInfoResponse(ContactInfoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: CodeResponse | None = None
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class PatientBase(BaseModel):
    pid: str
    first_name: str
    name: str
    date_of_birth: date | None = None
    date_of_death: date | None = None
    ahv_nr: str = ""
    lang: str = ""
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
    translate: bool | None = None


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    contact_infos: list[ContactInfoResponse] = []
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None


class ItemBase(BaseModel):
    title: str
    description: str = ""
    completed: bool = False
    code_id: int | None = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    completed: bool | None = None
    code_id: int | None = None


class ItemResponse(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    changed_by: int | None = None
    changed_by_user: UserResponse | None = None
    created_at: datetime
    updated_at: datetime | None = None
    code: CodeResponse | None = None
