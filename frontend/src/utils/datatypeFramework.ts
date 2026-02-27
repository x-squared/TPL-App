import type { Code, DatatypeDefinition } from '../api';

interface DatatypeConfig {
  inputType: 'number' | 'text' | 'date' | 'boolean' | 'catalogue';
  step?: string;
  unit?: string;
  placeholder?: string;
}

const KNOWN: Record<string, DatatypeConfig> = {
  INTEGER:  { inputType: 'number', step: '1' },
  DECIMAL:  { inputType: 'number', step: 'any' },
  STRING:   { inputType: 'text' },
  DATE:     { inputType: 'date' },
  BOOLEAN:  { inputType: 'boolean' },
  KG:       { inputType: 'number', step: 'any', unit: 'kg' },
  CM:       { inputType: 'number', step: '1', unit: 'cm' },
  BP:       { inputType: 'text', unit: 'mmHg', placeholder: '120/80' },
};

const FALLBACK: DatatypeConfig = { inputType: 'text' };

export function getConfig(dt: Code | null | undefined): DatatypeConfig {
  if (!dt) return FALLBACK;
  if (isCatalogueDatatype(dt)) return { inputType: 'catalogue' };
  return KNOWN[dt.key] ?? FALLBACK;
}

export function getConfigFromMetadata(
  dt: Code | null | undefined,
  metadata: DatatypeDefinition | null | undefined,
): DatatypeConfig {
  if (!metadata) return getConfig(dt);
  const kind = metadata.primitive_kind?.toLowerCase() ?? 'text';
  const inputType: DatatypeConfig['inputType'] =
    kind === 'number' ? 'number'
      : kind === 'date' ? 'date'
        : kind === 'boolean' ? 'boolean'
          : kind === 'catalogue' ? 'catalogue'
            : 'text';
  return {
    inputType,
    unit: metadata.unit ?? undefined,
    placeholder: metadata.format_pattern ?? undefined,
    step: inputType === 'number' && metadata.precision !== null ? 'any' : undefined,
  };
}

export function isCatalogueDatatype(dt: Code | null | undefined): boolean {
  return dt?.ext_sys === 'CATALOGUE' && !!dt.ext_key;
}

export function getCatalogueType(dt: Code | null | undefined): string {
  return dt?.ext_key ?? '';
}

function formatDateValue(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export function formatValue(
  value: string | null | undefined,
  dt: Code | null | undefined,
  catalogueEntries?: Code[],
): string {
  if (!value && value !== '0') return '–';
  const cfg = getConfig(dt);

  if (cfg.inputType === 'catalogue' && catalogueEntries) {
    const entry = catalogueEntries.find((c) => c.key === value);
    return entry?.name_default ?? value;
  }
  if (cfg.inputType === 'boolean') {
    return value === 'true' ? 'Yes' : value === 'false' ? 'No' : value;
  }
  if (cfg.inputType === 'date') {
    return formatDateValue(value);
  }
  if (cfg.unit) {
    return `${value} ${cfg.unit}`;
  }
  return value;
}

export function validateValue(
  value: string | null | undefined,
  dt: Code | null | undefined,
): boolean {
  if (!value) return true;
  const cfg = getConfig(dt);
  const key = dt?.key ?? '';

  switch (key) {
    case 'INTEGER':
      return /^-?\d+$/.test(value);
    case 'DECIMAL':
    case 'KG':
    case 'CM':
      return /^-?\d+(\.\d+)?$/.test(value);
    case 'BP':
      return /^\d{2,3}\/\d{2,3}$/.test(value);
    case 'DATE':
      return !isNaN(Date.parse(value));
    case 'BOOLEAN':
      return value === 'true' || value === 'false';
    default:
      if (cfg.inputType === 'catalogue') return true;
      return true;
  }
}
