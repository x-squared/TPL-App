from sqlalchemy.orm import Session

from ....models import Code, Patient, Task, TaskGroup, TaskGroupTemplate, User


def sync_tasks(db: Session) -> None:
    """Replace all TASK_GROUP and TASK rows with seed data on every startup."""
    from ...datasets.sample.patient_cases import TASK_GROUPS, TASKS

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
