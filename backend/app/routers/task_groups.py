from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..features.tasks import (
    create_task_group as create_task_group_service,
    delete_task_group as delete_task_group_service,
    list_task_groups as list_task_groups_service,
    update_task_group as update_task_group_service,
)
from ..models import User
from ..schemas import TaskGroupCreate, TaskGroupResponse, TaskGroupUpdate

router = APIRouter(prefix="/task-groups", tags=["task-groups"])


@router.get("/", response_model=list[TaskGroupResponse])
def list_task_groups(
    patient_id: int | None = None,
    episode_id: int | None = None,
    colloqium_agenda_id: int | None = None,
    db: Session = Depends(get_db),
):
    return list_task_groups_service(
        patient_id=patient_id,
        episode_id=episode_id,
        colloqium_agenda_id=colloqium_agenda_id,
        db=db,
    )


@router.post("/", response_model=TaskGroupResponse, status_code=201)
def create_task_group(
    payload: TaskGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_task_group_service(
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.patch("/{task_group_id}", response_model=TaskGroupResponse)
def update_task_group(
    task_group_id: int,
    payload: TaskGroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_task_group_service(
        task_group_id=task_group_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.delete("/{task_group_id}", status_code=204)
def delete_task_group(
    task_group_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    delete_task_group_service(task_group_id=task_group_id, db=db)
