import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type {
  Code,
  Diagnosis,
  DiagnosisCreate,
  DiagnosisUpdate,
  MedicalValue,
  MedicalValueCreate,
  MedicalValueTemplate,
  MedicalValueUpdate,
  Patient,
} from '../../../api';
import type { PatientFormState } from '../patient/types';

export interface MedicalDataTabProps {
  patient: Patient;
  editing: boolean;
  startEditing: () => void;
  saving: boolean;
  handleSave: () => void;
  cancelEditing: () => void;
  form: PatientFormState;
  setForm: Dispatch<SetStateAction<PatientFormState>>;
  bloodTypes: Code[];
  addingDiag: boolean;
  setAddingDiag: Dispatch<SetStateAction<boolean>>;
  diagCodes: Code[];
  diagForm: DiagnosisCreate;
  setDiagForm: Dispatch<SetStateAction<DiagnosisCreate>>;
  diagSaving: boolean;
  handleAddDiag: () => void;
  editingDiagId: number | null;
  diagEditForm: DiagnosisUpdate;
  setDiagEditForm: Dispatch<SetStateAction<DiagnosisUpdate>>;
  handleSaveDiag: () => void;
  cancelEditingDiag: () => void;
  startEditingDiag: (diagnosis: { id: number; catalogue_id: number; comment: string }) => void;
  confirmDeleteDiagId: number | null;
  setConfirmDeleteDiagId: Dispatch<SetStateAction<number | null>>;
  handleDeleteDiag: (id: number) => void;
  formatDate: (iso: string | null) => string;
  addingMv: boolean;
  setAddingMv: Dispatch<SetStateAction<boolean>>;
  handleAddAllMv: () => void;
  mvSaving: boolean;
  sortedMedicalValues: MedicalValue[];
  toggleMvSort: (key: 'pos' | 'name' | 'renew_date') => void;
  mvSortIndicator: (key: 'pos' | 'name' | 'renew_date') => string;
  editingMvId: number | null;
  mvEditForm: MedicalValueUpdate;
  setMvEditForm: Dispatch<SetStateAction<MedicalValueUpdate>>;
  mvTemplates: MedicalValueTemplate[];
  renderValueInput: (value: string, dt: Code | null, onChange: (v: string) => void, className: string) => ReactNode;
  resolveDt: (templateId?: number | null, datatypeId?: number | null) => Code | null;
  handleSaveMv: () => void;
  cancelEditingMv: () => void;
  validateValue: (value: string, dt: Code | null) => boolean;
  confirmDeleteMvId: number | null;
  setConfirmDeleteMvId: Dispatch<SetStateAction<number | null>>;
  handleDeleteMv: (id: number) => void;
  startEditingMv: (mv: { id: number; medical_value_template_id: number; name: string; value: string; renew_date: string | null }) => void;
  mvSortKey: 'pos' | 'name' | 'renew_date';
  mvSortAsc: boolean;
  mvDragId: number | null;
  mvDragOverId: number | null;
  setMvDragId: Dispatch<SetStateAction<number | null>>;
  setMvDragOverId: Dispatch<SetStateAction<number | null>>;
  handleMvDrop: (targetId: number) => void;
  formatValue: (value: string, datatype: Code | null, catalogueEntries?: Code[]) => string;
  catalogueCache: Record<string, Code[]>;
  getCatalogueType: (datatype: Code | null) => string;
  mvAddMode: 'template' | 'custom';
  setMvAddMode: Dispatch<SetStateAction<'template' | 'custom'>>;
  mvForm: MedicalValueCreate;
  setMvForm: Dispatch<SetStateAction<MedicalValueCreate>>;
  datatypeCodes: Code[];
  handleAddMv: () => void;
}
