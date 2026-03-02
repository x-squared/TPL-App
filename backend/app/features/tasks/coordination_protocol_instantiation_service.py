from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session, joinedload

from ...enums import PriorityKey, TaskKindKey, TaskScopeKey, TaskStatusKey
from ...models import Code, CoordinationEpisode, Task, TaskGroup, TaskGroupTemplate, TaskTemplate


def _get_default_code(db: Session, *, code_type: str, code_key: str) -> Code | None:
    return db.query(Code).filter(Code.type == code_type, Code.key == code_key).first()


def ensure_coordination_protocol_task_groups(*, coordination_id: int, changed_by_id: int, db: Session) -> int:
    episodes = (
        db.query(CoordinationEpisode)
        .options(joinedload(CoordinationEpisode.episode))
        .filter(CoordinationEpisode.coordination_id == coordination_id)
        .order_by(CoordinationEpisode.id.asc())
        .all()
    )
    if not episodes:
        return 0

    by_organ_id: dict[int, CoordinationEpisode] = {}
    for entry in episodes:
        if entry.organ_id not in by_organ_id:
            by_organ_id[entry.organ_id] = entry
    if not by_organ_id:
        return 0

    templates = (
        db.query(TaskGroupTemplate)
        .options(
            joinedload(TaskGroupTemplate.scope),
            joinedload(TaskGroupTemplate.task_templates).joinedload(TaskTemplate.priority),
        )
        .filter(TaskGroupTemplate.is_active.is_(True))
        .all()
    )
    protocol_templates = [
        item
        for item in templates
        if (item.scope_key or (item.scope.key if item.scope else None)) == TaskScopeKey.COORDINATION_PROTOCOL.value
    ]
    if not protocol_templates:
        return 0

    pending_status = _get_default_code(db, code_type="TASK_STATUS", code_key=TaskStatusKey.PENDING.value)
    default_priority = _get_default_code(db, code_type="PRIORITY", code_key=PriorityKey.NORMAL.value)
    if pending_status is None or default_priority is None:
        return 0

    created_group_count = 0
    now_utc = datetime.now(timezone.utc)
    for organ_id, coordination_episode in by_organ_id.items():
        episode = coordination_episode.episode
        if episode is None:
            continue
        for template in protocol_templates:
            if template.organ_id is not None and template.organ_id != organ_id:
                continue
            existing = (
                db.query(TaskGroup)
                .filter(
                    TaskGroup.coordination_id == coordination_id,
                    TaskGroup.organ_id == organ_id,
                    TaskGroup.task_group_template_id == template.id,
                )
                .first()
            )
            if existing:
                continue

            task_group = TaskGroup(
                patient_id=episode.patient_id,
                task_group_template_id=template.id,
                name=template.name,
                episode_id=episode.id,
                colloqium_agenda_id=None,
                coordination_id=coordination_id,
                organ_id=organ_id,
                tpl_phase_id=template.tpl_phase_id,
                changed_by_id=changed_by_id,
            )
            db.add(task_group)
            db.flush()
            created_group_count += 1

            active_templates = sorted(
                [item for item in template.task_templates if item.is_active],
                key=lambda item: (item.sort_pos, item.id),
            )
            for task_template in active_templates:
                until = now_utc
                if task_template.offset_minutes_default is not None:
                    until = now_utc + timedelta(minutes=task_template.offset_minutes_default)
                priority = task_template.priority or default_priority
                db.add(
                    Task(
                        task_group_id=task_group.id,
                        description=task_template.description,
                        kind_key=task_template.kind_key or TaskKindKey.TASK.value,
                        priority_id=priority.id,
                        priority_key=priority.key,
                        assigned_to_id=None,
                        until=until,
                        status_id=pending_status.id,
                        status_key=pending_status.key,
                        closed_at=None,
                        closed_by_id=None,
                        comment="",
                        changed_by_id=changed_by_id,
                    )
                )

    if created_group_count > 0:
        db.commit()
    return created_group_count
