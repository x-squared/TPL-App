from __future__ import annotations

from datetime import date

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ...enums import PriorityKey, TaskStatusKey
from ...models import Code, Task, TaskGroup, User
from ...schemas import TaskCreate, TaskUpdate


def _get_code_or_422(*, db: Session, code_id: int, code_type: str, field_name: str) -> Code:
    code = db.query(Code).filter(Code.id == code_id, Code.type == code_type).first()
    if not code:
        raise HTTPException(
            status_code=422,
            detail=f"{field_name} must reference CODE with type {code_type}",
        )
    return code


def _get_default_code_or_422(*, db: Session, code_type: str, code_key: str, field_name: str) -> Code:
    code = db.query(Code).filter(Code.type == code_type, Code.key == code_key).first()
    if not code:
        raise HTTPException(
            status_code=422,
            detail=f"default {field_name} code not found: {code_type}.{code_key}",
        )
    return code


def _get_task_group_or_422(*, db: Session, task_group_id: int) -> TaskGroup:
    tg = db.query(TaskGroup).filter(TaskGroup.id == task_group_id).first()
    if not tg:
        raise HTTPException(status_code=422, detail="task_group_id references unknown TASK_GROUP")
    return tg


def _get_user_or_422(*, db: Session, user_id: int, field_name: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=422, detail=f"{field_name} references unknown USER")
    return user


def _is_closed_status_key(status_key: str | None) -> bool:
    return status_key in {TaskStatusKey.COMPLETED.value, TaskStatusKey.CANCELLED.value}


def _is_task_group_closed(*, db: Session, task_group_id: int) -> bool:
    total_count = db.query(Task).filter(Task.task_group_id == task_group_id).count()
    open_count = db.query(Task).filter(
        Task.task_group_id == task_group_id,
        or_(
            Task.status_key.is_(None),
            ~Task.status_key.in_([TaskStatusKey.COMPLETED.value, TaskStatusKey.CANCELLED.value]),
        ),
    ).count()
    return total_count > 0 and open_count == 0


def _task_query(db: Session):
    return db.query(Task).options(
        joinedload(Task.priority),
        joinedload(Task.status),
        joinedload(Task.assigned_to),
        joinedload(Task.closed_by),
        joinedload(Task.changed_by_user),
    )


def list_tasks(*, task_group_id: int | None, status_key: list[str] | None, db: Session) -> list[Task]:
    query = _task_query(db)
    if task_group_id is not None:
        query = query.filter(Task.task_group_id == task_group_id)
    if status_key:
        normalized = [value.upper() for value in status_key]
        query = query.filter(Task.status_key.in_(normalized))
    return query.all()


def create_task(*, payload: TaskCreate, changed_by_id: int, db: Session) -> Task:
    task_group = _get_task_group_or_422(db=db, task_group_id=payload.task_group_id)
    if _is_task_group_closed(db=db, task_group_id=task_group.id):
        raise HTTPException(status_code=422, detail="Cannot add task to a completed/discarded task group")
    priority = (
        _get_code_or_422(db=db, code_id=payload.priority_id, code_type="PRIORITY", field_name="priority_id")
        if payload.priority_id is not None
        else _get_default_code_or_422(
            db=db,
            code_type="PRIORITY",
            code_key=PriorityKey.NORMAL.value,
            field_name="priority_id",
        )
    )
    status = (
        _get_code_or_422(db=db, code_id=payload.status_id, code_type="TASK_STATUS", field_name="status_id")
        if payload.status_id is not None
        else _get_default_code_or_422(
            db=db,
            code_type="TASK_STATUS",
            code_key=TaskStatusKey.PENDING.value,
            field_name="status_id",
        )
    )
    if payload.assigned_to_id is not None:
        _get_user_or_422(db=db, user_id=payload.assigned_to_id, field_name="assigned_to_id")
    if payload.closed_by_id is not None:
        _get_user_or_422(db=db, user_id=payload.closed_by_id, field_name="closed_by_id")
    closed_at = payload.closed_at
    closed_by_id = payload.closed_by_id
    if status.key in {TaskStatusKey.COMPLETED.value, TaskStatusKey.CANCELLED.value} and closed_at is None:
        closed_at = date.today()
    if status.key in {TaskStatusKey.COMPLETED.value, TaskStatusKey.CANCELLED.value} and closed_by_id is None:
        closed_by_id = changed_by_id
    if not _is_closed_status_key(status.key):
        closed_at = None
        closed_by_id = None
    if payload.until is None:
        raise HTTPException(status_code=422, detail="until is required")
    task = Task(
        task_group_id=payload.task_group_id,
        description=payload.description,
        priority_id=priority.id,
        priority_key=priority.key,
        assigned_to_id=payload.assigned_to_id,
        until=payload.until,
        status_id=status.id,
        status_key=status.key,
        closed_at=closed_at,
        closed_by_id=closed_by_id,
        comment=payload.comment,
        changed_by_id=changed_by_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_query(db).filter(Task.id == task.id).first()


def update_task(*, task_id: int, payload: TaskUpdate, changed_by_id: int, db: Session) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    data = payload.model_dump(exclude_unset=True)
    original_group_id = task.task_group_id
    if "task_group_id" in data:
        target_group = _get_task_group_or_422(db=db, task_group_id=data["task_group_id"])
        if data["task_group_id"] != original_group_id and _is_task_group_closed(db=db, task_group_id=target_group.id):
            raise HTTPException(status_code=422, detail="Cannot move task into a completed/discarded task group")
    if "assigned_to_id" in data and data["assigned_to_id"] is not None:
        _get_user_or_422(db=db, user_id=data["assigned_to_id"], field_name="assigned_to_id")
    if "closed_by_id" in data and data["closed_by_id"] is not None:
        _get_user_or_422(db=db, user_id=data["closed_by_id"], field_name="closed_by_id")
    if "until" in data and data["until"] is None:
        raise HTTPException(status_code=422, detail="until cannot be null")
    status_key = task.status_key or (task.status.key if task.status else None)
    if "status_id" in data and data["status_id"] is not None:
        status = _get_code_or_422(
            db=db,
            code_id=data["status_id"],
            code_type="TASK_STATUS",
            field_name="status_id",
        )
        status_key = status.key
        data["status_key"] = status.key
    if "priority_id" in data and data["priority_id"] is not None:
        priority = _get_code_or_422(db=db, code_id=data["priority_id"], code_type="PRIORITY", field_name="priority_id")
        data["priority_key"] = priority.key
    for key, value in data.items():
        setattr(task, key, value)
    if _is_closed_status_key(status_key) and task.closed_at is None:
        task.closed_at = date.today()
    if _is_closed_status_key(status_key) and task.closed_by_id is None:
        task.closed_by_id = changed_by_id
    if not _is_closed_status_key(status_key):
        task.closed_at = None
        task.closed_by_id = None
    task.changed_by_id = changed_by_id
    db.commit()
    return _task_query(db).filter(Task.id == task_id).first()


def delete_task(*, task_id: int, db: Session) -> None:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
