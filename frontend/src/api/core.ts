const BASE = '/api';
const TOKEN_KEY = 'tpl_token';

export interface AppUser {
  id: number;
  ext_id: string;
  name: string;
  role_id: number | null;
  role_ids: number[];
  role: Code | null;
  roles: Code[];
  permissions: string[];
}

export interface HealthInfo {
  status: string;
  env?: string;
  dev_tools_enabled?: boolean;
}

export interface Code {
  id: number;
  type: string;
  key: string;
  pos: number;
  ext_sys: string;
  ext_key: string;
  name_default: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { headers, ...init });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${res.status}: ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface MedicalValueTemplate {
  id: number;
  lab_key: string;
  kis_key: string;
  datatype_id: number;
  datatype: Code | null;
  datatype_def_id: number | null;
  datatype_definition: DatatypeDefinition | null;
  name_default: string;
  pos: number;
  is_main: boolean;
  medical_value_group_id: number | null;
  medical_value_group_template: MedicalValueGroup | null;
  context_templates: MedicalValueTemplateContextTemplate[];
}

export interface MedicalValueGroup {
  id: number;
  key: string;
  name_default: string;
  pos: number;
  renew_date: string | null;
  context_templates: MedicalValueGroupContextTemplate[];
}

export interface MedicalValueGroupInstance {
  id: number;
  patient_id: number;
  medical_value_group_id: number;
  medical_value_group_template: MedicalValueGroup | null;
  context_key: string;
  organ_id: number | null;
  is_donor_context: boolean;
  renew_date: string | null;
}

export interface MedicalValueGroupUpdate {
  name_default?: string;
  pos?: number;
  renew_date?: string | null;
}

export interface MedicalValueGroupContextTemplate {
  id: number;
  medical_value_group_id: number;
  context_kind: 'STATIC' | 'ORGAN' | 'DONOR' | string;
  organ_id: number | null;
  organ: Code | null;
}

export interface MedicalValueTemplateContextTemplate {
  id: number;
  medical_value_template_id: number;
  context_kind: 'STATIC' | 'ORGAN' | 'DONOR' | string;
  organ_id: number | null;
  organ: Code | null;
}

export interface DatatypeDefinition {
  id: number;
  code_id: number;
  code: Code | null;
  primitive_kind: string;
  unit: string | null;
  format_pattern: string | null;
  validation_regex: string | null;
  min_value: string | null;
  max_value: string | null;
  precision: number | null;
  catalogue_type: string | null;
}

export interface AccessPermission {
  id: number;
  key: string;
  name_default: string;
}

export interface AccessControlMatrix {
  roles: Code[];
  permissions: AccessPermission[];
  role_permissions: Record<string, string[]>;
}

export const authApi = {
  login: (ext_id: string) =>
    request<{ token: string; user: AppUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ext_id }),
    }),
  getMe: () => request<AppUser>('/auth/me'),
  getHealth: () => request<HealthInfo>('/health'),
};

export const codesApi = {
  listCodes: (type?: string) =>
    request<Code[]>(`/codes/${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  listCatalogues: (type?: string) =>
    request<Code[]>(`/catalogues/${type ? `?type=${encodeURIComponent(type)}` : ''}`),
};

export const medicalValueTemplatesApi = {
  listMedicalValueTemplates: () => request<MedicalValueTemplate[]>('/medical-value-templates/'),
  getMedicalValueTemplate: (id: number) => request<MedicalValueTemplate>(`/medical-value-templates/${id}`),
};

export const medicalValueGroupsApi = {
  listMedicalValueGroups: () => request<MedicalValueGroup[]>('/medical-value-groups/'),
  updateMedicalValueGroup: (id: number, data: MedicalValueGroupUpdate) =>
    request<MedicalValueGroup>(`/medical-value-groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const usersApi = {
  listUsers: (roleKey?: string) =>
    request<AppUser[]>(`/users/${roleKey ? `?role_key=${encodeURIComponent(roleKey)}` : ''}`),
};

export const adminAccessApi = {
  getAccessControlMatrix: () => request<AccessControlMatrix>('/admin/access/matrix'),
  updateRolePermissions: (roleKey: string, permissionKeys: string[]) =>
    request<AccessControlMatrix>(`/admin/access/roles/${encodeURIComponent(roleKey)}`, {
      method: 'PUT',
      body: JSON.stringify({ permission_keys: permissionKeys }),
    }),
};
