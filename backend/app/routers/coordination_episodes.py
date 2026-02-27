from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import require_permission
from ..database import get_db
from ..features.coordination_episodes import (
    create_coordination_episode as create_coordination_episode_service,
    delete_coordination_episode as delete_coordination_episode_service,
    list_coordination_episodes as list_coordination_episodes_service,
    update_coordination_episode as update_coordination_episode_service,
)
from ..models import User
from ..schemas import (
    CoordinationEpisodeCreate,
    CoordinationEpisodeResponse,
    CoordinationEpisodeUpdate,
)

router = APIRouter(prefix="/coordinations/{coordination_id}/episodes", tags=["coordination_episode"])


@router.get("/", response_model=list[CoordinationEpisodeResponse])
def list_coordination_episodes(
    coordination_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("view.donations")),
):
    return list_coordination_episodes_service(coordination_id=coordination_id, db=db)


@router.post("/", response_model=CoordinationEpisodeResponse, status_code=201)
def create_coordination_episode(
    coordination_id: int,
    payload: CoordinationEpisodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    return create_coordination_episode_service(
        coordination_id=coordination_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.patch("/{coordination_episode_id}", response_model=CoordinationEpisodeResponse)
def update_coordination_episode(
    coordination_id: int,
    coordination_episode_id: int,
    payload: CoordinationEpisodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    return update_coordination_episode_service(
        coordination_id=coordination_id,
        coordination_episode_id=coordination_episode_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.delete("/{coordination_episode_id}", status_code=204)
def delete_coordination_episode(
    coordination_id: int,
    coordination_episode_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edit.donations")),
):
    _ = current_user
    delete_coordination_episode_service(
        coordination_id=coordination_id,
        coordination_episode_id=coordination_episode_id,
        db=db,
    )
