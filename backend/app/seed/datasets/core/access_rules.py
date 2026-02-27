PERMISSIONS = [
    {"key": "view.patients", "name_default": "View Patients"},
    {"key": "view.colloquiums", "name_default": "View Colloquiums"},
    {"key": "view.coordinations", "name_default": "View Coordinations"},
    {"key": "view.donations", "name_default": "View Donations"},
    {"key": "edit.donations", "name_default": "Edit Donations"},
    {"key": "view.reports", "name_default": "View Reports"},
    {"key": "view.admin", "name_default": "View Admin"},
]

ROLE_PERMISSIONS: dict[str, list[str]] = {
    "KOORD": [
        "view.patients",
        "view.colloquiums",
        "view.coordinations",
        "view.donations",
        "view.reports",
    ],
    "KOORD_DONATION": [
        "edit.donations",
    ],
    "ARZT": [
        "view.patients",
        "view.colloquiums",
        "view.coordinations",
        "view.donations",
        "view.reports",
    ],
    "SYSTEM": [
        "view.patients",
        "view.colloquiums",
        "view.coordinations",
        "view.donations",
        "edit.donations",
        "view.reports",
    ],
    "ADMIN": [
        "view.patients",
        "view.colloquiums",
        "view.coordinations",
        "view.donations",
        "edit.donations",
        "view.reports",
        "view.admin",
    ],
}
