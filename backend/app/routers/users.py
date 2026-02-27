from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..features.users import list_users as list_users_service
from ..schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserResponse])
def list_users(role_key: str | None = None, db: Session = Depends(get_db)):
    return list_users_service(role_key=role_key, db=db)
