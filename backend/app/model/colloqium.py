from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class ColloqiumType(Base):
    __tablename__ = "COLLOQIUM_TYPE"

    id = Column("ID", Integer, primary_key=True, index=True)
    name = Column("NAME", String(64), nullable=False)
    organ_id = Column("ORGAN_ID", Integer, ForeignKey("CODE.ID"), nullable=False)
    participants = Column("PARTICIPANTS", String(1024), default="")
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    organ = relationship("Code", foreign_keys=[organ_id])
    changed_by_user = relationship("User", foreign_keys=[changed_by])
    colloqiums = relationship("Colloqium", back_populates="colloqium_type")


class Colloqium(Base):
    __tablename__ = "COLLOQIUM"

    id = Column("ID", Integer, primary_key=True, index=True)
    colloqium_type_id = Column("TYPE_ID", Integer, ForeignKey("COLLOQIUM_TYPE.ID"), nullable=False, index=True)
    date = Column("DATE", Date, nullable=False)
    participants = Column("PARTICIPANTS", String(1024), default="")
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    colloqium_type = relationship("ColloqiumType", back_populates="colloqiums")
    changed_by_user = relationship("User", foreign_keys=[changed_by])
    agendas = relationship("ColloqiumAgenda", back_populates="colloqium", cascade="all, delete-orphan")


class ColloqiumAgenda(Base):
    __tablename__ = "COLLOQIUM_AGENDA"

    id = Column("ID", Integer, primary_key=True, index=True)
    colloqium_id = Column("COLLOQIUM_ID", Integer, ForeignKey("COLLOQIUM.ID"), nullable=False, index=True)
    episode_id = Column("EPISODE_ID", Integer, ForeignKey("EPISODE.ID"), nullable=False, index=True)
    presented_by = Column("PRESENTED_BY", String(64), default="")
    decision = Column("DECISION", String(1024), default="")
    comment = Column("COMMENT", String(1024), default="")
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    colloqium = relationship("Colloqium", back_populates="agendas")
    episode = relationship("Episode")
    changed_by_user = relationship("User", foreign_keys=[changed_by])
