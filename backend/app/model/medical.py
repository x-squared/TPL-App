from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class MedicalValueTemplate(Base):
    """Template definition for medical values and organ applicability flags."""

    __tablename__ = "MEDICAL_VALUE_TEMPLATE"

    id = Column("ID", Integer, primary_key=True, index=True)
    lab_key = Column("LAB_KEY", String(12), nullable=False)
    kis_key = Column("KIS_KEY", String(64), nullable=False)
    datatype_id = Column("DATATYPE_ID", Integer, ForeignKey("CODE.ID"), nullable=False)
    name_default = Column("NAME_DEFAULT", String(64), default="")
    pos = Column("POS", Integer, nullable=False)
    use_liver = Column("USE_LIVER", Boolean, default=False)
    use_kidney = Column("USE_KIDNEY", Boolean, default=False)
    use_heart = Column("USE_HEART", Boolean, default=False)
    use_lung = Column("USE_LUNG", Boolean, default=False)
    use_donor = Column("USE_DONOR", Boolean, default=False)

    datatype = relationship("Code")


class MedicalValue(Base):
    """Patient-specific medical value instance created from template or custom input."""

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
