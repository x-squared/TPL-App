# --- All data ---
from ....enums import CoordinationStatusKey, FavoriteTypeKey, PriorityKey, TaskScopeKey, TaskStatusKey

RECORDS = []

# ---- DATATYPE ----
DATATYPE = [
    {"type": "DATATYPE", "key": "INTEGER", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Ganzzahl"},
    {"type": "DATATYPE", "key": "DECIMAL", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Dezimal"},
    {"type": "DATATYPE", "key": "STRING", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "String"},
    {"type": "DATATYPE", "key": "DATE", "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "Datum"},
    {"type": "DATATYPE", "key": "TIMESTAMP", "pos": 5, "ext_sys": "", "ext_key": "", "name_default": "Zeitstempel"},
    {"type": "DATATYPE", "key": "BOOLEAN", "pos": 6, "ext_sys": "", "ext_key": "", "name_default": "Boolsch"},
    {"type": "DATATYPE", "key": "KG", "pos": 7, "ext_sys": "", "ext_key": "", "name_default": "Kilogramm"},
    {"type": "DATATYPE", "key": "CM", "pos": 8, "ext_sys": "", "ext_key": "", "name_default": "Zentimeter"},
    {"type": "DATATYPE", "key": "BLOOD_TYPE", "pos": 9, "ext_sys": "CATALOGUE", "ext_key": "BLOOD_TYPE", "name_default": "Blutgruppe"},
    {"type": "DATATYPE", "key": "BP", "pos": 10, "ext_sys": "", "ext_key": "", "name_default": "Blutdruck"},
    {"type": "DATATYPE", "key": "POS_NEG", "pos": 11, "ext_sys": "CATALOGUE", "ext_key": "POS_NEG", "name_default": "Positiv/Negativ"},
]

RECORDS = RECORDS + DATATYPE

# --- ROLES ----
ROLES = [
    {"type": "ROLE", "key": "KOORD", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Koordinator"},
    {"type": "ROLE", "key": "KOORD_DONATION", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Koordinator (Donation Edit)"},
    {"type": "ROLE", "key": "ARZT", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Arzt"},
    {"type": "ROLE", "key": "SYSTEM", "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "System"},
    {"type": "ROLE", "key": "ADMIN", "pos": 5, "ext_sys": "", "ext_key": "", "name_default": "Admin"},
]

RECORDS = RECORDS + ROLES

# --- PRIORITY ----
PRIORITY = [
    {"type": "PRIORITY", "key": PriorityKey.LOW.value, "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Niedrig"},
    {"type": "PRIORITY", "key": PriorityKey.NORMAL.value, "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Normal"},
    {"type": "PRIORITY", "key": PriorityKey.HIGH.value, "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Hoch"},
]

RECORDS = RECORDS + PRIORITY

# --- TASK_STATUS ----
TASK_STATUS = [
    {"type": "TASK_STATUS", "key": TaskStatusKey.PENDING.value, "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Ausstehend"},
    {"type": "TASK_STATUS", "key": TaskStatusKey.COMPLETED.value, "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Abgeschlossen"},
    {"type": "TASK_STATUS", "key": TaskStatusKey.CANCELLED.value, "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "Abgebrochen"},
]

RECORDS = RECORDS + TASK_STATUS

# --- TASK_SCOPE ----
TASK_SCOPE = [
    {"type": "TASK_SCOPE", "key": TaskScopeKey.ALL.value, "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Alle"},
    {"type": "TASK_SCOPE", "key": TaskScopeKey.PATIENT.value, "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Patient"},
    {"type": "TASK_SCOPE", "key": TaskScopeKey.EPISODE.value, "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Episode"},
]

RECORDS = RECORDS + TASK_SCOPE

# ---- CONTACT ----
CONTACT = [
    {"type": "CONTACT", "key": "EMAIL", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Email"},
    {"type": "CONTACT", "key": "PHONE", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Telefon"},
    {"type": "CONTACT", "key": "SOCIAL", "pos": 6, "ext_sys": "", "ext_key": "", "name_default": "Social"},
    {"type": "CONTACT", "key": "OTHER", "pos": 7, "ext_sys": "", "ext_key": "", "name_default": "Andere"},
]

RECORDS = RECORDS + CONTACT

# --- SEX ----
SEX = [
    {"type": "SEX", "key": "F", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Female"},
    {"type": "SEX", "key": "M", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Male"},
    {"type": "SEX", "key": "X", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Other"},
]

RECORDS = RECORDS + SEX

# --- ORGAN ---

ORGAN = [
    {"type": "ORGAN", "key": "KIDNEY", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Niere"},
    {"type": "ORGAN", "key": "PANCREAS", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Pankreas"},
    {"type": "ORGAN", "key": "LIVER", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Leber"},
    {"type": "ORGAN", "key": "HEART", "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "Herz"},
    {"type": "ORGAN", "key": "HEART_VALVE", "pos": 5, "ext_sys": "", "ext_key": "", "name_default": "Heart valve"},
    {"type": "ORGAN", "key": "LUNG", "pos": 6, "ext_sys": "", "ext_key": "", "name_default": "Lunge"},
    {"type": "ORGAN", "key": "ISLET", "pos": 7, "ext_sys": "", "ext_key": "", "name_default": "Inselzellen"},
    {"type": "ORGAN", "key": "VESSELS", "pos": 8, "ext_sys": "", "ext_key": "", "name_default": "Vessels"},
    {"type": "ORGAN", "key": "INTESTINE", "pos": 9, "ext_sys": "", "ext_key": "", "name_default": "Dünndarm"},
]

RECORDS = RECORDS + ORGAN

# --- TPL_PHASE ----
TPL_PHASE = [
    {"type": "TPL_PHASE", "key": "EVALUATION", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Evaluation"},
    {"type": "TPL_PHASE", "key": "LISTING", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Listing"},
    {"type": "TPL_PHASE", "key": "TRANSPLANTATION", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Transplantation"},
    {"type": "TPL_PHASE", "key": "FOLLOW_UP", "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "Follow-Up"},
]

RECORDS = RECORDS + TPL_PHASE

# ---- TPL_STATUS ----
TPL_STATUS = [
    {"type": "TPL_STATUS", "key": "ABKLAERUNG", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Abklärung"},
    {"type": "TPL_STATUS", "key": "TRANSPLANTABEL", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Transplantabel"},
    {"type": "TPL_STATUS", "key": "ALLOZIERT", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Alloziert"},
    {"type": "TPL_STATUS", "key": "TRANSPLANTIERT", "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "Transplantiert"},
    {"type": "TPL_STATUS", "key": "VERSTORBEN", "pos": 5, "ext_sys": "", "ext_key": "", "name_default": "Verstorben"},
    {"type": "TPL_STATUS", "key": "ABGELEHNT", "pos": 6, "ext_sys": "", "ext_key": "", "name_default": "Abgelehnt"},
    {"type": "TPL_STATUS", "key": "DELISTUNG_USZ", "pos": 7, "ext_sys": "", "ext_key": "", "name_default": "Delistung USZ"},
    {"type": "TPL_STATUS", "key": "DELISTUNG_PATIENT", "pos": 8, "ext_sys": "", "ext_key": "", "name_default": "Delistung Patient"},
    {"type": "TPL_STATUS", "key": "STORNIERT", "pos": 9, "ext_sys": "", "ext_key": "", "name_default": "Storniert"},
]

RECORDS = RECORDS + TPL_STATUS

# --- COORDINATION_STATUS ----
COORDINATION_STATUS = [
    {"type": "COORDINATION_STATUS", "key": CoordinationStatusKey.OPEN.value, "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Open"},
]

RECORDS = RECORDS + COORDINATION_STATUS

# --- DEATH_KIND ----
DEATH_KIND = [
    {"type": "DEATH_KIND", "key": "DCD", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "DCD"},
    {"type": "DEATH_KIND", "key": "DBD", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "DBD"},
]

RECORDS = RECORDS + DEATH_KIND

# --- FAVORITE_TYPE ----
FAVORITE_TYPE = [
    {"type": "FAVORITE_TYPE", "key": FavoriteTypeKey.PATIENT.value, "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Patient"},
    {"type": "FAVORITE_TYPE", "key": FavoriteTypeKey.EPISODE.value, "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Episode"},
    {"type": "FAVORITE_TYPE", "key": FavoriteTypeKey.COLLOQUIUM.value, "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Colloquium"},
    {"type": "FAVORITE_TYPE", "key": FavoriteTypeKey.COORDINATION.value, "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "Coordination"},
]

RECORDS = RECORDS + FAVORITE_TYPE

