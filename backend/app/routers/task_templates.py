from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Code, TaskGroupTemplate, TaskTemplate, User
from ..schemas import TaskTemplateCreate, TaskTemplateResponse, TaskTemplateUpdate

router = APIRouter(prefix="/task-templates", tags=["task-templates"])


def _get_code_or_422(*, db: Session, code_id: int, code_type: str, field_name: str) -> Code:
    code = db.query(Code).filter(Code.id == code_id, Code.type == code_type).first()
    if not code:
        raise HTTPException(status_code=422, detail=f"{field_name} must reference CODE with type {code_type}")
    return code


def _get_default_code_or_422(*, db: Session, code_type: str, code_key: str, field_name: str) -> Code:
    code = db.query(Code).filter(Code.type == code_type, Code.key == code_key).first()
    if not code:
        raise HTTPException(status_code=422, detail=f"default {field_name} code not found: {code_type}.{code_key}")
    return code


def _get_task_group_template_or_422(*, db: Session, task_group_template_id: int) -> TaskGroupTemplate:
    template = db.query(TaskGroupTemplate).filter(TaskGroupTemplate.id == task_group_template_id).first()
    if not template:
        raise HTTPException(status_code=422, detail="task_group_template_id references unknown TASK_GROUP_TEMPLATE")
    return template


@router.get("/", response_model=list[TaskTemplateResponse])
def list_task_templates(
    task_group_template_id: int | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(TaskTemplate).options(
        joinedload(TaskTemplate.task_group_template),
        joinedload(TaskTemplate.priority),
        joinedload(TaskTemplate.changed_by_user),
    )
    if task_group_template_id is not None:
        query = query.filter(TaskTemplate.task_group_template_id == task_group_template_id)
    if is_active is not None:
        query = query.filter(TaskTemplate.is_active == is_active)
    return query.order_by(TaskTemplate.sort_pos.asc(), TaskTemplate.id.asc()).all()


@router.post("/", response_model=TaskTemplateResponse, status_code=201)
def create_task_template(
    payload: TaskTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_task_group_template_or_422(db=db, task_group_template_id=payload.task_group_template_id)
    priority = (
        _get_code_or_422(db=db, code_id=payload.priority_id, code_type="PRIORITY", field_name="priority_id")
        if payload.priority_id is not None
        else _get_default_code_or_422(db=db, code_type="PRIORITY", code_key="NORMAL", field_name="priority_id")
    )
    template = TaskTemplate(
        task_group_template_id=payload.task_group_template_id,
        description=payload.description,
        priority_id=priority.id,
        due_days_default=payload.due_days_default,
        is_active=payload.is_active,
        sort_pos=payload.sort_pos,
        changed_by=current_user.id,
    )
    db.add(template)
    db.commit()
    return (
        db.query(TaskTemplate)
        .options(
            joinedload(TaskTemplate.task_group_template),
            joinedload(TaskTemplate.priority),
            joinedload(TaskTemplate.changed_by_user),
        )
        .filter(TaskTemplate.id == template.id)
        .first()
    )


@router.patch("/{task_template_id}", response_model=TaskTemplateResponse)
def update_task_template(
    task_template_id: int,
    payload: TaskTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.query(TaskTemplate).filter(TaskTemplate.id == task_template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Task template not found")
    data = payload.model_dump(exclude_unset=True)
    if "task_group_template_id" in data:
        _get_task_group_template_or_422(db=db, task_group_template_id=data["task_group_template_id"])
    if "priority_id" in data and data["priority_id"] is not None:
        _get_code_or_422(db=db, code_id=data["priority_id"], code_type="PRIORITY", field_name="priority_id")
    for key, value in data.items():
        setattr(template, key, value)
    template.changed_by = current_user.id
    db.commit()
    return (
        db.query(TaskTemplate)
        .options(
            joinedload(TaskTemplate.task_group_template),
            joinedload(TaskTemplate.priority),
            joinedload(TaskTemplate.changed_by_user),
        )
        .filter(TaskTemplate.id == task_template_id)
        .first()
    )


@router.delete("/{task_template_id}", status_code=204)
def delete_task_template(
    task_template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.query(TaskTemplate).filter(TaskTemplate.id == task_template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Task template not found")
    db.delete(template)
    db.commit()
