# ---- KOORD ----
KOORD = [
    {"ext_id": "TKOORD", "name": "TKo", "role_key": "KOORD"},
    {"ext_id": "TALL", "name": "TAll", "role_keys": ["KOORD", "KOORD_DONATION", "ARZT", "SYSTEM", "ADMIN"]},
]

# ---- ARZT ----
ARZT = [
    {"ext_id": "TARZT", "name": "TA", "role_key": "ARZT"},
]

ADMIN = [
    {"ext_id": "TADMIN", "name": "TAdmin", "role_key": "ADMIN"},
]

RECORDS = [*KOORD, *ARZT, *ADMIN]

