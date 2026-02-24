from datetime import date

# ---- task groups ----
# Single seeded group for the test patient Hans Test (PID 4711).
TASK_GROUPS = [
    {
        "seed_key": "HANS_TEST_BASE",
        "patient_pid": "4711",
        "task_group_template_key": "HANS_TEST_BASE_TEMPLATE",
        "episode_id": None,
        "tpl_phase_key": None,
        "done": False,
        "changed_by": 1,
    },
]

# ---- tasks ----
# Three tasks with three different priorities.
TASKS = [
    {
        "task_group_seed_key": "HANS_TEST_BASE",
        "description": "Pruefe Basisdokumente",
        "priority_key": "LOW",
        "must": False,
        "assigned_to_ext_id": "TKOORD",
        "until": date(2026, 3, 15),
        "status_key": "PENDING",
        "closed_at": None,
        "closed_by_ext_id": None,
        "comment": "",
        "changed_by": 1,
    },
    {
        "task_group_seed_key": "HANS_TEST_BASE",
        "description": "Termin fuer Evaluation koordinieren",
        "priority_key": "NORMAL",
        "must": True,
        "assigned_to_ext_id": "TKOORD",
        "until": date(2026, 3, 20),
        "status_key": "PENDING",
        "closed_at": None,
        "closed_by_ext_id": None,
        "comment": "",
        "changed_by": 1,
    },
    {
        "task_group_seed_key": "HANS_TEST_BASE",
        "description": "Dringende Rueckfrage beim Zentrum",
        "priority_key": "HIGH",
        "must": True,
        "assigned_to_ext_id": "TKOORD",
        "until": date(2026, 3, 10),
        "status_key": "PENDING",
        "closed_at": None,
        "closed_by_ext_id": None,
        "comment": "",
        "changed_by": 1,
    },
]
