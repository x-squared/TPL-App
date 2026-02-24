import { request, type AppUser, type Code, type MedicalValueTemplate } from './core';

/* ── Contact Info ── */

export interface ContactInfo {
  id: number;
  patient_id: number;
  type_id: number;
  type: Code | null;
  data: string;
  comment: string;
  main: boolean;
  pos: number;
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

export interface ContactInfoUpdate {
  type_id?: number;
  data?: string;
  comment?: string;
  main?: boolean;
  pos?: number;
}

/* ── Absence ── */

export interface Absence {
  id: number;
  patient_id: number;
  start: string;
  end: string;
  comment: string;
  changed_by: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export interface AbsenceCreate {
  start: string;
  end: string;
  comment?: string;
}

export interface AbsenceUpdate {
  start?: string;
  end?: string;
  comment?: string;
}

/* ── Diagnosis ── */

export interface Diagnosis {
  id: number;
  patient_id: number;
  catalogue_id: number;
  catalogue: Code | null;
  comment: string;
  changed_by: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export interface DiagnosisCreate {
  catalogue_id: number;
  comment?: string;
}

export interface DiagnosisUpdate {
  catalogue_id?: number;
  comment?: string;
}

/* ── Medical Value ── */

export interface MedicalValue {
  id: number;
  patient_id: number;
  medical_value_template_id: number;
  medical_value_template: MedicalValueTemplate | null;
  datatype_id: number | null;
  datatype: Code | null;
  name: string;
  pos: number;
  value: string;
  renew_date: string | null;
  changed_by: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export interface MedicalValueCreate {
  medical_value_template_id?: number | null;
  datatype_id?: number | null;
  name?: string;
  pos?: number;
  value?: string;
  renew_date?: string | null;
}

export interface MedicalValueUpdate {
  medical_value_template_id?: number;
  datatype_id?: number | null;
  name?: string;
  pos?: number;
  value?: string;
  renew_date?: string | null;
}

/* ── Episode ── */

export interface Episode {
  id: number;
  patient_id: number;
  organ_id: number;
  organ: Code | null;
  start: string | null;
  end: string | null;
  fall_nr: string;
  status_id: number | null;
  status: Code | null;
  closed: boolean;
  comment: string;
  cave: string;
  eval_start: string | null;
  eval_end: string | null;
  eval_assigned_to: string;
  eval_stat: string;
  eval_register_date: string | null;
  eval_excluded: boolean;
  eval_non_list_sent: string | null;
  list_start: string | null;
  list_end: string | null;
  list_rs_nr: string;
  list_reason_delist: string;
  list_expl_delist: string;
  list_delist_sent: string | null;
  tpl_date: string | null;
  fup_recipient_card_done: boolean;
  fup_recipient_card_date: string | null;
  changed_by: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export interface EpisodeCreate {
  organ_id: number;
  start?: string | null;
  end?: string | null;
  fall_nr?: string;
  status_id?: number | null;
  closed?: boolean;
  comment?: string;
  cave?: string;
  eval_start?: string | null;
  eval_end?: string | null;
  eval_assigned_to?: string;
  eval_stat?: string;
  eval_register_date?: string | null;
  eval_excluded?: boolean;
  eval_non_list_sent?: string | null;
  list_start?: string | null;
  list_end?: string | null;
  list_rs_nr?: string;
  list_reason_delist?: string;
  list_expl_delist?: string;
  list_delist_sent?: string | null;
  tpl_date?: string | null;
  fup_recipient_card_done?: boolean;
  fup_recipient_card_date?: string | null;
}

export interface EpisodeUpdate {
  organ_id?: number;
  start?: string | null;
  end?: string | null;
  fall_nr?: string;
  status_id?: number | null;
  closed?: boolean;
  comment?: string;
  cave?: string;
  eval_start?: string | null;
  eval_end?: string | null;
  eval_assigned_to?: string;
  eval_stat?: string;
  eval_register_date?: string | null;
  eval_excluded?: boolean;
  eval_non_list_sent?: string | null;
  list_start?: string | null;
  list_end?: string | null;
  list_rs_nr?: string;
  list_reason_delist?: string;
  list_expl_delist?: string;
  list_delist_sent?: string | null;
  tpl_date?: string | null;
  fup_recipient_card_done?: boolean;
  fup_recipient_card_date?: string | null;
}

/* ── Patient ── */

export interface Patient {
  id: number;
  pid: string;
  first_name: string;
  name: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  ahv_nr: string;
  lang: string;
  blood_type_id: number | null;
  blood_type: Code | null;
  resp_coord_id: number | null;
  resp_coord: AppUser | null;
  translate: boolean;
  contact_infos: ContactInfo[];
  absences: Absence[];
  diagnoses: Diagnosis[];
  medical_values: MedicalValue[];
  episodes: Episode[];
  changed_by: number | null;
  changed_by_user: AppUser | null;
  created_at: string;
  updated_at: string | null;
}

export interface PatientListItem {
  id: number;
  pid: string;
  first_name: string;
  name: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  ahv_nr: string;
  lang: string;
  blood_type_id: number | null;
  blood_type: Code | null;
  resp_coord_id: number | null;
  resp_coord: AppUser | null;
  translate: boolean;
  contact_info_count: number;
  open_episode_count: number;
  open_episode_indicators: string[];
  episode_organ_ids: number[];
  open_episode_organ_ids: number[];
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
  blood_type_id?: number | null;
  resp_coord_id?: number | null;
  translate?: boolean;
}

/* ── API methods ── */

export const patientsApi = {
  listPatients: () => request<PatientListItem[]>('/patients/'),
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
  updateContactInfo: (patientId: number, contactId: number, data: ContactInfoUpdate) =>
    request<ContactInfo>(`/patients/${patientId}/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteContactInfo: (patientId: number, contactId: number) =>
    request<void>(`/patients/${patientId}/contacts/${contactId}`, { method: 'DELETE' }),

  listAbsences: (patientId: number) =>
    request<Absence[]>(`/patients/${patientId}/absences/`),
  createAbsence: (patientId: number, data: AbsenceCreate) =>
    request<Absence>(`/patients/${patientId}/absences/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAbsence: (patientId: number, absenceId: number, data: AbsenceUpdate) =>
    request<Absence>(`/patients/${patientId}/absences/${absenceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteAbsence: (patientId: number, absenceId: number) =>
    request<void>(`/patients/${patientId}/absences/${absenceId}`, { method: 'DELETE' }),

  listDiagnoses: (patientId: number) =>
    request<Diagnosis[]>(`/patients/${patientId}/diagnoses/`),
  createDiagnosis: (patientId: number, data: DiagnosisCreate) =>
    request<Diagnosis>(`/patients/${patientId}/diagnoses/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDiagnosis: (patientId: number, diagnosisId: number, data: DiagnosisUpdate) =>
    request<Diagnosis>(`/patients/${patientId}/diagnoses/${diagnosisId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteDiagnosis: (patientId: number, diagnosisId: number) =>
    request<void>(`/patients/${patientId}/diagnoses/${diagnosisId}`, { method: 'DELETE' }),

  listMedicalValues: (patientId: number) =>
    request<MedicalValue[]>(`/patients/${patientId}/medical-values/`),
  createMedicalValue: (patientId: number, data: MedicalValueCreate) =>
    request<MedicalValue>(`/patients/${patientId}/medical-values/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMedicalValue: (patientId: number, medicalValueId: number, data: MedicalValueUpdate) =>
    request<MedicalValue>(`/patients/${patientId}/medical-values/${medicalValueId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteMedicalValue: (patientId: number, medicalValueId: number) =>
    request<void>(`/patients/${patientId}/medical-values/${medicalValueId}`, { method: 'DELETE' }),

  listEpisodes: (patientId: number) =>
    request<Episode[]>(`/patients/${patientId}/episodes/`),
  createEpisode: (patientId: number, data: EpisodeCreate) =>
    request<Episode>(`/patients/${patientId}/episodes/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEpisode: (patientId: number, episodeId: number, data: EpisodeUpdate) =>
    request<Episode>(`/patients/${patientId}/episodes/${episodeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteEpisode: (patientId: number, episodeId: number) =>
    request<void>(`/patients/${patientId}/episodes/${episodeId}`, { method: 'DELETE' }),
};
