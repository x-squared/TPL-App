from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Code, Episode, Patient, Task, TaskGroup, TaskGroupTemplate, User
from ..schemas import (
    TaskGroupResponse,
    TaskGroupTemplateCreate,
    TaskGroupTemplateInstantiateRequest,
    TaskGroupTemplateResponse,
    TaskGroupTemplateUpdate,
)

router = APIRouter(prefix="/task-group-templates", tags=["task-group-templates"])


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


def _validate_template_links(
    *,
    db: Session,
    scope_id: int,
    organ_id: int | None,
    tpl_phase_id: int | None,
) -> None:
    _get_code_or_422(db=db, code_id=scope_id, code_type="TASK_SCOPE", field_name="scope_id")
    if organ_id is not None:
        _get_code_or_422(db=db, code_id=organ_id, code_type="ORGAN", field_name="organ_id")
    if tpl_phase_id is not None:
        _get_code_or_422(db=db, code_id=tpl_phase_id, code_type="TPL_PHASE", field_name="tpl_phase_id")


@router.get("/", response_model=list[TaskGroupTemplateResponse])
def list_task_group_templates(
    is_active: bool | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(TaskGroupTemplate).options(
        joinedload(TaskGroupTemplate.scope),
        joinedload(TaskGroupTemplate.organ),
        joinedload(TaskGroupTemplate.tpl_phase),
        joinedload(TaskGroupTemplate.changed_by_user),
    )
    if is_active is not None:
        query = query.filter(TaskGroupTemplate.is_active == is_active)
    return query.order_by(TaskGroupTemplate.sort_pos.asc(), TaskGroupTemplate.id.asc()).all()


@router.post("/", response_model=TaskGroupTemplateResponse, status_code=201)
def create_task_group_template(
    payload: TaskGroupTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_template_links(
        db=db,
        scope_id=payload.scope_id,
        organ_id=payload.organ_id,
        tpl_phase_id=payload.tpl_phase_id,
    )
    existing = db.query(TaskGroupTemplate).filter(TaskGroupTemplate.key == payload.key).first()
    if existing:
        raise HTTPException(status_code=422, detail="key already exists")
    template = TaskGroupTemplate(**payload.model_dump(), changed_by=current_user.id)
    db.add(template)
    db.commit()
    return (
        db.query(TaskGroupTemplate)
        .options(
            joinedload(TaskGroupTemplate.scope),
            joinedload(TaskGroupTemplate.organ),
            joinedload(TaskGroupTemplate.tpl_phase),
            joinedload(TaskGroupTemplate.changed_by_user),
        )
        .filter(TaskGroupTemplate.id == template.id)
        .first()
    )


@router.patch("/{template_id}", response_model=TaskGroupTemplateResponse)
def update_task_group_template(
    template_id: int,
    payload: TaskGroupTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.query(TaskGroupTemplate).filter(TaskGroupTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Task group template not found")
    data = payload.model_dump(exclude_unset=True)
    if "key" in data and data["key"] != template.key:
        existing = db.query(TaskGroupTemplate).filter(TaskGroupTemplate.key == data["key"]).first()
        if existing:
            raise HTTPException(status_code=422, detail="key already exists")
    scope_id = data.get("scope_id", template.scope_id)
    organ_id = data.get("organ_id", template.organ_id)
    tpl_phase_id = data.get("tpl_phase_id", template.tpl_phase_id)
    _validate_template_links(db=db, scope_id=scope_id, organ_id=organ_id, tpl_phase_id=tpl_phase_id)
    for key, value in data.items():
        setattr(template, key, value)
    template.changed_by = current_user.id
    db.commit()
    return (
        db.query(TaskGroupTemplate)
        .options(
            joinedload(TaskGroupTemplate.scope),
            joinedload(TaskGroupTemplate.organ),
            joinedload(TaskGroupTemplate.tpl_phase),
            joinedload(TaskGroupTemplate.changed_by_user),
        )
        .filter(TaskGroupTemplate.id == template_id)
        .first()
    )


@router.delete("/{template_id}", status_code=204)
def delete_task_group_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.query(TaskGroupTemplate).filter(TaskGroupTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Task group template not found")
    db.delete(template)
    db.commit()


@router.post("/{template_id}/instantiate", response_model=TaskGroupResponse, status_code=201)
def instantiate_task_group_template(
    template_id: int,
    payload: TaskGroupTemplateInstantiateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = (
        db.query(TaskGroupTemplate)
        .options(
            joinedload(TaskGroupTemplate.scope),
            joinedload(TaskGroupTemplate.organ),
            joinedload(TaskGroupTemplate.tpl_phase),
            joinedload(TaskGroupTemplate.task_templates),
        )
        .filter(TaskGroupTemplate.id == template_id)
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Task group template not found")
    if not template.is_active:
        raise HTTPException(status_code=422, detail="Template is inactive")

    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    episode = None
    if payload.episode_id is not None:
        episode = db.query(Episode).filter(Episode.id == payload.episode_id).first()
        if not episode:
            raise HTTPException(status_code=404, detail="Episode not found")
        if episode.patient_id != payload.patient_id:
            raise HTTPException(status_code=422, detail="episode_id must belong to patient_id")

    scope_key = template.scope.key if template.scope else None
    if scope_key == "EPISODE" and episode is None:
        raise HTTPException(status_code=422, detail="episode_id is required for templates with TASK_SCOPE.EPISODE")

    if template.organ_id is not None:
        if episode is None:
            raise HTTPException(status_code=422, detail="episode_id is required when template has organ_id")
        if episode.organ_id != template.organ_id:
            raise HTTPException(status_code=422, detail="episode organ must match template organ_id")

    effective_tpl_phase_id = payload.tpl_phase_id if payload.tpl_phase_id is not None else template.tpl_phase_id
    if effective_tpl_phase_id is not None and episode is None:
        raise HTTPException(status_code=422, detail="tpl_phase_id can only be set if episode_id is set")
    if template.tpl_phase_id is not None and effective_tpl_phase_id != template.tpl_phase_id:
        raise HTTPException(status_code=422, detail="tpl_phase_id must match template tpl_phase_id")
    if effective_tpl_phase_id is not None:
        _get_code_or_422(
            db=db,
            code_id=effective_tpl_phase_id,
            code_type="TPL_PHASE",
            field_name="tpl_phase_id",
        )

    task_group = TaskGroup(
        patient_id=payload.patient_id,
        task_group_template_id=template.id,
        name=template.name,
        episode_id=payload.episode_id,
        tpl_phase_id=effective_tpl_phase_id,
        changed_by=current_user.id,
    )
    db.add(task_group)
    db.flush()

    pending_status = _get_default_code_or_422(
        db=db,
        code_type="TASK_STATUS",
        code_key="PENDING",
        field_name="status_id",
    )

    active_task_templates = sorted(
        [item for item in template.task_templates if item.is_active],
        key=lambda item: (item.sort_pos, item.id),
    )
    for item in active_task_templates:
        # Tasks must always have a due date. If template has no offset, use anchor_date.
        until = payload.anchor_date
        if item.due_days_default is not None:
            until = payload.anchor_date + timedelta(days=item.due_days_default)
        db.add(
            Task(
                task_group_id=task_group.id,
                description=item.description,
                priority_id=item.priority_id,
                assigned_to_id=None,
                until=until,
                status_id=pending_status.id,
                closed_at=None,
                closed_by_id=None,
                comment="",
                changed_by=current_user.id,
            )
        )

    db.commit()
    return (
        db.query(TaskGroup)
        .options(
            joinedload(TaskGroup.tpl_phase),
            joinedload(TaskGroup.changed_by_user),
        )
        .filter(TaskGroup.id == task_group.id)
        .first()
    )
