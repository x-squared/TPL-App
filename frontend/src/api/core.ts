const BASE = '/api';
const TOKEN_KEY = 'tpl_token';

export interface AppUser {
  id: number;
  ext_id: string;
  name: string;
  role_id: number | null;
  role: Code | null;
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
  name_default: string;
  pos: number;
  use_liver: boolean;
  use_kidney: boolean;
  use_heart: boolean;
  use_lung: boolean;
  use_donor: boolean;
}

export const authApi = {
  login: (ext_id: string) =>
    request<{ token: string; user: AppUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ext_id }),
    }),
  getMe: () => request<AppUser>('/auth/me'),
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

export const usersApi = {
  listUsers: (roleKey?: string) =>
    request<AppUser[]>(`/users/${roleKey ? `?role_key=${encodeURIComponent(roleKey)}` : ''}`),
};
