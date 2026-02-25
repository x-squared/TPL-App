from datetime import date

# ---- seeded episodes ----
TEST = [
    {
        "patient_pid": "4711",
        "organ_key": "LIVER",
        "start": date(2026, 1, 15),
        "status_key": "ABKLAERUNG",
        "changed_by_id": 1,
    },
    {
        "patient_pid": "4812",
        "organ_key": "KIDNEY",
        "start": date(2025, 7, 10),
        "status_key": "ABKLAERUNG",
        "changed_by_id": 1,
    },
]

# ---- all episodes combined ----
ALL = TEST

