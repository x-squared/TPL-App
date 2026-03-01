"""Seed data for task group templates and task templates."""

# ---- task group templates ----
TASK_GROUP_TEMPLATES = [
    {
        "key": "TEST_BASE_TEMPLATE",
        "name": "Beispiel-Aufgaben",
        "description": "Beispielaufgaben-Vorlagen fuer Test-Tasks im Patientenkontext.",
        "scope_key": "PATIENT",
        "organ_key": None,
        "tpl_phase_key": None,
        "is_active": True,
        "sort_pos": 1,
        "changed_by_id": 2,
    },
]

# ---- task templates ----
TASK_TEMPLATES = [
    {
        "task_group_template_key": "TEST_BASE_TEMPLATE",
        "description": "Unterlagen vor Stichtag pruefen",
        "kind_key": "TASK",
        "priority_key": "LOW",
        "offset_minutes_default": -2880,
        "is_active": True,
        "sort_pos": 1,
        "changed_by_id": 2,
    },
    {
        "task_group_template_key": "TEST_BASE_TEMPLATE",
        "description": "Patientenabgleich am Stichtag",
        "kind_key": "TASK",
        "priority_key": "NORMAL",
        "offset_minutes_default": 0,
        "is_active": True,
        "sort_pos": 2,
        "changed_by_id": 2,
    },
    {
        "task_group_template_key": "TEST_BASE_TEMPLATE",
        "description": "Nachfassen eine Woche nach Stichtag",
        "kind_key": "TASK",
        "priority_key": "HIGH",
        "offset_minutes_default": 10080,
        "is_active": True,
        "sort_pos": 3,
        "changed_by_id": 2,
    },
]

