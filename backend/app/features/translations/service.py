from __future__ import annotations

import json

from sqlalchemy.orm import Session

from ...models import TranslationBundle
from ...schemas import TranslationOverridesResponse, TranslationOverridesUpdate


def _normalize_locale(locale: str) -> str:
    normalized = (locale or "").strip().lower()
    return normalized or "en"


def get_translation_overrides(*, locale: str, db: Session) -> TranslationOverridesResponse:
    target_locale = _normalize_locale(locale)
    entries: dict[str, str] = {}
    row = db.query(TranslationBundle).filter(TranslationBundle.locale == target_locale).first()
    if row and row.payload_json:
        try:
            payload = json.loads(row.payload_json)
            if isinstance(payload, dict):
                for key, value in payload.items():
                    normalized_key = (str(key) if isinstance(key, str) else "").strip()
                    normalized_text = (str(value) if isinstance(value, str) else "").strip()
                    if normalized_key and normalized_text:
                        entries[normalized_key] = normalized_text
        except json.JSONDecodeError:
            entries = {}
    return TranslationOverridesResponse(locale=target_locale, entries=entries)


def replace_translation_overrides(
    *,
    locale: str,
    payload: TranslationOverridesUpdate,
    changed_by_id: int,
    db: Session,
) -> TranslationOverridesResponse:
    target_locale = _normalize_locale(locale)
    entries = payload.entries or {}
    normalized_entries: dict[str, str] = {}
    for key, text in entries.items():
        normalized_key = (str(key) if isinstance(key, str) else "").strip()
        normalized_text = (str(text) if isinstance(text, str) else "").strip()
        if not normalized_key or not normalized_text:
            continue
        normalized_entries[normalized_key] = normalized_text
    row = db.query(TranslationBundle).filter(TranslationBundle.locale == target_locale).first()
    if row is None:
        row = TranslationBundle(
            locale=target_locale,
            payload_json=json.dumps(normalized_entries, ensure_ascii=False, sort_keys=True),
            changed_by_id=changed_by_id,
        )
        db.add(row)
    else:
        row.payload_json = json.dumps(normalized_entries, ensure_ascii=False, sort_keys=True)
        row.changed_by_id = changed_by_id
        db.add(row)
    db.commit()
    return get_translation_overrides(locale=target_locale, db=db)
