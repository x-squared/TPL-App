from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class CoordinationProcurementKidney(Base):
    """Kidney-specific procurement extension of the coordination core entity."""

    __tablename__ = "COORDINATION_PROCUREMENT_KIDNEY"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the coordination procurement kidney row.",
        info={"label": "ID"},
    )
    coordination_id = Column(
        "COORDINATION_ID",
        Integer,
        ForeignKey("COORDINATION.ID"),
        nullable=False,
        unique=True,
        index=True,
        comment="1:1 reference to the coordination core row.",
        info={"label": "Coordination"},
    )
    procurement_surgeon_left = Column(
        "PROCUREMENT_SURGEON_LEFT",
        String(64),
        default="",
        comment="Left procurement surgeon name (max 64 characters).",
        info={"label": "Procurement Surgeon Left"},
    )
    procurement_surgeon_right = Column(
        "PROCUREMENT_SURGEON_RIGHT",
        String(64),
        default="",
        comment="Right procurement surgeon name (max 64 characters).",
        info={"label": "Procurement Surgeon Right"},
    )
    lifeport_right_used = Column(
        "LIFEPORT_RIGHT_USED",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether LifePort was used for right kidney.",
        info={"label": "Lifeport Right Used"},
    )
    lifeport_left_used = Column(
        "LIFEPORT_LEFT_USED",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether LifePort was used for left kidney.",
        info={"label": "Lifeport Left Used"},
    )
    ope_used = Column(
        "OPE_USED",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether OPE was used.",
        info={"label": "OPE Used"},
    )
    changed_by_id = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the coordination procurement kidney row.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the coordination procurement kidney row.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the coordination procurement kidney row.",
        info={"label": "Updated At"},
    )

    coordination = relationship("Coordination", back_populates="procurement_kidney")
    changed_by_user = relationship("User")
