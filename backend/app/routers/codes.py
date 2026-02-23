from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Code
from ..schemas import CodeResponse

router = APIRouter(prefix="/codes", tags=["codes"])


@router.get("/", response_model=list[CodeResponse])
def list_codes(
    type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Code)
    if type:
        query = query.filter(Code.type == type)
    return query.order_by(Code.type, Code.pos).all()
