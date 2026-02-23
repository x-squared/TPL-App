from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Catalogue
from ..schemas import CatalogueResponse

router = APIRouter(prefix="/catalogues", tags=["catalogues"])


@router.get("/", response_model=list[CatalogueResponse])
def list_catalogues(
    type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Catalogue)
    if type:
        query = query.filter(Catalogue.type == type)
    return query.order_by(Catalogue.type, Catalogue.pos).all()
