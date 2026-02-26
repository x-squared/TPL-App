from datetime import date

# Patient-centric sample seed bundle.
# Keep related demo data together so a single case can be edited coherently.

PATIENTS = [
    {
        "pid": "4711",
        "first_name": "Hans",
        "name": "Test",
        "date_of_birth": date(1960, 1, 1),
        "ahv_nr": "756.9214.3658.92",
        "lang": "Deutsch",
        "translate": False,
        "changed_by_id": 2,
    },
    {
        "pid": "4812",
        "first_name": "Anna",
        "name": "Alpha",
        "date_of_birth": date(1994, 4, 12),
        "ahv_nr": "756.1111.2222.33",
        "lang": "Deutsch",
        "translate": False,
        "changed_by_id": 2,
    },
    {
        "pid": "4923",
        "first_name": "Bert",
        "name": "Beta",
        "date_of_birth": date(1942, 9, 3),
        "ahv_nr": "756.4444.5555.66",
        "lang": "Deutsch",
        "translate": False,
        "changed_by_id": 2,
    },
]

CONTACT_INFOS = [
    {
        "patient_pid": "4711",
        "code_type": "CONTACT",
        "code_key": "EMAIL",
        "data": "hans@test.ch",
        "comment": "",
        "main": True,
        "pos": 1,
        "changed_by_id": 2,
    },
    {
        "patient_pid": "4711",
        "code_type": "CONTACT",
        "code_key": "PHONE",
        "data": "+41 79 123 45 67",
        "comment": "",
        "main": True,
        "pos": 2,
        "changed_by_id": 2,
    },
    {
        "patient_pid": "4711",
        "code_type": "CONTACT",
        "code_key": "PHONE",
        "data": "+41 79 765 43 21",
        "comment": "Schwester, Nur Notfall",
        "main": False,
        "pos": 3,
        "changed_by_id": 2,
    },
]

EPISODES = [
    {
        "patient_pid": "4711",
        "organ_keys": ["LIVER"],
        "start": date(2026, 1, 15),
        "status_key": "ABKLAERUNG",
        "changed_by_id": 2,
    },
    {
        "patient_pid": "4812",
        "organ_keys": ["KIDNEY", "PANCREAS"],
        "start": date(2025, 7, 10),
        "status_key": "ABKLAERUNG",
        "changed_by_id": 2,
    },
]

TASK_GROUPS = [
    {
        "seed_key": "TEST_BASE",
        "patient_pid": "4711",
        "task_group_template_key": "TEST_BASE_TEMPLATE",
        "name": "Test Base Group",
        "episode_id": None,
        "tpl_phase_key": None,
        "changed_by_id": 2,
    },
]

TASKS = [
    {
        "task_group_seed_key": "TEST_BASE",
        "description": "Pruefe Basisdokumente",
        "priority_key": "LOW",
        "assigned_to_ext_id": "TKOORD",
        "until": date(2026, 3, 15),
        "status_key": "PENDING",
        "closed_at": None,
        "closed_by_ext_id": None,
        "comment": "",
        "changed_by_id": 2,
    },
    {
        "task_group_seed_key": "TEST_BASE",
        "description": "Termin fuer Evaluation koordinieren",
        "priority_key": "NORMAL",
        "assigned_to_ext_id": "TKOORD",
        "until": date(2026, 3, 20),
        "status_key": "PENDING",
        "closed_at": None,
        "closed_by_ext_id": None,
        "comment": "",
        "changed_by_id": 2,
    },
    {
        "task_group_seed_key": "TEST_BASE",
        "description": "Dringende Rueckfrage beim Zentrum",
        "priority_key": "HIGH",
        "assigned_to_ext_id": "TKOORD",
        "until": date(2026, 3, 10),
        "status_key": "PENDING",
        "closed_at": None,
        "closed_by_ext_id": None,
        "comment": "",
        "changed_by_id": 2,
    },
]
