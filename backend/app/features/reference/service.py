from __future__ import annotations

from sqlalchemy.orm import Session

from ...models import Catalogue, Code


def list_codes(*, code_type: str | None, db: Session) -> list[Code]:
    query = db.query(Code)
    if code_type:
        query = query.filter(Code.type == code_type)
    return query.order_by(Code.type, Code.pos).all()


def list_catalogues(*, catalogue_type: str | None, db: Session) -> list[Catalogue]:
    query = db.query(Catalogue)
    if catalogue_type:
        query = query.filter(Catalogue.type == catalogue_type)
    return query.order_by(Catalogue.type, Catalogue.pos).all()
