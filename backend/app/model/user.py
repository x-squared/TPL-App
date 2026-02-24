from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class User(Base):
    """Application user used for authentication, role assignment, and auditing."""

    __tablename__ = "USER"

    id = Column("ID", Integer, primary_key=True, index=True)
    ext_id = Column("EXT_ID", String, nullable=False, unique=True)
    name = Column("NAME", String, nullable=False)
    role_id = Column("ROLE", Integer, ForeignKey("CODE.ID"), nullable=True)

    role = relationship("Code", foreign_keys=[role_id])
    assigned_tasks = relationship("Task", foreign_keys="Task.assigned_to_id", back_populates="assigned_to")
    closed_tasks = relationship("Task", foreign_keys="Task.closed_by_id", back_populates="closed_by")
