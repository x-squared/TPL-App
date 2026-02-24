from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Code, Task, TaskGroup, User
from ..schemas import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


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


@router.get("/", response_model=list[TaskResponse])
def list_tasks(
    task_group_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Task).options(
        joinedload(Task.priority),
        joinedload(Task.status),
        joinedload(Task.assigned_to),
        joinedload(Task.closed_by),
        joinedload(Task.changed_by_user),
    )
    if task_group_id is not None:
        query = query.filter(Task.task_group_id == task_group_id)
    return query.all()


@router.post("/", response_model=TaskResponse, status_code=201)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_task_group_or_422(db=db, task_group_id=payload.task_group_id)
    priority = (
        _get_code_or_422(db=db, code_id=payload.priority_id, code_type="PRIORITY", field_name="priority_id")
        if payload.priority_id is not None
        else _get_default_code_or_422(db=db, code_type="PRIORITY", code_key="NORMAL", field_name="priority_id")
    )
    status = (
        _get_code_or_422(db=db, code_id=payload.status_id, code_type="TASK_STATUS", field_name="status_id")
        if payload.status_id is not None
        else _get_default_code_or_422(db=db, code_type="TASK_STATUS", code_key="PENDING", field_name="status_id")
    )
    if payload.assigned_to_id is not None:
        _get_user_or_422(db=db, user_id=payload.assigned_to_id, field_name="assigned_to_id")
    if payload.closed_by_id is not None:
        _get_user_or_422(db=db, user_id=payload.closed_by_id, field_name="closed_by_id")
    closed_at = payload.closed_at
    closed_by_id = payload.closed_by_id
    if status.key in {"COMPLETED", "CANCELLED"} and closed_at is None:
        closed_at = date.today()
    if status.key in {"COMPLETED", "CANCELLED"} and closed_by_id is None:
        closed_by_id = current_user.id
    task = Task(
        task_group_id=payload.task_group_id,
        description=payload.description,
        priority_id=priority.id,
        must=payload.must,
        assigned_to_id=payload.assigned_to_id,
        until=payload.until,
        status_id=status.id,
        closed_at=closed_at,
        closed_by_id=closed_by_id,
        comment=payload.comment,
        changed_by=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return (
        db.query(Task)
        .options(
            joinedload(Task.priority),
            joinedload(Task.status),
            joinedload(Task.assigned_to),
            joinedload(Task.closed_by),
            joinedload(Task.changed_by_user),
        )
        .filter(Task.id == task.id)
        .first()
    )


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    data = payload.model_dump(exclude_unset=True)
    if "task_group_id" in data:
        _get_task_group_or_422(db=db, task_group_id=data["task_group_id"])
    if "assigned_to_id" in data and data["assigned_to_id"] is not None:
        _get_user_or_422(db=db, user_id=data["assigned_to_id"], field_name="assigned_to_id")
    if "closed_by_id" in data and data["closed_by_id"] is not None:
        _get_user_or_422(db=db, user_id=data["closed_by_id"], field_name="closed_by_id")
    if "priority_id" in data and data["priority_id"] is not None:
        _get_code_or_422(db=db, code_id=data["priority_id"], code_type="PRIORITY", field_name="priority_id")
    status_key = None
    if "status_id" in data and data["status_id"] is not None:
        status_key = _get_code_or_422(
            db=db,
            code_id=data["status_id"],
            code_type="TASK_STATUS",
            field_name="status_id",
        ).key
    for key, value in data.items():
        setattr(task, key, value)
    if status_key in {"COMPLETED", "CANCELLED"} and task.closed_at is None:
        task.closed_at = date.today()
    if status_key in {"COMPLETED", "CANCELLED"} and task.closed_by_id is None:
        task.closed_by_id = current_user.id
    task.changed_by = current_user.id
    db.commit()
    return (
        db.query(Task)
        .options(
            joinedload(Task.priority),
            joinedload(Task.status),
            joinedload(Task.assigned_to),
            joinedload(Task.closed_by),
            joinedload(Task.changed_by_user),
        )
        .filter(Task.id == task_id)
        .first()
    )


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
