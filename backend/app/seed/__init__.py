from sqlalchemy.orm import Session
from typing import Any

from ..models import (
    Catalogue,
    Code,
    Colloqium,
    ColloqiumAgenda,
    ColloqiumType,
    ContactInfo,
    Episode,
    EpisodeOrgan,
    MedicalValueTemplate,
    MedicalValueGroup,
    Patient,
    Task,
    TaskGroup,
    TaskGroupTemplate,
    TaskTemplate,
    User,
)
from .loader import SeedJob, SeedRunner
from .profiles import resolve_seed_categories


def sync_codes(db: Session) -> None:
    """Replace all CODE rows with the core dataset definitions."""
    from .datasets.core.codes import RECORDS as code_records

    db.query(Code).delete()
    for entry in code_records:
        db.add(Code(**entry))
    db.commit()


def sync_catalogues(db: Session) -> None:
    """Replace all CATALOGUE rows with the core dataset definitions."""
    from .datasets.core.catalogues import RECORDS as catalogue_records

    db.query(Catalogue).delete()
    for entry in catalogue_records:
        db.add(Catalogue(**entry))
    db.commit()


def sync_patients(db: Session) -> None:
    """Replace all PATIENT and CONTACT_INFO rows with seed data on every startup."""
    from .datasets.sample.patient_cases import CONTACT_INFOS, EPISODES, PATIENTS

    db.query(EpisodeOrgan).delete()
    db.query(Episode).delete()
    db.query(ContactInfo).delete()
    db.query(Patient).delete()
    for entry in PATIENTS:
        db.add(Patient(**entry))
    db.flush()

    for entry in CONTACT_INFOS:
        raw = dict(entry)
        patient = db.query(Patient).filter(Patient.pid == raw.pop("patient_pid")).first()
        code = (
            db.query(Code)
            .filter(Code.type == raw.pop("code_type"), Code.key == raw.pop("code_key"))
            .first()
        )
        if patient and code:
            db.add(ContactInfo(patient_id=patient.id, type_id=code.id, **raw))

    for entry in EPISODES:
        raw = dict(entry)
        patient = db.query(Patient).filter(Patient.pid == raw.pop("patient_pid")).first()
        organ_keys = raw.pop("organ_keys", [])
        organ_ids: list[int] = []
        for organ_key in organ_keys:
            organ = db.query(Code).filter(Code.type == "ORGAN", Code.key == organ_key).first()
            if organ:
                organ_ids.append(organ.id)
        organ_ids = list(dict.fromkeys(organ_ids))
        status_key = raw.pop("status_key", None)
        status = (
            db.query(Code).filter(Code.type == "TPL_STATUS", Code.key == status_key).first()
            if status_key
            else None
        )
        if patient and organ_ids:
            episode = Episode(
                patient_id=patient.id,
                organ_id=organ_ids[0],
                status_id=status.id if status else None,
                **raw,
            )
            db.add(episode)
            db.flush()
            for organ_id in organ_ids:
                db.add(
                    EpisodeOrgan(
                        episode_id=episode.id,
                        organ_id=organ_id,
                        date_added=episode.start,
                        is_active=True,
                    )
                )
    db.commit()


def sync_medical_value_templates(db: Session) -> None:
    """Replace all MEDICAL_VALUE_TEMPLATE rows with seed data on every startup."""
    from .datasets.core.medical_value_templates import RECORDS as mv_records
    group_by_key = {
        row.key: row.id
        for row in db.query(MedicalValueGroup).all()
    }

    def infer_group_key(raw_entry: dict[str, Any]) -> str:
        explicit = raw_entry.get("medical_value_group_key")
        if isinstance(explicit, str) and explicit:
            return explicit
        name = str(raw_entry.get("name_default", "")).lower()
        cardio_tokens = ("cardio", "ekg", "ecg", "echo", "lvef", "nyha")
        if any(token in name for token in cardio_tokens):
            return "CARDIOLOGY"
        use_liver = bool(raw_entry.get("use_liver"))
        use_kidney = bool(raw_entry.get("use_kidney"))
        use_heart = bool(raw_entry.get("use_heart"))
        use_lung = bool(raw_entry.get("use_lung"))
        use_donor = bool(raw_entry.get("use_donor"))
        if use_donor and not (use_liver or use_kidney or use_heart or use_lung):
            return "DONOR"
        if not (use_liver and use_kidney and use_heart and use_lung and use_donor):
            return "ORGAN_SPECIFIC"
        return "GENERAL"

    db.query(MedicalValueTemplate).delete()
    for entry in mv_records:
        raw = dict(entry)
        datatype_key = raw.pop("datatype_key")
        group_key = infer_group_key(raw)
        group_id = group_by_key.get(group_key) or group_by_key.get("UNGROUPED")
        code = (
            db.query(Code)
            .filter(Code.type == "DATATYPE", Code.key == datatype_key)
            .first()
        )
        if code:
            db.add(MedicalValueTemplate(datatype_id=code.id, medical_value_group_id=group_id, **raw))
    db.commit()


def sync_medical_value_groups(db: Session) -> None:
    """Replace all MEDICAL_VALUE_GROUP rows with core group definitions."""
    from .datasets.core.medical_value_groups import RECORDS as group_records

    db.query(MedicalValueGroup).delete()
    for entry in group_records:
        db.add(MedicalValueGroup(**entry))
    db.commit()


def _save_user_entry(db: Session, entry: dict[str, Any]) -> None:
    raw = dict(entry)
    role_key = raw.pop("role_key", "")
    role = (
        db.query(Code)
        .filter(Code.type == "ROLE", Code.key == role_key)
        .first()
    )
    ext_id = raw.get("ext_id")
    if not ext_id:
        return
    existing = db.query(User).filter(User.ext_id == ext_id).first()
    if existing:
        existing.name = raw.get("name", existing.name)
        existing.role_id = role.id if role else None
        return
    db.add(User(role_id=role.id if role else None, **raw))


def sync_users_core(db: Session) -> None:
    """Load production-safe base users (e.g. SYSTEM)."""
    from .datasets.core.users import RECORDS as user_records

    for entry in user_records:
        _save_user_entry(db, entry)
    db.commit()


def sync_users_sample(db: Session) -> None:
    """Load demo users for non-production environments."""
    from .datasets.sample.users import RECORDS as user_records

    for entry in user_records:
        _save_user_entry(db, entry)
    db.commit()


def sync_users(db: Session) -> None:
    """Backward compatible full user seed load (core + sample)."""
    sync_users_core(db)
    sync_users_sample(db)


def sync_colloqiums(db: Session) -> None:
    """Replace all COLLOQIUM rows with sample seed data."""
    from .datasets.sample.colloqiums import RECORDS as colloqium_records

    db.query(ColloqiumAgenda).delete()
    db.query(Colloqium).delete()
    db.flush()

    created_types: dict[str, ColloqiumType] = {
        row.name: row
        for row in db.query(ColloqiumType).all()
    }

    for entry in colloqium_records:
        raw = dict(entry)
        type_name = raw.pop("type_name")
        colloqium_type = created_types.get(type_name)
        if not colloqium_type:
            continue
        db.add(Colloqium(colloqium_type_id=colloqium_type.id, **raw))

    db.commit()


def sync_colloqium_types_core(db: Session) -> None:
    """Load production-safe colloquium type definitions."""
    from .datasets.core.colloqium_types import RECORDS as colloqium_type_records

    db.query(ColloqiumAgenda).delete()
    db.query(Colloqium).delete()
    db.query(ColloqiumType).delete()
    db.flush()

    for entry in colloqium_type_records:
        raw = dict(entry)
        organ = db.query(Code).filter(Code.type == "ORGAN", Code.key == raw.pop("organ_key")).first()
        if not organ:
            continue
        item = ColloqiumType(organ_id=organ.id, **raw)
        db.add(item)
    db.commit()


def sync_tasks(db: Session) -> None:
    """Replace all TASK_GROUP and TASK rows with seed data on every startup."""
    from .datasets.sample.patient_cases import TASK_GROUPS, TASKS

    db.query(Task).delete()
    db.query(TaskGroup).delete()
    db.flush()

    created_groups: dict[str, TaskGroup] = {}
    for entry in TASK_GROUPS:
        raw = dict(entry)
        seed_key = raw.pop("seed_key")
        patient_pid = raw.pop("patient_pid")
        task_group_template_key = raw.pop("task_group_template_key", None)
        tpl_phase_key = raw.pop("tpl_phase_key", None)

        patient = db.query(Patient).filter(Patient.pid == patient_pid).first()
        if not patient:
            continue

        tpl_phase_id = None
        if tpl_phase_key:
            tpl_phase = (
                db.query(Code)
                .filter(Code.type == "TPL_PHASE", Code.key == tpl_phase_key)
                .first()
            )
            if not tpl_phase:
                continue
            tpl_phase_id = tpl_phase.id

        task_group_template_id = None
        if task_group_template_key:
            task_group_template = (
                db.query(TaskGroupTemplate)
                .filter(TaskGroupTemplate.key == task_group_template_key)
                .first()
            )
            if not task_group_template:
                continue
            task_group_template_id = task_group_template.id

        task_group = TaskGroup(
            patient_id=patient.id,
            task_group_template_id=task_group_template_id,
            tpl_phase_id=tpl_phase_id,
            **raw,
        )
        db.add(task_group)
        db.flush()
        created_groups[seed_key] = task_group

    for entry in TASKS:
        raw = dict(entry)
        task_group_seed_key = raw.pop("task_group_seed_key")
        priority_key = raw.pop("priority_key")
        status_key = raw.pop("status_key")
        assigned_to_ext_id = raw.pop("assigned_to_ext_id", None)
        closed_by_ext_id = raw.pop("closed_by_ext_id", None)

        task_group = created_groups.get(task_group_seed_key)
        if not task_group:
            continue

        priority = (
            db.query(Code)
            .filter(Code.type == "PRIORITY", Code.key == priority_key)
            .first()
        )
        status = (
            db.query(Code)
            .filter(Code.type == "TASK_STATUS", Code.key == status_key)
            .first()
        )
        if not priority or not status:
            continue

        assigned_to_id = None
        if assigned_to_ext_id:
            assigned_to = db.query(User).filter(User.ext_id == assigned_to_ext_id).first()
            assigned_to_id = assigned_to.id if assigned_to else None

        closed_by_id = None
        if closed_by_ext_id:
            closed_by = db.query(User).filter(User.ext_id == closed_by_ext_id).first()
            closed_by_id = closed_by.id if closed_by else None

        db.add(
            Task(
                task_group_id=task_group.id,
                priority_id=priority.id,
                status_id=status.id,
                assigned_to_id=assigned_to_id,
                closed_by_id=closed_by_id,
                **raw,
            )
        )

    db.commit()


def sync_task_templates(db: Session) -> None:
    """Replace all TASK_GROUP_TEMPLATE and TASK_TEMPLATE rows with seed data."""
    from .datasets.sample.task_templates import TASK_GROUP_TEMPLATES, TASK_TEMPLATES

    db.query(TaskTemplate).delete()
    db.query(TaskGroupTemplate).delete()
    db.flush()

    created_group_templates: dict[str, TaskGroupTemplate] = {}
    for entry in TASK_GROUP_TEMPLATES:
        raw = dict(entry)
        scope_key = raw.pop("scope_key")
        organ_key = raw.pop("organ_key", None)
        tpl_phase_key = raw.pop("tpl_phase_key", None)

        scope = db.query(Code).filter(Code.type == "TASK_SCOPE", Code.key == scope_key).first()
        if not scope:
            continue

        organ_id = None
        if organ_key:
            organ = db.query(Code).filter(Code.type == "ORGAN", Code.key == organ_key).first()
            if not organ:
                continue
            organ_id = organ.id

        tpl_phase_id = None
        if tpl_phase_key:
            tpl_phase = db.query(Code).filter(Code.type == "TPL_PHASE", Code.key == tpl_phase_key).first()
            if not tpl_phase:
                continue
            tpl_phase_id = tpl_phase.id

        key = raw["key"]
        template = TaskGroupTemplate(
            scope_id=scope.id,
            organ_id=organ_id,
            tpl_phase_id=tpl_phase_id,
            **raw,
        )
        db.add(template)
        db.flush()
        created_group_templates[key] = template

    for entry in TASK_TEMPLATES:
        raw = dict(entry)
        task_group_template_key = raw.pop("task_group_template_key")
        priority_key = raw.pop("priority_key")

        task_group_template = created_group_templates.get(task_group_template_key)
        if not task_group_template:
            continue

        priority = db.query(Code).filter(Code.type == "PRIORITY", Code.key == priority_key).first()
        if not priority:
            continue

        db.add(
            TaskTemplate(
                task_group_template_id=task_group_template.id,
                priority_id=priority.id,
                **raw,
            )
        )

    db.commit()


def get_seed_jobs() -> tuple[SeedJob, ...]:
    """Seed registry used by the profile-based seed runner."""
    return (
        SeedJob(
            key="core.codes",
            category="core",
            description="Load CODE reference data",
            loader=sync_codes,
        ),
        SeedJob(
            key="core.catalogues",
            category="core",
            description="Load CATALOGUE reference data",
            loader=sync_catalogues,
        ),
        SeedJob(
            key="core.users",
            category="core",
            description="Load core users",
            loader=sync_users_core,
        ),
        SeedJob(
            key="core.colloqium_types",
            category="core",
            description="Load colloquium type definitions",
            loader=sync_colloqium_types_core,
        ),
        SeedJob(
            key="core.medical_value_groups",
            category="core",
            description="Load medical value groups",
            loader=sync_medical_value_groups,
        ),
        SeedJob(
            key="core.medical_value_templates",
            category="core",
            description="Load medical value templates",
            loader=sync_medical_value_templates,
        ),
        SeedJob(
            key="sample.users",
            category="sample",
            description="Load demo users",
            loader=sync_users_sample,
        ),
        SeedJob(
            key="sample.task_templates",
            category="sample",
            description="Load demo task templates",
            loader=sync_task_templates,
        ),
        SeedJob(
            key="sample.colloqiums",
            category="sample",
            description="Load demo colloquiums",
            loader=sync_colloqiums,
        ),
        SeedJob(
            key="sample.patients",
            category="sample",
            description="Load demo patients and episodes",
            loader=sync_patients,
        ),
        SeedJob(
            key="sample.tasks",
            category="sample",
            description="Load demo tasks",
            loader=sync_tasks,
        ),
    )


def run_seed_profile(db: Session, app_env: str | None, seed_profile: str | None = None) -> dict[str, Any]:
    """
    Run registered seed jobs based on resolved environment/profile categories.

    Returns execution metadata for startup logging.
    """
    resolved_env, categories = resolve_seed_categories(app_env, seed_profile)
    runner = SeedRunner(get_seed_jobs())
    executed = runner.run(db, include_categories=categories)
    return {
        "environment": resolved_env,
        "categories": list(categories),
        "executed_jobs": executed,
    }
