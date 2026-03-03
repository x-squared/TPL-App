PERMISSIONS = [
    {"key": "view.patients", "name_default": "View Patients"},
    {"key": "view.colloquiums", "name_default": "View Colloquiums"},
    {"key": "view.coordinations", "name_default": "View Coordinations"},
    {"key": "view.donors", "name_default": "View Donors"},
    {"key": "edit.donors", "name_default": "Edit Donors"},
    {"key": "view.reports", "name_default": "View Reports"},
    {"key": "view.admin", "name_default": "View Admin"},
]

ROLE_PERMISSIONS: dict[str, list[str]] = {
    "KOORD": [
        "view.patients",
        "view.colloquiums",
        "view.coordinations",
        "view.donors",
        "view.reports",
    ],
    "KOORD_DONOR": [
        "edit.donors",
    ],
    "ARZT": [
        "view.patients",
        "view.colloquiums",
        "view.coordinations",
        "view.donors",
        "view.reports",
    ],
    "SYSTEM": [
        "view.patients",
        "view.colloquiums",
        "view.coordinations",
        "view.donors",
        "edit.donors",
        "view.reports",
    ],
    "ADMIN": [
        "view.patients",
        "view.colloquiums",
        "view.coordinations",
        "view.donors",
        "edit.donors",
        "view.reports",
        "view.admin",
    ],
}
