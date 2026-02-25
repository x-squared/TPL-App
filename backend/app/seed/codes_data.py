# --- All data ---

ALL = []

# ---- DATATYPE ----
DATATYPE = [
    {"type": "DATATYPE", "key": "INTEGER", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Ganzzahl"},
    {"type": "DATATYPE", "key": "DECIMAL", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Dezimal"},
    {"type": "DATATYPE", "key": "STRING", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "String"},
    {"type": "DATATYPE", "key": "DATE", "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "Datum"},
    {"type": "DATATYPE", "key": "BOOLEAN", "pos": 5, "ext_sys": "", "ext_key": "", "name_default": "Boolsch"},
    {"type": "DATATYPE", "key": "KG", "pos": 6, "ext_sys": "", "ext_key": "", "name_default": "Kilogramm"},
    {"type": "DATATYPE", "key": "CM", "pos": 7, "ext_sys": "", "ext_key": "", "name_default": "Zentimeter"},
    {"type": "DATATYPE", "key": "BLOOD_TYPE", "pos": 8, "ext_sys": "CATALOGUE", "ext_key": "BLOOD_TYPE", "name_default": "Blutgruppe"},
    {"type": "DATATYPE", "key": "BP", "pos": 9, "ext_sys": "", "ext_key": "", "name_default": "Blutdruck"},
]

ALL = ALL + DATATYPE

# --- ROLES ----
ROLES = [
    {"type": "ROLE", "key": "KOORD", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Koordinator"},
    {"type": "ROLE", "key": "ARZT", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Arzt"},
    {"type": "ROLE", "key": "SYSTEM", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "System"},
]

ALL = ALL + ROLES

# --- PRIORITY ----
PRIORITY = [
    {"type": "PRIORITY", "key": "LOW", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Niedrig"},
    {"type": "PRIORITY", "key": "NORMAL", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Normal"},
    {"type": "PRIORITY", "key": "HIGH", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Hoch"},
]

ALL = ALL + PRIORITY

# --- TASK_STATUS ----
TASK_STATUS = [
    {"type": "TASK_STATUS", "key": "PENDING", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Ausstehend"},
    {"type": "TASK_STATUS", "key": "COMPLETED", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Abgeschlossen"},
    {"type": "TASK_STATUS", "key": "CANCELLED", "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "Abgebrochen"},
]

ALL = ALL + TASK_STATUS

# --- TASK_SCOPE ----
TASK_SCOPE = [
    {"type": "TASK_SCOPE", "key": "ALL", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Alle"},
    {"type": "TASK_SCOPE", "key": "PATIENT", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Patient"},
    {"type": "TASK_SCOPE", "key": "EPISODE", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Episode"},
]

ALL = ALL + TASK_SCOPE

# ---- CONTACT ----
CONTACT = [
    {"type": "CONTACT", "key": "EMAIL", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Email"},
    {"type": "CONTACT", "key": "PHONE", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Telefon"},
    {"type": "CONTACT", "key": "SOCIAL", "pos": 6, "ext_sys": "", "ext_key": "", "name_default": "Social"},
    {"type": "CONTACT", "key": "OTHER", "pos": 7, "ext_sys": "", "ext_key": "", "name_default": "Andere"},
]

ALL = ALL + CONTACT

# --- SEX ----
SEX = [
    {"type": "SEX", "key": "F", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Female"},
    {"type": "SEX", "key": "M", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Male"},
    {"type": "SEX", "key": "X", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Other"},
]

ALL = ALL + SEX

# --- ORGAN ---

ORGAN = [
    {"type": "ORGAN", "key": "KIDNEY", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Niere"},
    {"type": "ORGAN", "key": "PANCREAS", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Pankreas"},
    {"type": "ORGAN", "key": "ISLET", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Inselzellen"},
    {"type": "ORGAN", "key": "LIVER", "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "Leber"},
    {"type": "ORGAN", "key": "LUNG", "pos": 5, "ext_sys": "", "ext_key": "", "name_default": "Lunge"},
    {"type": "ORGAN", "key": "HEART", "pos": 6, "ext_sys": "", "ext_key": "", "name_default": "Herz"},
    {"type": "ORGAN", "key": "INTESTINE", "pos": 7, "ext_sys": "", "ext_key": "", "name_default": "Dünndarm"},
    {"type": "ORGAN", "key": "VESSELS", "pos": 8, "ext_sys": "", "ext_key": "", "name_default": "Vessels"},
    {"type": "ORGAN", "key": "HEART_VALVE", "pos": 9, "ext_sys": "", "ext_key": "", "name_default": "Heart valve"},
]

ALL = ALL + ORGAN

# --- TPL_PHASE ----
TPL_PHASE = [
    {"type": "TPL_PHASE", "key": "EVALUATION", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Evaluation"},
    {"type": "TPL_PHASE", "key": "LISTING", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Listing"},
    {"type": "TPL_PHASE", "key": "TRANSPLANTATION", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Transplantation"},
    {"type": "TPL_PHASE", "key": "FOLLOW_UP", "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "Follow-Up"},
]

ALL = ALL + TPL_PHASE

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

ALL = ALL + TPL_STATUS

# --- COORDINATION_STATUS ----
COORDINATION_STATUS = [
    {"type": "COORDINATION_STATUS", "key": "OPEN", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Open"},
]

ALL = ALL + COORDINATION_STATUS

# --- DEATH_KIND ----
DEATH_KIND = [
    {"type": "DEATH_KIND", "key": "DCD", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "DCD"},
    {"type": "DEATH_KIND", "key": "DBD", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "DBD"},
]

ALL = ALL + DEATH_KIND

# ---- Done ----
