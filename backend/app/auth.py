from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session, joinedload

from .database import get_db
from .models import User

# TODO: move to environment variable
SECRET_KEY = "tpl-app-dev-secret-key-change-in-production"
ALGORITHM = "HS256"

bearer_scheme = HTTPBearer()


def create_token(ext_id: str) -> str:
    return jwt.encode({"sub": ext_id}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        ext_id: str = payload.get("sub")
        if ext_id is None:
            raise ValueError()
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.ext_id == ext_id)
        .first()
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user
