const BASE = '/api';

export interface Item {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ItemCreate {
  title: string;
  description?: string;
}

export interface ItemUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${res.status}: ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listItems: () => request<Item[]>('/items/'),
  getItem: (id: number) => request<Item>(`/items/${id}`),
  createItem: (data: ItemCreate) =>
    request<Item>('/items/', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id: number, data: ItemUpdate) =>
    request<Item>(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteItem: (id: number) =>
    request<void>(`/items/${id}`, { method: 'DELETE' }),
};
