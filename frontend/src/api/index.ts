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
export { coordinationsApi } from './coordinations';
export type {
  Coordination,
  CoordinationCreate,
  CoordinationUpdate,
  CoordinationDonor,
  CoordinationDonorUpsert,
  CoordinationOrigin,
  CoordinationOriginUpsert,
  CoordinationTimeLog,
  CoordinationTimeLogCreate,
  CoordinationTimeLogUpdate,
  CoordinationEpisode,
} from './coordinations';
export { favoritesApi } from './favorites';
export type { Favorite, FavoriteCreate, FavoriteTypeKey } from './favorites';
export { reportsApi } from './reports';
export type {
  ReportSourceKey,
  ReportValueType,
  ReportOperatorKey,
  ReportSortDirection,
  ReportFieldOption,
  ReportSourceOption,
  ReportMetadataResponse,
  ReportFilterInput,
  ReportSortInput,
  ReportExecuteRequest,
  ReportColumn,
  ReportExecuteResponse,
} from './reports';

import { authApi, codesApi, medicalValueTemplatesApi, usersApi } from './core';
import { patientsApi } from './patients';
import { tasksApi } from './tasks';
import { colloqiumsApi } from './colloqiums';
import { coordinationsApi } from './coordinations';
import { favoritesApi } from './favorites';
import { reportsApi } from './reports';

export const api = {
  ...authApi,
  ...codesApi,
  ...medicalValueTemplatesApi,
  ...usersApi,
  ...patientsApi,
  ...tasksApi,
  ...colloqiumsApi,
  ...coordinationsApi,
  ...favoritesApi,
  ...reportsApi,
};
