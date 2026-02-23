from sqlalchemy.orm import Session

from ..models import Catalogue, Code, ContactInfo, Patient, User


def sync_codes(db: Session) -> None:
    """Replace all CODE rows with the data defined in codes_data.py on every startup."""
    from .codes_data import ALL as code_records

    db.query(Code).delete()
    for entry in code_records:
        db.add(Code(**entry))
    db.commit()


def sync_catalogues(db: Session) -> None:
    """Replace all CATALOGUE rows with the data defined in catalogues_data.py on every startup."""
    from .catalogues_data import ALL as catalogue_records

    db.query(Catalogue).delete()
    for entry in catalogue_records:
        db.add(Catalogue(**entry))
    db.commit()


def sync_patients(db: Session) -> None:
    """Replace all PATIENT and CONTACT_INFO rows with seed data on every startup."""
    from .contact_infos_data import ALL as contact_records
    from .patients_data import ALL as patient_records

    db.query(ContactInfo).delete()
    db.query(Patient).delete()
    for entry in patient_records:
        db.add(Patient(**entry))
    db.flush()

    for entry in contact_records:
        raw = dict(entry)
        patient = db.query(Patient).filter(Patient.pid == raw.pop("patient_pid")).first()
        code = (
            db.query(Code)
            .filter(Code.type == raw.pop("code_type"), Code.key == raw.pop("code_key"))
            .first()
        )
        if patient and code:
            db.add(ContactInfo(patient_id=patient.id, type_id=code.id, **raw))
    db.commit()


def sync_users(db: Session) -> None:
    """Replace all USER rows with the data defined in users_data.py on every startup."""
    from .users_data import ALL as user_records

    db.query(User).delete()
    for entry in user_records:
        db.add(User(**entry))
    db.commit()
