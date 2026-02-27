from sqlalchemy.orm import Session

from ....models import Code, Information, InformationUser


def sync_information_core(db: Session) -> None:
    """Load production-safe information rows."""
    from ...datasets.core.information import RECORDS

    db.query(InformationUser).delete()
    db.query(Information).delete()
    db.flush()

    context_by_key = {
        code.key: code
        for code in db.query(Code).filter(Code.type == "ORGAN").all()
    }

    for entry in RECORDS:
        raw = dict(entry)
        context_key = raw.pop("context_key", None)
        context = context_by_key.get(context_key) if context_key else None
        item = Information(
            context_id=context.id if context else None,
            **raw,
        )
        db.add(item)

    db.commit()
