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

import { authApi, codesApi, medicalValueTemplatesApi, usersApi } from './core';
import { patientsApi } from './patients';

export const api = {
  ...authApi,
  ...codesApi,
  ...medicalValueTemplatesApi,
  ...usersApi,
  ...patientsApi,
};
