from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, subqueryload

from ..auth import get_current_user
from ..database import get_db
from ..models import Absence, Catalogue, ContactInfo, Diagnosis, Episode, MedicalValue, MedicalValueTemplate, Patient, User
from ..schemas import PatientCreate, PatientListResponse, PatientResponse, PatientUpdate

router = APIRouter(prefix="/patients", tags=["patients"])


def _episode_organ_ids(episode: Episode) -> list[int]:
    organ_ids = [organ.id for organ in (episode.organs or []) if organ and organ.id is not None]
    if organ_ids:
        return list(dict.fromkeys(organ_ids))
    if episode.organ_id is not None:
        return [episode.organ_id]
    return []


@router.get("/", response_model=list[PatientListResponse])
def list_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    patients = (
        db.query(Patient)
        .options(
            joinedload(Patient.changed_by_user),
            joinedload(Patient.sex),
            joinedload(Patient.blood_type),
            joinedload(Patient.resp_coord),
            subqueryload(Patient.contact_infos),
            subqueryload(Patient.episodes).joinedload(Episode.organ),
            subqueryload(Patient.episodes).subqueryload(Episode.organs),
            subqueryload(Patient.episodes).joinedload(Episode.status),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for p in patients:
        episodes = p.episodes or []
        open_episodes = sorted(
            [ep for ep in episodes if not ep.closed],
            key=lambda ep: ep.status.pos if ep.status else 999,
        )
        result.append(
            PatientListResponse(
                id=p.id,
                pid=p.pid,
                first_name=p.first_name,
                name=p.name,
                date_of_birth=p.date_of_birth,
                date_of_death=p.date_of_death,
                ahv_nr=p.ahv_nr,
                lang=p.lang,
                sex_id=p.sex_id,
                sex=p.sex,
                blood_type_id=p.blood_type_id,
                blood_type=p.blood_type,
                resp_coord_id=p.resp_coord_id,
                resp_coord=p.resp_coord,
                translate=p.translate,
                contact_info_count=len(p.contact_infos or []),
                open_episode_count=len(open_episodes),
                open_episode_indicators=[
                    (
                        "/".join(
                            (organ.name_default[:2] if organ and organ.name_default else "??")
                            for organ in (ep.organs or ([ep.organ] if ep.organ else []))
                        )
                        or "??"
                    )
                    for ep in open_episodes
                ],
                episode_organ_ids=[
                    organ_id
                    for ep in episodes
                    for organ_id in _episode_organ_ids(ep)
                ],
                open_episode_organ_ids=[
                    organ_id
                    for ep in open_episodes
                    for organ_id in _episode_organ_ids(ep)
                ],
            )
        )
    return result


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = (
        db.query(Patient)
        .options(
            joinedload(Patient.changed_by_user),
            joinedload(Patient.sex),
            joinedload(Patient.blood_type),
            joinedload(Patient.resp_coord),
            subqueryload(Patient.contact_infos).joinedload(ContactInfo.type),
            subqueryload(Patient.contact_infos).joinedload(ContactInfo.changed_by_user),
            subqueryload(Patient.absences).joinedload(Absence.changed_by_user),
            subqueryload(Patient.diagnoses).joinedload(Diagnosis.catalogue),
            subqueryload(Patient.diagnoses).joinedload(Diagnosis.changed_by_user),
            subqueryload(Patient.medical_values).joinedload(MedicalValue.medical_value_template).joinedload(MedicalValueTemplate.datatype),
            subqueryload(Patient.medical_values).joinedload(MedicalValue.medical_value_template).joinedload(MedicalValueTemplate.medical_value_group),
            subqueryload(Patient.medical_values).joinedload(MedicalValue.medical_value_group),
            subqueryload(Patient.medical_values).joinedload(MedicalValue.datatype),
            subqueryload(Patient.medical_values).joinedload(MedicalValue.changed_by_user),
            subqueryload(Patient.episodes).joinedload(Episode.organ),
            subqueryload(Patient.episodes).subqueryload(Episode.organs),
            subqueryload(Patient.episodes).joinedload(Episode.status),
            subqueryload(Patient.episodes).joinedload(Episode.changed_by_user),
        )
        .filter(Patient.id == patient_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/", response_model=PatientResponse, status_code=201)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = Patient(**payload.model_dump(), changed_by_id=current_user.id)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.patch("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, key, value)
    patient.changed_by_id = current_user.id
    db.commit()
    return (
        db.query(Patient)
        .options(
            joinedload(Patient.changed_by_user),
            joinedload(Patient.sex),
            joinedload(Patient.blood_type),
            joinedload(Patient.resp_coord),
            subqueryload(Patient.contact_infos).joinedload(ContactInfo.type),
            subqueryload(Patient.contact_infos).joinedload(ContactInfo.changed_by_user),
            subqueryload(Patient.absences).joinedload(Absence.changed_by_user),
            subqueryload(Patient.diagnoses).joinedload(Diagnosis.catalogue),
            subqueryload(Patient.diagnoses).joinedload(Diagnosis.changed_by_user),
            subqueryload(Patient.medical_values).joinedload(MedicalValue.medical_value_template).joinedload(MedicalValueTemplate.datatype),
            subqueryload(Patient.medical_values).joinedload(MedicalValue.medical_value_template).joinedload(MedicalValueTemplate.medical_value_group),
            subqueryload(Patient.medical_values).joinedload(MedicalValue.medical_value_group),
            subqueryload(Patient.medical_values).joinedload(MedicalValue.datatype),
            subqueryload(Patient.medical_values).joinedload(MedicalValue.changed_by_user),
            subqueryload(Patient.episodes).joinedload(Episode.organ),
            subqueryload(Patient.episodes).subqueryload(Episode.organs),
            subqueryload(Patient.episodes).joinedload(Episode.status),
            subqueryload(Patient.episodes).joinedload(Episode.changed_by_user),
        )
        .filter(Patient.id == patient_id)
        .first()
    )


@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
