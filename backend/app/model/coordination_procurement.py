from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class CoordinationProcurement(Base):
    """Procurement-specific 1:1 extension of the coordination core entity."""

    __tablename__ = "COORDINATION_PROCUREMENT"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the coordination procurement row.",
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
    time_of_death = Column(
        "TIME_OF_DEATH",
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp of donor death.",
        info={"label": "Time Of Death"},
    )
    moe_performed = Column(
        "MOE_PERFORMED",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether MOE was performed.",
        info={"label": "MOE Performed"},
    )
    moe_time = Column(
        "MOE_TIME",
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when MOE was performed.",
        info={"label": "MOE Time"},
    )
    nrp_abdominal_done = Column(
        "NRP_ABDOMINAL_DONE",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether abdominal NRP was performed.",
        info={"label": "NRP Abdominal Done"},
    )
    nrp_thoracic_done = Column(
        "NRP_THORACIC_DONE",
        Boolean,
        nullable=False,
        default=False,
        comment="Whether thoracic NRP was performed.",
        info={"label": "NRP Thoracic Done"},
    )
    nrp_time = Column(
        "NRP_TIME",
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when NRP was performed.",
        info={"label": "NRP Time"},
    )
    changed_by_id = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the coordination procurement row.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the coordination procurement row.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the coordination procurement row.",
        info={"label": "Updated At"},
    )

    coordination = relationship("Coordination", back_populates="procurement")
    changed_by_user = relationship("User")
