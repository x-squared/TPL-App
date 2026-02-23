from sqlalchemy import Column, Date, ForeignKey, Integer, String, Boolean, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Item(Base):
    __tablename__ = "ITEMS"

    id = Column("ID", Integer, primary_key=True, index=True)
    title = Column("TITLE", String, nullable=False, index=True)
    description = Column("DESCRIPTION", String, default="")
    completed = Column("COMPLETED", Boolean, default=False)
    code_id = Column("CODE_ID", Integer, ForeignKey("CODE.ID"), nullable=True)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    code = relationship("Code")
    changed_by_user = relationship("User")


class Code(Base):
    __tablename__ = "CODE"
    __table_args__ = (UniqueConstraint("TYPE", "KEY"),)

    id = Column("ID", Integer, primary_key=True, index=True)
    type = Column("TYPE", String, nullable=False, index=True)
    key = Column("KEY", String, nullable=False)
    pos = Column("POS", Integer, nullable=False)
    ext_key = Column("EXT_KEY", String, default="")
    name_default = Column("NAME_DEFAULT", String, default="")


class User(Base):
    __tablename__ = "USER"

    id = Column("ID", Integer, primary_key=True, index=True)
    ext_id = Column("EXT_ID", String, nullable=False, unique=True)
    name = Column("NAME", String, nullable=False)
    profile = Column("PROFILE", String, default="")


class Patient(Base):
    __tablename__ = "PATIENT"

    id = Column("ID", Integer, primary_key=True, index=True)
    pid = Column("PID", String, nullable=False, unique=True, index=True)
    first_name = Column("FIRST_NAME", String, nullable=False)
    name = Column("NAME", String, nullable=False)
    date_of_birth = Column("DATE_OF_BIRTH", Date, nullable=True)
    date_of_death = Column("DATE_OF_DEATH", Date, nullable=True)
    ahv_nr = Column("AHV_NR", String, default="")
    lang = Column("LANG", String, default="")
    translate = Column("TRANSLATE", Boolean, default=False)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    changed_by_user = relationship("User")
    contact_infos = relationship("ContactInfo", back_populates="patient", cascade="all, delete-orphan")


class ContactInfo(Base):
    __tablename__ = "CONTACT_INFO"

    id = Column("ID", Integer, primary_key=True, index=True)
    patient_id = Column("PATIENT_ID", Integer, ForeignKey("PATIENT.ID"), nullable=False, index=True)
    type_id = Column("TYPE_ID", Integer, ForeignKey("CODE.ID"), nullable=False)
    data = Column("DATA", String(128), nullable=False)
    comment = Column("COMMENT", String(128), default="")
    main = Column("MAIN", Boolean, default=False)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="contact_infos")
    type = relationship("Code")
    changed_by_user = relationship("User")


class Catalogue(Base):
    __tablename__ = "CATALOGUE"
    __table_args__ = (UniqueConstraint("TYPE", "KEY"),)

    id = Column("ID", Integer, primary_key=True, index=True)
    type = Column("TYPE", String, nullable=False, index=True)
    key = Column("KEY", String, nullable=False)
    pos = Column("POS", Integer, nullable=False)
    ext_key = Column("EXT_KEY", String, default="")
    name_default = Column("NAME_DEFAULT", String, default="")
