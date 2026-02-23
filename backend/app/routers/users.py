from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Code, User
from ..schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserResponse])
def list_users(role_key: str | None = None, db: Session = Depends(get_db)):
    query = db.query(User).options(joinedload(User.role))
    if role_key:
        query = query.join(Code, User.role_id == Code.id).filter(
            Code.type == "ROLE", Code.key == role_key
        )
    return query.order_by(User.name).all()
