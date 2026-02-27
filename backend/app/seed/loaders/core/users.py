from typing import Any

from sqlalchemy.orm import Session

from ....models import Code, User


def _save_user_entry(db: Session, entry: dict[str, Any]) -> None:
    raw = dict(entry)
    role_keys = raw.pop("role_keys", None)
    role_key = raw.pop("role_key", "")
    if role_keys is None:
        role_keys = [role_key] if role_key else []
    roles = (
        db.query(Code)
        .filter(Code.type == "ROLE", Code.key.in_(role_keys))
        .all()
        if role_keys
        else []
    )
    primary_role = roles[0] if roles else None
    ext_id = raw.get("ext_id")
    if not ext_id:
        return
    existing = db.query(User).filter(User.ext_id == ext_id).first()
    if existing:
        existing.name = raw.get("name", existing.name)
        existing.role_id = primary_role.id if primary_role else None
        existing.roles = roles
        return
    db.add(User(role_id=primary_role.id if primary_role else None, roles=roles, **raw))


def sync_users_core(db: Session) -> None:
    """Load production-safe base users (e.g. SYSTEM)."""
    from ...datasets.core.users import RECORDS as user_records

    for entry in user_records:
        _save_user_entry(db, entry)
    db.commit()


def sync_users_sample(db: Session) -> None:
    """Load demo users for non-production environments."""
    from ...datasets.sample.users import RECORDS as user_records

    for entry in user_records:
        _save_user_entry(db, entry)
    db.commit()


def sync_users(db: Session) -> None:
    """Backward compatible full user seed load (core + sample)."""
    sync_users_core(db)
    sync_users_sample(db)
