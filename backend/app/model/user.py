from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class User(Base):
    """Application user used for authentication, role assignment, and auditing."""

    __tablename__ = "USER"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the user.",
        info={"label": "ID"},
    )
    ext_id = Column(
        "EXT_ID",
        String,
        nullable=False,
        unique=True,
        comment="External identity of the user used for login mapping.",
        info={"label": "External ID"},
    )
    name = Column(
        "NAME",
        String,
        nullable=False,
        comment="Display name of the user.",
        info={"label": "Name"},
    )
    role_id = Column(
        "ROLE",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=True,
        comment="Assigned role code (`CODE.ROLE`) of the user.",
        info={"label": "User Role"},
    )

    role = relationship("Code", foreign_keys=[role_id])
    assigned_tasks = relationship("Task", foreign_keys="Task.assigned_to_id", back_populates="assigned_to")
    closed_tasks = relationship("Task", foreign_keys="Task.closed_by_id", back_populates="closed_by")
