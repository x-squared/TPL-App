from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class CoordinationProcurementPancreas(Base):
    """Pancreas-specific procurement extension of the coordination core entity."""

    __tablename__ = "COORDINATION_PROCUREMENT_PANCREAS"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the coordination procurement pancreas row.",
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
    procurement_surgeon = Column(
        "PROCUREMENT_SURGEON",
        String(64),
        default="",
        comment="Procurement surgeon name (max 64 characters).",
        info={"label": "Procurement Surgeon"},
    )
    changed_by_id = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the coordination procurement pancreas row.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the coordination procurement pancreas row.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the coordination procurement pancreas row.",
        info={"label": "Updated At"},
    )

    coordination = relationship("Coordination", back_populates="procurement_pancreas")
    changed_by_user = relationship("User")
