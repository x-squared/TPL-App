const BASE = '/api';
const TOKEN_KEY = 'tpl_token';

export interface AppUser {
  id: number;
  ext_id: string;
  name: string;
  profile: string;
}

export interface Code {
  id: number;
  type: string;
  key: string;
  pos: number;
  ext_key: string;
  name_default: string;
}

export interface Item {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  code_id: number | null;
  code: Code | null;
  changed_by: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export interface ItemCreate {
  title: string;
  description?: string;
  code_id?: number | null;
}

export interface ItemUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
  code_id?: number | null;
}

export interface ContactInfo {
  id: number;
  patient_id: number;
  type_id: number;
  type: Code | null;
  data: string;
  comment: string;
  main: boolean;
  changed_by: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export interface ContactInfoCreate {
  type_id: number;
  data: string;
  comment?: string;
  main?: boolean;
}

export interface Patient {
  id: number;
  pid: string;
  first_name: string;
  name: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  ahv_nr: string;
  lang: string;
  translate: boolean;
  contact_infos: ContactInfo[];
  changed_by: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export interface PatientCreate {
  pid: string;
  first_name: string;
  name: string;
  date_of_birth?: string | null;
  date_of_death?: string | null;
  ahv_nr?: string;
  translate?: boolean;
}

export interface PatientUpdate {
  pid?: string;
  first_name?: string;
  name?: string;
  date_of_birth?: string | null;
  date_of_death?: string | null;
  ahv_nr?: string;
  lang?: string;
  translate?: boolean;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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

export const api = {
  login: (ext_id: string) =>
    request<{ token: string; user: AppUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ext_id }),
    }),
  getMe: () => request<AppUser>('/auth/me'),

  listItems: () => request<Item[]>('/items/'),
  getItem: (id: number) => request<Item>(`/items/${id}`),
  createItem: (data: ItemCreate) =>
    request<Item>('/items/', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id: number, data: ItemUpdate) =>
    request<Item>(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteItem: (id: number) =>
    request<void>(`/items/${id}`, { method: 'DELETE' }),
  listCodes: (type?: string) =>
    request<Code[]>(`/codes/${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  listCatalogues: (type?: string) =>
    request<Code[]>(`/catalogues/${type ? `?type=${encodeURIComponent(type)}` : ''}`),

  listPatients: () => request<Patient[]>('/patients/'),
  getPatient: (id: number) => request<Patient>(`/patients/${id}`),
  createPatient: (data: PatientCreate) =>
    request<Patient>('/patients/', { method: 'POST', body: JSON.stringify(data) }),
  updatePatient: (id: number, data: PatientUpdate) =>
    request<Patient>(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePatient: (id: number) =>
    request<void>(`/patients/${id}`, { method: 'DELETE' }),

  listContactInfos: (patientId: number) =>
    request<ContactInfo[]>(`/patients/${patientId}/contacts/`),
  createContactInfo: (patientId: number, data: ContactInfoCreate) =>
    request<ContactInfo>(`/patients/${patientId}/contacts/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteContactInfo: (patientId: number, contactId: number) =>
    request<void>(`/patients/${patientId}/contacts/${contactId}`, { method: 'DELETE' }),
};
