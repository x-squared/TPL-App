import { request, type AppUser, type Code } from './core';

export interface TaskGroup {
  id: number;
  patient_id: number;
  task_group_template_id: number | null;
  name: string;
  episode_id: number | null;
  colloqium_agenda_id: number | null;
  tpl_phase_id: number | null;
  tpl_phase: Code | null;
  changed_by_id: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export interface Task {
  id: number;
  task_group_id: number;
  description: string;
  priority_id: number | null;
  priority: Code | null;
  assigned_to_id: number | null;
  assigned_to: AppUser | null;
  until: string | null;
  status_id: number | null;
  status: Code | null;
  closed_at: string | null;
  closed_by_id: number | null;
  closed_by: AppUser | null;
  comment: string;
  changed_by_id: number | null;
  changed_by_user: AppUser | null;
  closed: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface TaskUpdate {
  task_group_id?: number;
  description?: string;
  priority_id?: number | null;
  assigned_to_id?: number | null;
  until?: string;
  status_id?: number | null;
  comment?: string;
}

export interface TaskCreate {
  task_group_id: number;
  description?: string;
  priority_id?: number | null;
  assigned_to_id?: number | null;
  until: string;
  status_id?: number | null;
  comment?: string;
}

export interface TaskGroupListParams {
  patient_id?: number;
  episode_id?: number;
  colloqium_agenda_id?: number;
}

export interface TaskGroupCreate {
  patient_id: number;
  task_group_template_id?: number | null;
  name?: string;
  episode_id?: number | null;
  colloqium_agenda_id?: number | null;
  tpl_phase_id?: number | null;
}

export interface TaskGroupUpdate {
  patient_id?: number;
  task_group_template_id?: number | null;
  name?: string;
  episode_id?: number | null;
  colloqium_agenda_id?: number | null;
  tpl_phase_id?: number | null;
}

export interface TaskListParams {
  task_group_id?: number;
  status_key?: string[];
}

export const tasksApi = {
  listTaskGroups: (params?: TaskGroupListParams) => {
    const query = new URLSearchParams();
    if (params?.patient_id !== undefined) query.set('patient_id', String(params.patient_id));
    if (params?.episode_id !== undefined) query.set('episode_id', String(params.episode_id));
    if (params?.colloqium_agenda_id !== undefined) query.set('colloqium_agenda_id', String(params.colloqium_agenda_id));
    return request<TaskGroup[]>(`/task-groups/${query.toString() ? `?${query.toString()}` : ''}`);
  },
  createTaskGroup: (data: TaskGroupCreate) =>
    request<TaskGroup>('/task-groups/', { method: 'POST', body: JSON.stringify(data) }),
  updateTaskGroup: (taskGroupId: number, data: TaskGroupUpdate) =>
    request<TaskGroup>(`/task-groups/${taskGroupId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  listTasks: (params?: TaskListParams) => {
    const query = new URLSearchParams();
    if (params?.task_group_id !== undefined) query.set('task_group_id', String(params.task_group_id));
    (params?.status_key ?? []).forEach((value) => query.append('status_key', value));
    return request<Task[]>(`/tasks/${query.toString() ? `?${query.toString()}` : ''}`);
  },
  createTask: (data: TaskCreate) =>
    request<Task>('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (taskId: number, data: TaskUpdate) =>
    request<Task>(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
