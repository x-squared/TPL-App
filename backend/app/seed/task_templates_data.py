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
        "changed_by": 1,
    },
]

# ---- task templates ----
TASK_TEMPLATES = [
    {
        "task_group_template_key": "TEST_BASE_TEMPLATE",
        "description": "Unterlagen vor Stichtag pruefen",
        "priority_key": "LOW",
        "due_days_default": -2,
        "is_active": True,
        "sort_pos": 1,
        "changed_by": 1,
    },
    {
        "task_group_template_key": "TEST_BASE_TEMPLATE",
        "description": "Patientenabgleich am Stichtag",
        "priority_key": "NORMAL",
        "due_days_default": 0,
        "is_active": True,
        "sort_pos": 2,
        "changed_by": 1,
    },
    {
        "task_group_template_key": "TEST_BASE_TEMPLATE",
        "description": "Nachfassen eine Woche nach Stichtag",
        "priority_key": "HIGH",
        "due_days_default": 7,
        "is_active": True,
        "sort_pos": 3,
        "changed_by": 1,
    },
]
