from datetime import date

# ---- test patients ----
TEST = [
    {"pid": "4711", "first_name": "Hans", "name": "Test", "date_of_birth": date(1960, 1, 1), "ahv_nr": "756.9214.3658.92", "lang": "Deutsch", "translate": False, "changed_by_id": 1},
    {"pid": "4812", "first_name": "Anna", "name": "Alpha", "date_of_birth": date(1994, 4, 12), "ahv_nr": "756.1111.2222.33", "lang": "Deutsch", "translate": False, "changed_by_id": 1},
    {"pid": "4923", "first_name": "Bert", "name": "Beta", "date_of_birth": date(1942, 9, 3), "ahv_nr": "756.4444.5555.66", "lang": "Deutsch", "translate": False, "changed_by_id": 1},
]

# ---- all patients combined ----
ALL = TEST
