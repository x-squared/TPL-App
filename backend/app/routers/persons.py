from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..features.people import create_person as create_person_service, search_people as search_people_service
from ..models import User
from ..schemas import PersonCreate, PersonResponse

router = APIRouter(prefix="/persons", tags=["persons"])


@router.get("/search", response_model=list[PersonResponse])
def search_people(
    query: str = Query(""),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return search_people_service(query_text=query, db=db, limit=20)


@router.post("/", response_model=PersonResponse, status_code=201)
def create_person(
    payload: PersonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_person_service(payload=payload, changed_by_id=current_user.id, db=db)
