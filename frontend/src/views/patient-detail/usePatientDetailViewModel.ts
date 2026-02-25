import type { PatientDetailTab } from './PatientDetailTabs';
import type { PatientDetailTabsProps } from './PatientDetailTabs';
import { usePatientAbsences } from './hooks/usePatientAbsences';
import { usePatientContacts } from './hooks/usePatientContacts';
import { usePatientCore } from './hooks/usePatientCore';
import { usePatientDiagnoses } from './hooks/usePatientDiagnoses';
import { usePatientEpisodes } from './hooks/usePatientEpisodes';
import { usePatientMedicalValues } from './hooks/usePatientMedicalValues';
import { formatDate } from './patientDetailUtils';

export function usePatientDetailViewModel(
  patientId: number,
  initialTab?: PatientDetailTab,
  initialEpisodeId: number | null = null,
) {
  const core = usePatientCore(patientId, initialTab);
  const contacts = usePatientContacts(patientId, core.patient, core.refreshPatient);
  const absences = usePatientAbsences(core.patient, core.refreshPatient);
  const diagnoses = usePatientDiagnoses(patientId, core.patient, core.refreshPatient);
  const episodes = usePatientEpisodes(patientId, core.patient, core.refreshPatient);
  const medicalValues = usePatientMedicalValues(
    patientId,
    core.patient,
    core.refreshPatient,
    episodes.organCodes,
  );

  const tabsProps: PatientDetailTabsProps | null = core.patient
    ? {
      tab: core.tab,
      setTab: core.setTab,
      patient: core.patient,
      formatDate,
      refreshPatient: core.refreshPatient,
      initialEpisodeId,
      core: {
        editing: core.editing,
        startEditing: core.startEditing,
        saving: core.saving,
        handleSave: core.handleSave,
        cancelEditing: core.cancelEditing,
        form: core.form,
        setForm: core.setForm,
        setField: core.setField,
        languages: core.languages,
        sexCodes: core.sexCodes,
        bloodTypes: core.bloodTypes,
        coordUsers: core.coordUsers,
      },
      contacts,
      absences,
      episodes,
      diagnoses,
      medicalValues,
    }
    : null;

  return {
    loading: core.loading,
    patient: core.patient,
    tabsProps,
  };
}
