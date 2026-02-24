from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class Patient(Base):
    """Core patient entity with demographic, language, and linked clinical data."""

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
    task_groups = relationship("TaskGroup", back_populates="patient", cascade="all, delete-orphan")


class Absence(Base):
    """Date interval where the patient is marked as absent."""

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
    """Patient diagnosis linked to diagnosis catalogue entries."""

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
    """Patient contact channel row including type, value, and sort position."""

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
