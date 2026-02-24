from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import ColloqiumAgenda, ColloqiumTask, Task, User
from ..schemas import ColloqiumTaskCreate, ColloqiumTaskResponse, ColloqiumTaskUpdate

router = APIRouter(prefix="/colloqium-tasks", tags=["colloqium-tasks"])


def _validate_agenda_or_422(*, db: Session, colloqium_agenda_id: int) -> None:
    item = db.query(ColloqiumAgenda).filter(ColloqiumAgenda.id == colloqium_agenda_id).first()
    if not item:
        raise HTTPException(status_code=422, detail="colloqium_agenda_id references unknown COLLOQIUM_AGENDA")


def _validate_task_or_422(*, db: Session, task_id: int) -> None:
    item = db.query(Task).filter(Task.id == task_id).first()
    if not item:
        raise HTTPException(status_code=422, detail="task_id references unknown TASK")


@router.get("/", response_model=list[ColloqiumTaskResponse])
def list_colloqium_tasks(
    colloqium_agenda_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(ColloqiumTask).options(
        joinedload(ColloqiumTask.agenda),
        joinedload(ColloqiumTask.task),
        joinedload(ColloqiumTask.changed_by_user),
    )
    if colloqium_agenda_id is not None:
        query = query.filter(ColloqiumTask.colloqium_agenda_id == colloqium_agenda_id)
    return query.order_by(ColloqiumTask.id.asc()).all()


@router.post("/", response_model=ColloqiumTaskResponse, status_code=201)
def create_colloqium_task(
    payload: ColloqiumTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_agenda_or_422(db=db, colloqium_agenda_id=payload.colloqium_agenda_id)
    _validate_task_or_422(db=db, task_id=payload.task_id)
    item = ColloqiumTask(**payload.model_dump(), changed_by=current_user.id)
    db.add(item)
    db.commit()
    return (
        db.query(ColloqiumTask)
        .options(
            joinedload(ColloqiumTask.agenda),
            joinedload(ColloqiumTask.task),
            joinedload(ColloqiumTask.changed_by_user),
        )
        .filter(ColloqiumTask.id == item.id)
        .first()
    )


@router.patch("/{colloqium_task_id}", response_model=ColloqiumTaskResponse)
def update_colloqium_task(
    colloqium_task_id: int,
    payload: ColloqiumTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ColloqiumTask).filter(ColloqiumTask.id == colloqium_task_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Colloqium task not found")
    data = payload.model_dump(exclude_unset=True)
    if "colloqium_agenda_id" in data:
        _validate_agenda_or_422(db=db, colloqium_agenda_id=data["colloqium_agenda_id"])
    if "task_id" in data:
        _validate_task_or_422(db=db, task_id=data["task_id"])
    for key, value in data.items():
        setattr(item, key, value)
    item.changed_by = current_user.id
    db.commit()
    return (
        db.query(ColloqiumTask)
        .options(
            joinedload(ColloqiumTask.agenda),
            joinedload(ColloqiumTask.task),
            joinedload(ColloqiumTask.changed_by_user),
        )
        .filter(ColloqiumTask.id == colloqium_task_id)
        .first()
    )


@router.delete("/{colloqium_task_id}", status_code=204)
def delete_colloqium_task(
    colloqium_task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ColloqiumTask).filter(ColloqiumTask.id == colloqium_task_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Colloqium task not found")
    db.delete(item)
    db.commit()
