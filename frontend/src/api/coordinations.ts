import { request, type AppUser, type Code } from './core';

export interface Coordination {
  id: number;
  start: string | null;
  end: string | null;
  status_id: number;
  status: Code | null;
  donor_nr: string;
  swtpl_nr: string;
  national_coordinator: string;
  comment: string;
  changed_by_id: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export interface CoordinationCreate {
  start?: string | null;
  end?: string | null;
  status_id?: number | null;
  donor_nr?: string;
  swtpl_nr?: string;
  national_coordinator?: string;
  comment?: string;
}

export interface CoordinationUpdate {
  start?: string | null;
  end?: string | null;
  status_id?: number | null;
  donor_nr?: string;
  swtpl_nr?: string;
  national_coordinator?: string;
  comment?: string;
}

export interface CoordinationDonor {
  id: number;
  coordination_id: number;
  full_name: string;
  sex_id: number | null;
  birth_date: string | null;
  blood_type_id: number | null;
  height: number | null;
  weight: number | null;
  organ_fo: string;
  diagnosis_id: number | null;
  death_kind_id: number | null;
  death_kind: Code | null;
}

export interface CoordinationDonorUpsert {
  full_name?: string;
  sex_id?: number | null;
  birth_date?: string | null;
  blood_type_id?: number | null;
  height?: number | null;
  weight?: number | null;
  organ_fo?: string;
  diagnosis_id?: number | null;
  death_kind_id?: number | null;
}

export interface CoordinationOrigin {
  id: number;
  coordination_id: number;
  detection_hospital_id: number | null;
  procurement_hospital_id: number | null;
  detection_hospital: Code | null;
  procurement_hospital: Code | null;
  organs_declined: boolean;
}

export interface CoordinationOriginUpsert {
  detection_hospital_id?: number | null;
  procurement_hospital_id?: number | null;
}

export interface CoordinationTimeLog {
  id: number;
  coordination_id: number;
  user_id: number;
  user: AppUser | null;
  start: string | null;
  end: string | null;
  comment: string;
  changed_by_id: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export interface CoordinationTimeLogCreate {
  user_id: number;
  start: string | null;
  end: string | null;
  comment?: string;
}

export interface CoordinationTimeLogUpdate {
  user_id?: number;
  start?: string | null;
  end?: string | null;
  comment?: string;
}

export interface CoordinationProtocolEventLog {
  id: number;
  coordination_id: number;
  organ_id: number;
  organ: Code | null;
  event: string;
  time: string;
  task_id: number | null;
  changed_by_id: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export interface CoordinationProtocolEventLogCreate {
  organ_id: number;
  event: string;
  task_id?: number | null;
}

export interface CoordinationEpisodeLinkedEpisode {
  id: number;
  patient_id: number;
  fall_nr: string;
  tpl_date: string | null;
  list_rs_nr: string;
}

export interface CoordinationEpisode {
  id: number;
  coordination_id: number;
  episode_id: number;
  organ_id: number;
  organ: Code | null;
  episode: CoordinationEpisodeLinkedEpisode | null;
  tpl_date: string | null;
  procurement_team: string;
  exvivo_perfusion_done: boolean;
  is_organ_rejected: boolean;
  organ_rejection_sequel_id: number | null;
  changed_by_id: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export const coordinationsApi = {
  listCoordinations: () => request<Coordination[]>('/coordinations/'),
  createCoordination: (data: CoordinationCreate) =>
    request<Coordination>('/coordinations/', { method: 'POST', body: JSON.stringify(data) }),
  getCoordination: (id: number) => request<Coordination>(`/coordinations/${id}`),
  updateCoordination: (id: number, data: CoordinationUpdate) =>
    request<Coordination>(`/coordinations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getCoordinationDonor: (coordinationId: number) =>
    request<CoordinationDonor>(`/coordinations/${coordinationId}/donor/`),
  upsertCoordinationDonor: (coordinationId: number, data: CoordinationDonorUpsert) =>
    request<CoordinationDonor>(`/coordinations/${coordinationId}/donor/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getCoordinationOrigin: (coordinationId: number) =>
    request<CoordinationOrigin>(`/coordinations/${coordinationId}/origin/`),
  upsertCoordinationOrigin: (coordinationId: number, data: CoordinationOriginUpsert) =>
    request<CoordinationOrigin>(`/coordinations/${coordinationId}/origin/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  listCoordinationTimeLogs: (coordinationId: number) =>
    request<CoordinationTimeLog[]>(`/coordinations/${coordinationId}/time-logs/`),
  createCoordinationTimeLog: (coordinationId: number, data: CoordinationTimeLogCreate) =>
    request<CoordinationTimeLog>(`/coordinations/${coordinationId}/time-logs/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCoordinationTimeLog: (coordinationId: number, logId: number, data: CoordinationTimeLogUpdate) =>
    request<CoordinationTimeLog>(`/coordinations/${coordinationId}/time-logs/${logId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCoordinationTimeLog: (coordinationId: number, logId: number) =>
    request<void>(`/coordinations/${coordinationId}/time-logs/${logId}`, { method: 'DELETE' }),

  listCoordinationProtocolEvents: (coordinationId: number, organId: number) =>
    request<CoordinationProtocolEventLog[]>(`/coordinations/${coordinationId}/protocol-events/?organ_id=${organId}`),
  createCoordinationProtocolEvent: (coordinationId: number, data: CoordinationProtocolEventLogCreate) =>
    request<CoordinationProtocolEventLog>(`/coordinations/${coordinationId}/protocol-events/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listCoordinationEpisodes: (coordinationId: number) =>
    request<CoordinationEpisode[]>(`/coordinations/${coordinationId}/episodes/`),
};
