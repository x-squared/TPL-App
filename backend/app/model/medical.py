from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class MedicalValueTemplate(Base):
    """Template definition for medical values and organ applicability flags."""

    __tablename__ = "MEDICAL_VALUE_TEMPLATE"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the medical value template.",
        info={"label": "ID"},
    )
    lab_key = Column(
        "LAB_KEY",
        String(12),
        nullable=False,
        comment="Laboratory key used to map incoming values.",
        info={"label": "Lab Key"},
    )
    kis_key = Column(
        "KIS_KEY",
        String(64),
        nullable=False,
        comment="KIS key used to map values from clinical systems.",
        info={"label": "KIS Key"},
    )
    datatype_id = Column(
        "DATATYPE_ID",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=False,
        comment="Data type reference (`CODE.DATATYPE`) of this template.",
        info={"label": "Datatype"},
    )
    name_default = Column(
        "NAME_DEFAULT",
        String(64),
        default="",
        comment="Default display name of the template.",
        info={"label": "Name"},
    )
    pos = Column(
        "POS",
        Integer,
        nullable=False,
        comment="Sort position among templates.",
        info={"label": "Position"},
    )
    use_liver = Column(
        "USE_LIVER",
        Boolean,
        default=False,
        comment="Whether this template is applicable for liver context.",
        info={"label": "Use Liver"},
    )
    use_kidney = Column(
        "USE_KIDNEY",
        Boolean,
        default=False,
        comment="Whether this template is applicable for kidney context.",
        info={"label": "Use Kidney"},
    )
    use_heart = Column(
        "USE_HEART",
        Boolean,
        default=False,
        comment="Whether this template is applicable for heart context.",
        info={"label": "Use Heart"},
    )
    use_lung = Column(
        "USE_LUNG",
        Boolean,
        default=False,
        comment="Whether this template is applicable for lung context.",
        info={"label": "Use Lung"},
    )
    use_donor = Column(
        "USE_DONOR",
        Boolean,
        default=False,
        comment="Whether this template is applicable for donor context.",
        info={"label": "Use Donor"},
    )
    medical_value_group_id = Column(
        "MEDICAL_VALUE_GROUP_ID",
        Integer,
        ForeignKey("MEDICAL_VALUE_GROUP.ID"),
        nullable=True,
        comment="Optional default group/bunch reference for this template.",
        info={"label": "Medical Value Group"},
    )

    datatype = relationship("Code")
    medical_value_group = relationship("MedicalValueGroup")


class MedicalValueGroup(Base):
    """Named bunch/group for medical values with optional group-level renewal date."""

    __tablename__ = "MEDICAL_VALUE_GROUP"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the medical value group.",
        info={"label": "ID"},
    )
    key = Column(
        "KEY",
        String(48),
        nullable=False,
        unique=True,
        comment="Stable key identifier of the medical value group.",
        info={"label": "Key"},
    )
    name_default = Column(
        "NAME_DEFAULT",
        String(128),
        nullable=False,
        default="",
        comment="Display label of the medical value group.",
        info={"label": "Name"},
    )
    pos = Column(
        "POS",
        Integer,
        nullable=False,
        default=0,
        comment="Sort position of the medical value group.",
        info={"label": "Position"},
    )
    renew_date = Column(
        "RENEW_DATE",
        Date,
        nullable=True,
        comment="Optional group-level renewal date.",
        info={"label": "Renew Date"},
    )
    changed_by_id = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the medical value group.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the medical value group row.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the medical value group row.",
        info={"label": "Updated At"},
    )

    changed_by_user = relationship("User")


class MedicalValue(Base):
    """Patient-specific medical value instance created from template or custom input."""

    __tablename__ = "MEDICAL_VALUE"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the medical value.",
        info={"label": "ID"},
    )
    patient_id = Column(
        "PATIENT_ID",
        Integer,
        ForeignKey("PATIENT.ID"),
        nullable=False,
        index=True,
        comment="Patient reference owning this medical value.",
        info={"label": "Patient"},
    )
    medical_value_template_id = Column(
        "MEDICAL_VALUE_TEMPLATE_ID",
        Integer,
        ForeignKey("MEDICAL_VALUE_TEMPLATE.ID"),
        nullable=True,
        comment="Optional source template reference for this value.",
        info={"label": "Medical Value Template"},
    )
    datatype_id = Column(
        "DATATYPE_ID",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=True,
        comment="Data type reference (`CODE.DATATYPE`) of this value.",
        info={"label": "Datatype"},
    )
    name = Column(
        "NAME",
        String(64),
        default="",
        comment="Display name of the medical value.",
        info={"label": "Name"},
    )
    pos = Column(
        "POS",
        Integer,
        default=0,
        comment="Sort position among patient medical values.",
        info={"label": "Position"},
    )
    value = Column(
        "VALUE",
        String,
        default="",
        comment="Stored value payload as text.",
        info={"label": "Value"},
    )
    renew_date = Column(
        "RENEW_DATE",
        Date,
        nullable=True,
        comment="Next renewal date for this medical value.",
        info={"label": "Renew Date"},
    )
    medical_value_group_id = Column(
        "MEDICAL_VALUE_GROUP_ID",
        Integer,
        ForeignKey("MEDICAL_VALUE_GROUP.ID"),
        nullable=True,
        comment="Optional group/bunch reference for this value.",
        info={"label": "Medical Value Group"},
    )
    changed_by_id = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the medical value.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the medical value row.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the medical value row.",
        info={"label": "Updated At"},
    )

    patient = relationship("Patient", back_populates="medical_values")
    medical_value_template = relationship("MedicalValueTemplate")
    medical_value_group = relationship("MedicalValueGroup")
    datatype = relationship("Code")
    changed_by_user = relationship("User")
