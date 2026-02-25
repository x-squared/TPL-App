export { getToken, setToken, clearToken, authApi, codesApi, medicalValueTemplatesApi, usersApi } from './core';
export type { AppUser, Code, MedicalValueTemplate } from './core';

export { patientsApi } from './patients';
export type {
  ContactInfo, ContactInfoCreate, ContactInfoUpdate,
  Absence, AbsenceCreate, AbsenceUpdate,
  Diagnosis, DiagnosisCreate, DiagnosisUpdate,
  MedicalValue, MedicalValueCreate, MedicalValueUpdate,
  Episode, EpisodeCreate, EpisodeUpdate,
  Patient, PatientListItem, PatientCreate, PatientUpdate,
} from './patients';
export { tasksApi } from './tasks';
export type { Task, TaskCreate, TaskGroup, TaskGroupCreate, TaskGroupListParams, TaskGroupUpdate, TaskListParams, TaskUpdate } from './tasks';
export { colloqiumsApi } from './colloqiums';
export type {
  Colloqium,
  ColloqiumAgenda,
  ColloqiumAgendaCreate,
  ColloqiumAgendaUpdate,
  ColloqiumCreate,
  ColloqiumTypeUpdate,
  ColloqiumUpdate,
  ColloqiumType,
} from './colloqiums';

import { authApi, codesApi, medicalValueTemplatesApi, usersApi } from './core';
import { patientsApi } from './patients';
import { tasksApi } from './tasks';
import { colloqiumsApi } from './colloqiums';

export const api = {
  ...authApi,
  ...codesApi,
  ...medicalValueTemplatesApi,
  ...usersApi,
  ...patientsApi,
  ...tasksApi,
  ...colloqiumsApi,
};
