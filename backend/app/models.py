from sqlalchemy import Column, Date, ForeignKey, Integer, String, Boolean, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base



class Code(Base):
    __tablename__ = "CODE"
    __table_args__ = (UniqueConstraint("TYPE", "KEY"),)

    id = Column("ID", Integer, primary_key=True, index=True)
    type = Column("TYPE", String, nullable=False, index=True)
    key = Column("KEY", String, nullable=False)
    pos = Column("POS", Integer, nullable=False)
    ext_sys = Column("EXT_SYS", String(24), default="")
    ext_key = Column("EXT_KEY", String, default="")
    name_default = Column("NAME_DEFAULT", String, default="")

class Catalogue(Base):
    __tablename__ = "CATALOGUE"
    __table_args__ = (UniqueConstraint("TYPE", "KEY"),)

    id = Column("ID", Integer, primary_key=True, index=True)
    type = Column("TYPE", String, nullable=False, index=True)
    key = Column("KEY", String, nullable=False)
    pos = Column("POS", Integer, nullable=False)
    ext_sys = Column("EXT_SYS", String(24), default="")
    ext_key = Column("EXT_KEY", String, default="")
    name_default = Column("NAME_DEFAULT", String, default="")

class User(Base):
    __tablename__ = "USER"

    id = Column("ID", Integer, primary_key=True, index=True)
    ext_id = Column("EXT_ID", String, nullable=False, unique=True)
    name = Column("NAME", String, nullable=False)
    role_id = Column("ROLE", Integer, ForeignKey("CODE.ID"), nullable=True)

    role = relationship("Code", foreign_keys=[role_id])


class Patient(Base):
    __tablename__ = "PATIENT"

    id = Column("ID", Integer, primary_key=True, index=True)
    pid = Column("PID", String, nullable=False, unique=True, index=True)
    first_name = Column("FIRST_NAME", String, nullable=False)
    name = Column("NAME", String, nullable=False)
    date_of_birth = Column("DATE_OF_BIRTH", Date, nullable=False)
    date_of_death = Column("DATE_OF_DEATH", Date, nullable=True)
    ahv_nr = Column("AHV_NR", String, default="")
    lang = Column("LANG", String, default="")
    blood_type_id = Column("BLOOD_TYPE_ID", Integer, ForeignKey("CATALOGUE.ID"), nullable=True)
    resp_coord_id = Column("RESP_COORD", Integer, ForeignKey("USER.ID"), nullable=True)
    translate = Column("TRANSLATE", Boolean, default=False)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    changed_by_user = relationship("User", foreign_keys=[changed_by])
    blood_type = relationship("Catalogue", foreign_keys=[blood_type_id])
    resp_coord = relationship("User", foreign_keys=[resp_coord_id])
    contact_infos = relationship("ContactInfo", back_populates="patient", cascade="all, delete-orphan")
    absences = relationship("Absence", back_populates="patient", cascade="all, delete-orphan")
    diagnoses = relationship("Diagnosis", back_populates="patient", cascade="all, delete-orphan")
    medical_values = relationship("MedicalValue", back_populates="patient", cascade="all, delete-orphan")
    episodes = relationship("Episode", back_populates="patient", cascade="all, delete-orphan")


class Absence(Base):
    __tablename__ = "ABSENCE"

    id = Column("ID", Integer, primary_key=True, index=True)
    patient_id = Column("PATIENT_ID", Integer, ForeignKey("PATIENT.ID"), nullable=False, index=True)
    start = Column("START", Date, nullable=False)
    end = Column("END", Date, nullable=False)
    comment = Column("COMMENT", String(1024), default="")
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="absences")
    changed_by_user = relationship("User")


class Diagnosis(Base):
    __tablename__ = "DIAGNOSIS"

    id = Column("ID", Integer, primary_key=True, index=True)
    patient_id = Column("PATIENT_ID", Integer, ForeignKey("PATIENT.ID"), nullable=False, index=True)
    catalogue_id = Column("CATALOGUE_ID", Integer, ForeignKey("CATALOGUE.ID"), nullable=False)
    comment = Column("COMMENT", String(128), default="")
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="diagnoses")
    catalogue = relationship("Catalogue")
    changed_by_user = relationship("User")


class ContactInfo(Base):
    __tablename__ = "CONTACT_INFO"

    id = Column("ID", Integer, primary_key=True, index=True)
    patient_id = Column("PATIENT_ID", Integer, ForeignKey("PATIENT.ID"), nullable=False, index=True)
    type_id = Column("TYPE_ID", Integer, ForeignKey("CODE.ID"), nullable=False)
    data = Column("DATA", String(128), nullable=False)
    comment = Column("COMMENT", String(128), default="")
    main = Column("MAIN", Boolean, default=False)
    pos = Column("POS", Integer, default=0)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="contact_infos")
    type = relationship("Code")
    changed_by_user = relationship("User")

class MedicalValueTemplate(Base):
    __tablename__ = "MEDICAL_VALUE_TEMPLATE"

    id = Column("ID", Integer, primary_key=True, index=True)
    lab_key = Column("LAB_KEY", String(12), nullable=False)
    kis_key = Column("KIS_KEY", String(64), nullable=False)
    datatype_id = Column("DATATYPE_ID", Integer, ForeignKey("CODE.ID"), nullable=False)
    name_default = Column("NAME_DEFAULT", String(64), default="")
    pos = Column("POS", Integer, nullable=False)
    use_base = Column("USE_BASE", Boolean, default=False)
    use_liver = Column("USE_LIVER", Boolean, default=False)
    use_kidney = Column("USE_KIDNEY", Boolean, default=False)
    use_heart = Column("USE_HEART", Boolean, default=False)
    use_lung = Column("USE_LUNG", Boolean, default=False)
    use_donor = Column("USE_DONOR", Boolean, default=False)

    datatype = relationship("Code")

class MedicalValue(Base):
    __tablename__ = "MEDICAL_VALUE"

    id = Column("ID", Integer, primary_key=True, index=True)
    patient_id = Column("PATIENT_ID", Integer, ForeignKey("PATIENT.ID"), nullable=False, index=True)
    medical_value_template_id = Column("MEDICAL_VALUE_TEMPLATE_ID", Integer, ForeignKey("MEDICAL_VALUE_TEMPLATE.ID"), nullable=True)
    datatype_id = Column("DATATYPE_ID", Integer, ForeignKey("CODE.ID"), nullable=True)
    name = Column("NAME", String(64), default="")
    pos = Column("POS", Integer, default=0)
    value = Column("VALUE", String, default="")
    renew_date = Column("RENEW_DATE", Date, nullable=True)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="medical_values")
    medical_value_template = relationship("MedicalValueTemplate")
    datatype = relationship("Code")
    changed_by_user = relationship("User")


class Episode(Base):
    __tablename__ = "EPISODE"

    id = Column("ID", Integer, primary_key=True, index=True)
    patient_id = Column("PATIENT_ID", Integer, ForeignKey("PATIENT.ID"), nullable=False, index=True)
    organ_id = Column("ORGAN_ID", Integer, ForeignKey("CODE.ID"), nullable=False)
    start = Column("START", Date, nullable=True)
    end = Column("END", Date, nullable=True)
    fall_nr = Column("FALL_NR", String(24), default="")
    status_id = Column("STATUS_ID", Integer, ForeignKey("CODE.ID"), nullable=True)
    closed = Column("CLOSED", Boolean, default=False)
    comment = Column("COMMENT", String(1024), default="")
    cave = Column("CAVE", String(512), default="")
    eval_start = Column("EVAL_START", Date, nullable=True)
    eval_end = Column("EVAL_END", Date, nullable=True)
    eval_assigned_to = Column("EVAL_ASSIGNED_TO", String, default="")
    eval_stat = Column("EVAL_STAT", String, default="")
    eval_register_date = Column("EVAL_REGISTER_DATE", Date, nullable=True)
    eval_excluded = Column("EVAL_EXCLUDED", Boolean, default=False)
    eval_non_list_sent = Column("EVAL_NON_LIST_SENT", Date, nullable=True)
    list_start = Column("LIST_START", Date, nullable=True)
    list_end = Column("LIST_END", Date, nullable=True)
    list_rs_nr = Column("LIST_RS_NR", String(12), default="")
    list_reason_delist = Column("LIST_REASON_DELIST", String, default="")
    list_expl_delist = Column("LIST_EXPL_DELIST", String(1024), default="")
    list_delist_sent = Column("LIST_DELIST_SENT", Date, nullable=True)
    tpl_date = Column("TPL_DATE", Date, nullable=True)
    fup_recipient_card_done = Column("FUP_RECIPIENT_CARD_DONE", Boolean, default=False)
    fup_recipient_card_date = Column("FUP_RECIPIENT_CARD_DATE", Date, nullable=True)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="episodes")
    organ = relationship("Code", foreign_keys=[organ_id])
    status = relationship("Code", foreign_keys=[status_id])
    changed_by_user = relationship("User")




