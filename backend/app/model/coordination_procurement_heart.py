from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class CoordinationProcurementHeart(Base):
    """Heart-specific procurement extension of the coordination core entity."""

    __tablename__ = "COORDINATION_PROCUREMENT_HEART"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the coordination procurement heart row.",
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
    cold_perfusion = Column(
        "COLD_PERFUSION",
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of cold perfusion.",
        info={"label": "Cold Perfusion"},
    )
    procurment_surgeon = Column(
        "PROCURMENT_SURGEON",
        String(64),
        default="",
        comment="Procurement surgeon name (max 64 characters).",
        info={"label": "Procurment Surgeon"},
    )
    nmp_used = Column(
        "NMP_USED",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether NMP was used.",
        info={"label": "NMP Used"},
    )
    evlp_used = Column(
        "EVLP_USED",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether EVLP was used.",
        info={"label": "EVLP Used"},
    )
    changed_by_id = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the coordination procurement heart row.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the coordination procurement heart row.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the coordination procurement heart row.",
        info={"label": "Updated At"},
    )

    coordination = relationship("Coordination", back_populates="procurement_heart")
    changed_by_user = relationship("User")
