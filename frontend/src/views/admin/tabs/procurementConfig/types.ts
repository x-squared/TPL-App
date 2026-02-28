import type { ProcurementSlotKey, ProcurementValueMode } from '../../../../api';

export interface ProcurementGroupCreatePayload {
  key: string;
  name_default: string;
  comment: string;
  is_active?: boolean;
  pos: number;
}

export interface ProcurementGroupUpdatePayload {
  key?: string;
  name_default?: string;
  comment?: string;
  is_active?: boolean;
  pos?: number;
}

export interface ProcurementFieldCreatePayload {
  key: string;
  name_default: string;
  comment: string;
  is_active?: boolean;
  pos: number;
  datatype_def_id: number;
  group_template_id?: number | null;
  value_mode: ProcurementValueMode;
}

export interface ProcurementFieldUpdatePayload {
  group_template_id?: number | null;
  comment?: string;
  is_active?: boolean;
  pos?: number;
}

export interface ProcurementScopeCreatePayload {
  field_template_id: number;
  organ_id?: number | null;
  slot_key: ProcurementSlotKey;
}
