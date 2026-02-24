from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Code, Episode, Patient, TaskGroup, TaskGroupTemplate, User
from ..schemas import TaskGroupCreate, TaskGroupResponse, TaskGroupUpdate

router = APIRouter(prefix="/task-groups", tags=["task-groups"])


def _get_patient_or_404(patient_id: int, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


def _validate_links(
    *,
    patient_id: int,
    task_group_template_id: int | None,
    episode_id: int | None,
    tpl_phase_id: int | None,
    db: Session,
) -> None:
    _get_patient_or_404(patient_id, db)
    template = None
    if task_group_template_id is not None:
        template = db.query(TaskGroupTemplate).filter(TaskGroupTemplate.id == task_group_template_id).first()
        if not template:
            raise HTTPException(status_code=422, detail="task_group_template_id references unknown TASK_GROUP_TEMPLATE")
    if episode_id is not None:
        episode = db.query(Episode).filter(Episode.id == episode_id).first()
        if not episode:
            raise HTTPException(status_code=404, detail="Episode not found")
        if episode.patient_id != patient_id:
            raise HTTPException(
                status_code=422,
                detail="episode_id must reference an episode that belongs to patient_id",
            )
    if tpl_phase_id is not None:
        if episode_id is None:
            raise HTTPException(
                status_code=422,
                detail="tpl_phase_id can only be set if episode_id is set",
            )
        phase = (
            db.query(Code)
            .filter(Code.id == tpl_phase_id, Code.type == "TPL_PHASE")
            .first()
        )
        if not phase:
            raise HTTPException(
                status_code=422,
                detail="tpl_phase_id must reference CODE with type TPL_PHASE",
            )
    if template is None:
        return

    template_scope = db.query(Code).filter(Code.id == template.scope_id, Code.type == "TASK_SCOPE").first()
    if not template_scope:
        raise HTTPException(status_code=422, detail="Template scope_id must reference CODE with type TASK_SCOPE")
    if template_scope.key == "EPISODE" and episode_id is None:
        raise HTTPException(status_code=422, detail="episode_id is required for templates with TASK_SCOPE.EPISODE")
    if template.organ_id is not None:
        if episode_id is None:
            raise HTTPException(status_code=422, detail="episode_id is required when template has organ_id")
        episode = db.query(Episode).filter(Episode.id == episode_id).first()
        if not episode or episode.organ_id != template.organ_id:
            raise HTTPException(status_code=422, detail="episode organ must match template organ_id")
    if template.tpl_phase_id is not None:
        if episode_id is None:
            raise HTTPException(status_code=422, detail="episode_id is required when template has tpl_phase_id")
        if tpl_phase_id is not None and tpl_phase_id != template.tpl_phase_id:
            raise HTTPException(status_code=422, detail="tpl_phase_id must match template tpl_phase_id")
    if tpl_phase_id is None and template.tpl_phase_id is not None:
        raise HTTPException(status_code=422, detail="tpl_phase_id is required when template has tpl_phase_id")


@router.get("/", response_model=list[TaskGroupResponse])
def list_task_groups(
    patient_id: int | None = None,
    episode_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(TaskGroup).options(
        joinedload(TaskGroup.tpl_phase),
        joinedload(TaskGroup.changed_by_user),
    )
    if patient_id is not None:
        query = query.filter(TaskGroup.patient_id == patient_id)
    if episode_id is not None:
        query = query.filter(TaskGroup.episode_id == episode_id)
    return query.all()


@router.post("/", response_model=TaskGroupResponse, status_code=201)
def create_task_group(
    payload: TaskGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_links(
        patient_id=payload.patient_id,
        task_group_template_id=payload.task_group_template_id,
        episode_id=payload.episode_id,
        tpl_phase_id=payload.tpl_phase_id,
        db=db,
    )
    tg = TaskGroup(**payload.model_dump(), changed_by=current_user.id)
    db.add(tg)
    db.commit()
    db.refresh(tg)
    return (
        db.query(TaskGroup)
        .options(
            joinedload(TaskGroup.tpl_phase),
            joinedload(TaskGroup.changed_by_user),
        )
        .filter(TaskGroup.id == tg.id)
        .first()
    )


@router.patch("/{task_group_id}", response_model=TaskGroupResponse)
def update_task_group(
    task_group_id: int,
    payload: TaskGroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tg = db.query(TaskGroup).filter(TaskGroup.id == task_group_id).first()
    if not tg:
        raise HTTPException(status_code=404, detail="Task group not found")
    update_data = payload.model_dump(exclude_unset=True)
    if "episode_id" in update_data and update_data["episode_id"] is None and "tpl_phase_id" not in update_data:
        update_data["tpl_phase_id"] = None
    patient_id = update_data.get("patient_id", tg.patient_id)
    task_group_template_id = update_data.get("task_group_template_id", tg.task_group_template_id)
    episode_id = update_data.get("episode_id", tg.episode_id)
    tpl_phase_id = update_data.get("tpl_phase_id", tg.tpl_phase_id)
    _validate_links(
        patient_id=patient_id,
        task_group_template_id=task_group_template_id,
        episode_id=episode_id,
        tpl_phase_id=tpl_phase_id,
        db=db,
    )
    for key, value in update_data.items():
        setattr(tg, key, value)
    tg.changed_by = current_user.id
    db.commit()
    return (
        db.query(TaskGroup)
        .options(
            joinedload(TaskGroup.tpl_phase),
            joinedload(TaskGroup.changed_by_user),
        )
        .filter(TaskGroup.id == task_group_id)
        .first()
    )


@router.delete("/{task_group_id}", status_code=204)
def delete_task_group(
    task_group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tg = db.query(TaskGroup).filter(TaskGroup.id == task_group_id).first()
    if not tg:
        raise HTTPException(status_code=404, detail="Task group not found")
    db.delete(tg)
    db.commit()
