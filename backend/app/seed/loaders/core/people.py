from sqlalchemy.orm import Session

from ....models import ColloqiumParticipant, ColloqiumTypeParticipant, Person, PersonTeam


def sync_people_core(db: Session) -> None:
    """Load production-safe person and team reference data."""
    from ...datasets.core.people import RECORDS as people_records
    from ...datasets.core.people import TEAM_RECORDS as team_records

    db.query(ColloqiumParticipant).delete()
    db.query(ColloqiumTypeParticipant).delete()
    db.query(PersonTeam).delete()
    db.query(Person).delete()
    db.flush()

    people_by_user_id: dict[str, Person] = {}
    for entry in people_records:
        item = Person(**dict(entry))
        db.add(item)
        db.flush()
        if item.user_id:
            people_by_user_id[item.user_id] = item

    for entry in team_records:
        raw = dict(entry)
        member_user_ids = list(raw.pop("member_user_ids", []))
        team = PersonTeam(**raw)
        db.add(team)
        db.flush()
        for user_id in member_user_ids:
            member = people_by_user_id.get(user_id)
            if member:
                team.members.append(member)

    db.commit()
