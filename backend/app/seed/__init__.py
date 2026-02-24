from sqlalchemy.orm import Session

from ..models import Catalogue, Code, ContactInfo, MedicalValueTemplate, Patient, Task, TaskGroup, User


def sync_codes(db: Session) -> None:
    """Replace all CODE rows with the data defined in codes_data.py on every startup."""
    from .codes_data import ALL as code_records

    db.query(Code).delete()
    for entry in code_records:
        db.add(Code(**entry))
    db.commit()


def sync_catalogues(db: Session) -> None:
    """Replace all CATALOGUE rows with the data defined in catalogues_data.py on every startup."""
    from .catalogues_data import ALL as catalogue_records

    db.query(Catalogue).delete()
    for entry in catalogue_records:
        db.add(Catalogue(**entry))
    db.commit()


def sync_patients(db: Session) -> None:
    """Replace all PATIENT and CONTACT_INFO rows with seed data on every startup."""
    from .contact_infos_data import ALL as contact_records
    from .patients_data import ALL as patient_records

    db.query(ContactInfo).delete()
    db.query(Patient).delete()
    for entry in patient_records:
        db.add(Patient(**entry))
    db.flush()

    for entry in contact_records:
        raw = dict(entry)
        patient = db.query(Patient).filter(Patient.pid == raw.pop("patient_pid")).first()
        code = (
            db.query(Code)
            .filter(Code.type == raw.pop("code_type"), Code.key == raw.pop("code_key"))
            .first()
        )
        if patient and code:
            db.add(ContactInfo(patient_id=patient.id, type_id=code.id, **raw))
    db.commit()


def sync_medical_value_templates(db: Session) -> None:
    """Replace all MEDICAL_VALUE_TEMPLATE rows with seed data on every startup."""
    from .medical_values_template_data import ALL as mv_records

    db.query(MedicalValueTemplate).delete()
    for entry in mv_records:
        raw = dict(entry)
        datatype_key = raw.pop("datatype_key")
        code = (
            db.query(Code)
            .filter(Code.type == "DATATYPE", Code.key == datatype_key)
            .first()
        )
        if code:
            db.add(MedicalValueTemplate(datatype_id=code.id, **raw))
    db.commit()


def sync_users(db: Session) -> None:
    """Replace all USER rows with the data defined in users_data.py on every startup."""
    from .users_data import ALL as user_records

    db.query(User).delete()
    for entry in user_records:
        raw = dict(entry)
        role_key = raw.pop("role_key", "")
        role = (
            db.query(Code)
            .filter(Code.type == "ROLE", Code.key == role_key)
            .first()
        )
        db.add(User(role_id=role.id if role else None, **raw))
    db.commit()


def sync_tasks(db: Session) -> None:
    """Replace all TASK_GROUP and TASK rows with seed data on every startup."""
    from .tasks_data import TASK_GROUPS, TASKS

    db.query(Task).delete()
    db.query(TaskGroup).delete()
    db.flush()

    created_groups: dict[str, TaskGroup] = {}
    for entry in TASK_GROUPS:
        raw = dict(entry)
        seed_key = raw.pop("seed_key")
        patient_pid = raw.pop("patient_pid")
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

        task_group = TaskGroup(
            patient_id=patient.id,
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
