from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class CoordinationProcurementLiver(Base):
    """Liver-specific procurement extension of the coordination core entity."""

    __tablename__ = "COORDINATION_PROCUREMENT_LIVER"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the coordination procurement liver row.",
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
    cold_perfusion_abdominal = Column(
        "COLD_PERFUSION_ABDOMINAL",
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of abdominal cold perfusion.",
        info={"label": "Cold Perfusion Abdominal"},
    )
    procurement_surgeo = Column(
        "PROCUREMENT_SURGEO",
        String(64),
        default="",
        comment="Procurement surgeon name (max 64 characters).",
        info={"label": "Procurement Surgeo"},
    )
    nmp_used = Column(
        "NMP_USED",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether NMP was used.",
        info={"label": "NMP Used"},
    )
    hope_used = Column(
        "HOPE_USED",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether HOPE was used.",
        info={"label": "HOPE Used"},
    )
    changed_by_id = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the coordination procurement liver row.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the coordination procurement liver row.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the coordination procurement liver row.",
        info={"label": "Updated At"},
    )

    coordination = relationship("Coordination", back_populates="procurement_liver")
    changed_by_user = relationship("User")
