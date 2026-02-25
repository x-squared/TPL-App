from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class Episode(Base):
    """Patient episode covering evaluation, listing, transplantation and follow-up."""

    __tablename__ = "EPISODE"

    id = Column(
        "ID",
        Integer,
        primary_key=True,
        index=True,
        comment="Technical primary key of the episode.",
        info={"label": "ID"},
    )
    patient_id = Column(
        "PATIENT_ID",
        Integer,
        ForeignKey("PATIENT.ID"),
        nullable=False,
        index=True,
        comment="Patient reference owning this episode.",
        info={"label": "Patient"},
    )
    organ_id = Column(
        "ORGAN_ID",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=False,
        comment="Organ reference (`CODE.ORGAN`) for this episode.",
        info={"label": "Episode Organ"},
    )
    start = Column(
        "START",
        Date,
        nullable=True,
        comment="Start date of the episode.",
        info={"label": "Start"},
    )
    end = Column(
        "END",
        Date,
        nullable=True,
        comment="End date of the episode.",
        info={"label": "End"},
    )
    fall_nr = Column(
        "FALL_NR",
        String(24),
        default="",
        comment="Administrative case number of the episode.",
        info={"label": "Fall Nr."},
    )
    status_id = Column(
        "STATUS_ID",
        Integer,
        ForeignKey("CODE.ID"),
        nullable=True,
        comment="Episode status reference (`CODE.EPISODE_STATUS`).",
        info={"label": "Episode Status"},
    )
    closed = Column(
        "CLOSED",
        Boolean,
        default=False,
        comment="Whether the episode is currently closed.",
        info={"label": "Closed"},
    )
    comment = Column(
        "COMMENT",
        String(1024),
        default="",
        comment="General free-text comment for the episode.",
        info={"label": "Comment"},
    )
    cave = Column(
        "CAVE",
        String(512),
        default="",
        comment="Safety/caveat notes related to the episode.",
        info={"label": "Cave"},
    )
    eval_start = Column(
        "EVAL_START",
        Date,
        nullable=True,
        comment="Start date of evaluation phase.",
        info={"label": "Eval Start"},
    )
    eval_end = Column(
        "EVAL_END",
        Date,
        nullable=True,
        comment="End date of evaluation phase.",
        info={"label": "Eval End"},
    )
    eval_assigned_to = Column(
        "EVAL_ASSIGNED_TO",
        String,
        default="",
        comment="Person assigned to evaluation.",
        info={"label": "Eval Assigned To"},
    )
    eval_stat = Column(
        "EVAL_STAT",
        String,
        default="",
        comment="Evaluation status text value.",
        info={"label": "Eval Stat"},
    )
    eval_register_date = Column(
        "EVAL_REGISTER_DATE",
        Date,
        nullable=True,
        comment="Date the evaluation was registered.",
        info={"label": "Eval Register Date"},
    )
    eval_excluded = Column(
        "EVAL_EXCLUDED",
        Boolean,
        default=False,
        comment="Whether the patient was excluded during evaluation.",
        info={"label": "Eval Excluded"},
    )
    eval_non_list_sent = Column(
        "EVAL_NON_LIST_SENT",
        Date,
        nullable=True,
        comment="Date the non-listing message was sent.",
        info={"label": "Eval Non List Sent"},
    )
    list_start = Column(
        "LIST_START",
        Date,
        nullable=True,
        comment="Start date of listing phase.",
        info={"label": "List Start"},
    )
    list_end = Column(
        "LIST_END",
        Date,
        nullable=True,
        comment="End date of listing phase.",
        info={"label": "List End"},
    )
    list_rs_nr = Column(
        "LIST_RS_NR",
        String(12),
        default="",
        comment="Listing registry number.",
        info={"label": "List RS Nr."},
    )
    list_reason_delist = Column(
        "LIST_REASON_DELIST",
        String,
        default="",
        comment="Reason code/text for delisting.",
        info={"label": "List Reason Delist"},
    )
    list_expl_delist = Column(
        "LIST_EXPL_DELIST",
        String(1024),
        default="",
        comment="Detailed explanation of delisting.",
        info={"label": "List Expl Delist"},
    )
    list_delist_sent = Column(
        "LIST_DELIST_SENT",
        Date,
        nullable=True,
        comment="Date the delisting communication was sent.",
        info={"label": "List Delist Sent"},
    )
    tpl_date = Column(
        "TPL_DATE",
        Date,
        nullable=True,
        comment="Transplantation date for the episode.",
        info={"label": "TPL Date"},
    )
    fup_recipient_card_done = Column(
        "FUP_RECIPIENT_CARD_DONE",
        Boolean,
        default=False,
        comment="Whether follow-up recipient card was completed.",
        info={"label": "FUP Recipient Card Done"},
    )
    fup_recipient_card_date = Column(
        "FUP_RECIPIENT_CARD_DATE",
        Date,
        nullable=True,
        comment="Date the follow-up recipient card was completed.",
        info={"label": "FUP Recipient Card Date"},
    )
    changed_by_id = Column(
        "CHANGED_BY",
        Integer,
        ForeignKey("USER.ID"),
        nullable=True,
        comment="Last user who changed the episode.",
        info={"label": "Changed By"},
    )
    created_at = Column(
        "CREATED_AT",
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation timestamp of the episode row.",
        info={"label": "Created At"},
    )
    updated_at = Column(
        "UPDATED_AT",
        DateTime(timezone=True),
        onupdate=func.now(),
        comment="Last update timestamp of the episode row.",
        info={"label": "Updated At"},
    )

    patient = relationship("Patient", back_populates="episodes")
    organ = relationship("Code", foreign_keys=[organ_id])
    status = relationship("Code", foreign_keys=[status_id])
    changed_by_user = relationship("User")
    coordination_episodes = relationship("CoordinationEpisode", back_populates="episode")
    task_groups = relationship("TaskGroup", back_populates="episode")
