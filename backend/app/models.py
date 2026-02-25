"""Compatibility facade for SQLAlchemy models.

Domain model definitions live under `backend/app/model/`.
This module re-exports them to keep existing imports stable.
"""

from .model import (
    Absence,
    Catalogue,
    Colloqium,
    ColloqiumAgenda,
    ColloqiumType,
    Coordination,
    CoordinationDonor,
    CoordinationEpisode,
    CoordinationOrganEffect,
    CoordinationProcurement,
    CoordinationProcurementHeart,
    CoordinationProcurementHeartValves,
    CoordinationProcurementIntestines,
    CoordinationProcurementIslets,
    CoordinationProcurementKidney,
    CoordinationProcurementLiver,
    CoordinationProcurementPancreas,
    CoordinationTimeLog,
    CoordinationOrigin,
    Code,
    ContactInfo,
    Diagnosis,
    Episode,
    Favorite,
    MedicalValue,
    MedicalValueTemplate,
    Patient,
    Task,
    TaskGroup,
    TaskGroupTemplate,
    TaskTemplate,
    User,
)
from .model.utils import apply_entity_metadata_defaults

# Apply default metadata once after all model classes are imported.
apply_entity_metadata_defaults()

__all__ = [
    "Code",
    "Catalogue",
    "ColloqiumType",
    "Colloqium",
    "ColloqiumAgenda",
    "Coordination",
    "CoordinationDonor",
    "CoordinationEpisode",
    "CoordinationOrganEffect",
    "CoordinationProcurement",
    "CoordinationProcurementHeart",
    "CoordinationProcurementHeartValves",
    "CoordinationProcurementIntestines",
    "CoordinationProcurementIslets",
    "CoordinationProcurementKidney",
    "CoordinationProcurementLiver",
    "CoordinationProcurementPancreas",
    "CoordinationTimeLog",
    "CoordinationOrigin",
    "User",
    "Patient",
    "Absence",
    "Diagnosis",
    "ContactInfo",
    "MedicalValueTemplate",
    "MedicalValue",
    "Episode",
    "Favorite",
    "TaskGroupTemplate",
    "TaskTemplate",
    "TaskGroup",
    "Task",
]




