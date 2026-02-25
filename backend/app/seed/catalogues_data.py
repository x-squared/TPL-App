# --- All data ---

ALL = []

# ---- KANTON ----
KANTON = [
    {"type": "KANTON", "key": "ZH", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Zürich"},
    {"type": "KANTON", "key": "BE", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Bern"},
    {"type": "KANTON", "key": "LU", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Luzern"},
]

ALL = ALL + KANTON

# ---- COUNTRY ----
COUNTRY = [
    {"type": "COUNTRY", "key": "CH", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Schweiz"},
    {"type": "COUNTRY", "key": "DE", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Deutschland"},
    {"type": "COUNTRY", "key": "AT", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Österreich"},
]

ALL = ALL + COUNTRY

# ---- LANGUAGE ----
LANGUAGE = [
    {"type": "LANGUAGE", "key": "DE", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "Deutsch"},
    {"type": "LANGUAGE", "key": "EN", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "Englisch"},
    {"type": "LANGUAGE", "key": "FR", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "Französisch"},
    {"type": "LANGUAGE", "key": "IT", "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "Italienisch"},
    {"type": "LANGUAGE", "key": "ES", "pos": 5, "ext_sys": "", "ext_key": "", "name_default": "Spanisch"},
    {"type": "LANGUAGE", "key": "PT", "pos": 6, "ext_sys": "", "ext_key": "", "name_default": "Portugiesisch"},
    {"type": "LANGUAGE", "key": "NL", "pos": 7, "ext_sys": "", "ext_key": "", "name_default": "Niederländisch"},
    {"type": "LANGUAGE", "key": "PL", "pos": 8, "ext_sys": "", "ext_key": "", "name_default": "Polnisch"},
    {"type": "LANGUAGE", "key": "RU", "pos": 9, "ext_sys": "", "ext_key": "", "name_default": "Russisch"},
    {"type": "LANGUAGE", "key": "ZH", "pos": 10, "ext_sys": "", "ext_key": "", "name_default": "Chinesisch"},
    {"type": "LANGUAGE", "key": "JA", "pos": 11, "ext_sys": "", "ext_key": "", "name_default": "Japanisch"},
    {"type": "LANGUAGE", "key": "KO", "pos": 12, "ext_sys": "", "ext_key": "", "name_default": "Koreanisch"},
]

ALL = ALL + LANGUAGE

# ---- DIAGNOSIS ----
DIAGNOSIS = [
    {"type": "DIAGNOSIS", "key": "ACU", "pos": 1, "ext_sys": "", "ext_key": "ACU", "name_default": "Acute"},
    {"type": "DIAGNOSIS", "key": "ACUTOX", "pos": 2, "ext_sys": "", "ext_key": "ACUTOX", "name_default": "Acute Toxicity"},
    {"type": "DIAGNOSIS", "key": "ALAGS", "pos": 3, "ext_sys": "", "ext_key": "ALAGS", "name_default": "Alagille Syndrome"},
    {"type": "DIAGNOSIS", "key": "ALPHTR", "pos": 4, "ext_sys": "", "ext_key": "ALPHTR", "name_default": "Alpha-1 Antitrypsin"},
    {"type": "DIAGNOSIS", "key": "AMY", "pos": 5, "ext_sys": "", "ext_key": "AMY", "name_default": "Amyloidosis"},
    {"type": "DIAGNOSIS", "key": "BC", "pos": 6, "ext_sys": "", "ext_key": "BC", "name_default": "Breast Cancer"},
    {"type": "DIAGNOSIS", "key": "BYLER", "pos": 7, "ext_sys": "", "ext_key": "BYLER", "name_default": "Byler disease"},
]

ALL = ALL + DIAGNOSIS

# ---- DIAGNOSIS_DONOR ----
DIAGNOSIS_DONOR = [
    {"type": "DIAGNOSIS_DONOR", "key": "DCD", "pos": 1, "ext_sys": "", "ext_key": "DCD", "name_default": "DCD"},
    {"type": "DIAGNOSIS_DONOR", "key": "CTR", "pos": 2, "ext_sys": "", "ext_key": "CTR", "name_default": "CTR"},
    {"type": "DIAGNOSIS_DONOR", "key": "CHE", "pos": 3, "ext_sys": "", "ext_key": "CHE", "name_default": "CHE"},
]

ALL = ALL + DIAGNOSIS_DONOR

# --- BLOOD TYPE ----
BLOOD_TYPE = [
    {"type": "BLOOD_TYPE", "key": "O", "pos": 1, "ext_sys": "", "ext_key": "", "name_default": "O"},
    {"type": "BLOOD_TYPE", "key": "O+", "pos": 2, "ext_sys": "", "ext_key": "", "name_default": "O+"},
    {"type": "BLOOD_TYPE", "key": "A-", "pos": 3, "ext_sys": "", "ext_key": "", "name_default": "A-"},
    {"type": "BLOOD_TYPE", "key": "A+", "pos": 4, "ext_sys": "", "ext_key": "", "name_default": "A+"},
    {"type": "BLOOD_TYPE", "key": "B", "pos": 5, "ext_sys": "", "ext_key": "", "name_default": "B"},
    {"type": "BLOOD_TYPE", "key": "B+", "pos": 6, "ext_sys": "", "ext_key": "", "name_default": "B+"},
    {"type": "BLOOD_TYPE", "key": "AB-", "pos": 7, "ext_sys": "", "ext_key": "", "name_default": "AB-"},
    {"type": "BLOOD_TYPE", "key": "AB+", "pos": 8, "ext_sys": "", "ext_key": "", "name_default": "AB+"},
]

ALL = ALL + BLOOD_TYPE

# ---- HOSPITAL ----
HOSPITAL = [
    {"type": "HOSPITAL", "key": "USZ", "pos": 1, "ext_sys": "", "ext_key": "USZ", "name_default": "Universitätsspital Zürich"},
    {"type": "HOSPITAL", "key": "INSEL", "pos": 2, "ext_sys": "", "ext_key": "INSEL", "name_default": "Inselspital Bern"},
    {"type": "HOSPITAL", "key": "CHUV", "pos": 3, "ext_sys": "", "ext_key": "CHUV", "name_default": "CHUV Lausanne"},
    {"type": "HOSPITAL", "key": "HUG", "pos": 4, "ext_sys": "", "ext_key": "HUG", "name_default": "HUG Genève"},
]

ALL = ALL + HOSPITAL

# ---- PROCUREMENT_EFFECT ----
PROCUREMENT_EFFECT = [
    {
        "type": "PROCUREMENT_EFFECT",
        "key": "1",
        "pos": 1,
        "ext_sys": "",
        "ext_key": "1",
        "name_default": "Procured and transplanted",
    },
    {
        "type": "PROCUREMENT_EFFECT",
        "key": "2",
        "pos": 2,
        "ext_sys": "",
        "ext_key": "2",
        "name_default": "Procured, not transplanted",
    },
    {
        "type": "PROCUREMENT_EFFECT",
        "key": "3",
        "pos": 3,
        "ext_sys": "",
        "ext_key": "3",
        "name_default": "Not procured",
    },
]

ALL = ALL + PROCUREMENT_EFFECT

# ---- ORGAN_REJECTION_SEQUEL ----
ORGAN_REJECTION_SEQUEL = [
    {
        "type": "ORGAN_REJECTION_SEQUEL",
        "key": "DISCARDED",
        "pos": 1,
        "ext_sys": "",
        "ext_key": "DISCARDED",
        "name_default": "Discarded",
    },
    {
        "type": "ORGAN_REJECTION_SEQUEL",
        "key": "RESEARCH",
        "pos": 2,
        "ext_sys": "",
        "ext_key": "RESEARCH",
        "name_default": "Used for research",
    },
    {
        "type": "ORGAN_REJECTION_SEQUEL",
        "key": "TRAINING",
        "pos": 3,
        "ext_sys": "",
        "ext_key": "TRAINING",
        "name_default": "Used for training",
    },
]

ALL = ALL + ORGAN_REJECTION_SEQUEL

# ---- Done ----
