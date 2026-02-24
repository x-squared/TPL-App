from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class Episode(Base):
    """Patient episode covering evaluation, listing, transplantation and follow-up."""

    __tablename__ = "EPISODE"

    id = Column("ID", Integer, primary_key=True, index=True)
    patient_id = Column("PATIENT_ID", Integer, ForeignKey("PATIENT.ID"), nullable=False, index=True)
    organ_id = Column("ORGAN_ID", Integer, ForeignKey("CODE.ID"), nullable=False)
    start = Column("START", Date, nullable=True)
    end = Column("END", Date, nullable=True)
    fall_nr = Column("FALL_NR", String(24), default="")
    status_id = Column("STATUS_ID", Integer, ForeignKey("CODE.ID"), nullable=True)
    closed = Column("CLOSED", Boolean, default=False)
    comment = Column("COMMENT", String(1024), default="")
    cave = Column("CAVE", String(512), default="")
    eval_start = Column("EVAL_START", Date, nullable=True)
    eval_end = Column("EVAL_END", Date, nullable=True)
    eval_assigned_to = Column("EVAL_ASSIGNED_TO", String, default="")
    eval_stat = Column("EVAL_STAT", String, default="")
    eval_register_date = Column("EVAL_REGISTER_DATE", Date, nullable=True)
    eval_excluded = Column("EVAL_EXCLUDED", Boolean, default=False)
    eval_non_list_sent = Column("EVAL_NON_LIST_SENT", Date, nullable=True)
    list_start = Column("LIST_START", Date, nullable=True)
    list_end = Column("LIST_END", Date, nullable=True)
    list_rs_nr = Column("LIST_RS_NR", String(12), default="")
    list_reason_delist = Column("LIST_REASON_DELIST", String, default="")
    list_expl_delist = Column("LIST_EXPL_DELIST", String(1024), default="")
    list_delist_sent = Column("LIST_DELIST_SENT", Date, nullable=True)
    tpl_date = Column("TPL_DATE", Date, nullable=True)
    fup_recipient_card_done = Column("FUP_RECIPIENT_CARD_DONE", Boolean, default=False)
    fup_recipient_card_date = Column("FUP_RECIPIENT_CARD_DATE", Date, nullable=True)
    changed_by = Column("CHANGED_BY", Integer, ForeignKey("USER.ID"), nullable=True)
    created_at = Column("CREATED_AT", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("UPDATED_AT", DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="episodes")
    organ = relationship("Code", foreign_keys=[organ_id])
    status = relationship("Code", foreign_keys=[status_id])
    changed_by_user = relationship("User")
    task_groups = relationship("TaskGroup", back_populates="episode")
