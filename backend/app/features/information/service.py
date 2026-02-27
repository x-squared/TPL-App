from __future__ import annotations

import datetime as dt

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from ...models import Code, Information, InformationUser, User
from ...schemas import InformationCreate, InformationUpdate


def _information_query(db: Session):
    return db.query(Information).options(
        joinedload(Information.context),
        joinedload(Information.author),
    )


def _ensure_author_exists(*, db: Session, author_id: int) -> None:
    if not db.query(User).filter(User.id == author_id).first():
        raise HTTPException(status_code=422, detail="author_id references unknown USER")


def _ensure_context_valid(*, db: Session, context_id: int | None) -> None:
    if context_id is None:
        return
    context = db.query(Code).filter(Code.id == context_id).first()
    if not context:
        raise HTTPException(status_code=422, detail="context_id references unknown CODE")
    if context.type != "ORGAN":
        raise HTTPException(status_code=422, detail="context_id must reference CODE type ORGAN")


def _next_working_day(today: dt.date | None = None) -> dt.date:
    base = today or dt.date.today()
    candidate = base + dt.timedelta(days=1)
    while candidate.weekday() >= 5:
        candidate += dt.timedelta(days=1)
    return candidate


def _validate_valid_from(*, valid_from: dt.date) -> None:
    min_valid_from = _next_working_day()
    if valid_from < min_valid_from:
        raise HTTPException(
            status_code=422,
            detail=f"valid_from must be at least {min_valid_from.isoformat()}",
        )


def _read_map_for_user(*, db: Session, current_user_id: int) -> dict[int, object]:
    rows = (
        db.query(InformationUser)
        .filter(InformationUser.user_id == current_user_id)
        .all()
    )
    return {row.information_id: row.seen_at for row in rows}


def _read_information_ids(*, db: Session) -> set[int]:
    rows = db.query(InformationUser.information_id).distinct().all()
    return {information_id for (information_id,) in rows}


def _ensure_read_marker(*, db: Session, information_id: int, user_id: int) -> InformationUser:
    marker = (
        db.query(InformationUser)
        .filter(
            InformationUser.information_id == information_id,
            InformationUser.user_id == user_id,
        )
        .first()
    )
    if marker:
        return marker
    marker = InformationUser(information_id=information_id, user_id=user_id)
    db.add(marker)
    db.commit()
    db.refresh(marker)
    return marker


def _to_response_row(*, row: Information, current_user_read_at: object | None, has_reads: bool) -> dict:
    return {
        "id": row.id,
        "context_id": row.context_id,
        "text": row.text,
        "author_id": row.author_id,
        "date": row.date,
        "valid_from": row.valid_from,
        "withdrawn": bool(row.withdrawn),
        "has_reads": has_reads,
        "context": row.context,
        "author": row.author,
        "current_user_read_at": current_user_read_at,
    }


def list_information(*, db: Session, current_user_id: int) -> list[dict]:
    rows = _information_query(db).order_by(Information.date.desc(), Information.id.desc()).all()
    read_map = _read_map_for_user(db=db, current_user_id=current_user_id)
    read_information_ids = _read_information_ids(db=db)
    now_utc = dt.datetime.now(dt.timezone.utc)
    response: list[dict] = []
    for row in rows:
        read_at = read_map.get(row.id)
        if read_at is None and row.author_id == current_user_id and not row.withdrawn:
            # Authors always see their own information as read.
            read_at = now_utc
        has_reads = row.id in read_information_ids or not row.withdrawn
        response.append(_to_response_row(row=row, current_user_read_at=read_at, has_reads=has_reads))
    return response


def create_information(*, payload: InformationCreate, db: Session, current_user_id: int) -> dict:
    _ensure_context_valid(db=db, context_id=payload.context_id)
    _ensure_author_exists(db=db, author_id=current_user_id)
    _validate_valid_from(valid_from=payload.valid_from)
    data = payload.model_dump()
    data["author_id"] = current_user_id
    item = Information(**data)
    db.add(item)
    db.commit()
    author_read_marker = _ensure_read_marker(db=db, information_id=item.id, user_id=current_user_id)
    row = _information_query(db).filter(Information.id == item.id).first()
    return _to_response_row(row=row, current_user_read_at=author_read_marker.seen_at, has_reads=True)


def update_information(
    *,
    information_id: int,
    payload: InformationUpdate,
    db: Session,
    current_user_id: int,
    current_user_is_admin: bool,
) -> dict:
    item = db.query(Information).filter(Information.id == information_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Information not found")
    if item.author_id != current_user_id and not current_user_is_admin:
        raise HTTPException(status_code=403, detail="Only the author or an admin user can edit this information")
    data = payload.model_dump(exclude_unset=True)
    if "context_id" in data:
        _ensure_context_valid(db=db, context_id=data.get("context_id"))
    if "author_id" in data and data.get("author_id") is not None:
        _ensure_author_exists(db=db, author_id=data["author_id"])
    if "valid_from" in data and data.get("valid_from") is not None:
        _validate_valid_from(valid_from=data["valid_from"])
    for key, value in data.items():
        setattr(item, key, value)
    db.commit()
    row = _information_query(db).filter(Information.id == information_id).first()
    read_map = _read_map_for_user(db=db, current_user_id=current_user_id)
    return _to_response_row(
        row=row,
        current_user_read_at=read_map.get(row.id),
        has_reads=(
            db.query(InformationUser).filter(InformationUser.information_id == row.id).first() is not None
            or not row.withdrawn
        ),
    )


def mark_information_read(*, information_id: int, current_user_id: int, db: Session) -> dict:
    item = _information_query(db).filter(Information.id == information_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Information not found")
    marker = (
        db.query(InformationUser)
        .filter(
            InformationUser.information_id == information_id,
            InformationUser.user_id == current_user_id,
        )
        .first()
    )
    if not marker:
        marker = InformationUser(information_id=information_id, user_id=current_user_id)
        db.add(marker)
        db.commit()
        db.refresh(marker)
    return _to_response_row(row=item, current_user_read_at=marker.seen_at, has_reads=True)


def delete_information(*, information_id: int, db: Session, current_user_id: int, current_user_is_admin: bool) -> None:
    item = db.query(Information).filter(Information.id == information_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Information not found")
    if item.withdrawn:
        raise HTTPException(status_code=409, detail="Withdrawn information cannot be deleted")
    if item.author_id != current_user_id and not current_user_is_admin:
        raise HTTPException(status_code=403, detail="Only the author or an admin user can delete this information")
    had_persisted_reads = (
        db.query(InformationUser)
        .filter(InformationUser.information_id == information_id)
        .first()
        is not None
    )
    had_reads = had_persisted_reads or not item.withdrawn
    if had_reads:
        item.withdrawn = True
        (
            db.query(InformationUser)
            .filter(InformationUser.information_id == information_id)
            .delete(synchronize_session=False)
        )
        db.add(item)
        db.commit()
        return
    db.delete(item)
    db.commit()
