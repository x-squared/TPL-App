import type { Dispatch, SetStateAction } from 'react';
import type {
  Absence,
  AbsenceCreate,
  AbsenceUpdate,
  AppUser,
  Code,
  ContactInfo,
  ContactInfoCreate,
  ContactInfoUpdate,
  Patient,
} from '../../../api';

export interface PatientFormState {
  pid: string;
  first_name: string;
  name: string;
  date_of_birth: string;
  date_of_death: string;
  ahv_nr: string;
  lang: string;
  blood_type_id: number | null;
  resp_coord_id: number | null;
  translate: boolean;
}

export interface PatientTabProps {
  patient: Patient;
  editing: boolean;
  startEditing: () => void;
  saving: boolean;
  handleSave: () => void;
  cancelEditing: () => void;
  form: PatientFormState;
  setForm: Dispatch<SetStateAction<PatientFormState>>;
  setField: (key: keyof PatientFormState, value: string | boolean) => void;
  formatDate: (iso: string | null) => string;
  languages: Code[];
  bloodTypes: Code[];
  coordUsers: AppUser[];
  addingContact: boolean;
  setAddingContact: Dispatch<SetStateAction<boolean>>;
  sortedContactInfos: ContactInfo[];
  editingCiId: number | null;
  ciEditForm: ContactInfoUpdate;
  setCiEditForm: Dispatch<SetStateAction<ContactInfoUpdate>>;
  ciSaving: boolean;
  handleSaveCi: () => void;
  cancelEditingCi: () => void;
  ciDragId: number | null;
  ciDragOverId: number | null;
  setCiDragId: Dispatch<SetStateAction<number | null>>;
  setCiDragOverId: Dispatch<SetStateAction<number | null>>;
  handleCiDrop: (targetId: number) => void;
  startEditingCi: (ci: ContactInfo) => void;
  confirmDeleteId: number | null;
  setConfirmDeleteId: Dispatch<SetStateAction<number | null>>;
  handleDeleteContact: (contactId: number) => void;
  contactTypes: Code[];
  ciForm: ContactInfoCreate;
  setCiForm: Dispatch<SetStateAction<ContactInfoCreate>>;
  handleAddContact: () => void;
  addingAbsence: boolean;
  setAddingAbsence: Dispatch<SetStateAction<boolean>>;
  sortedAbsences: Absence[];
  editingAbId: number | null;
  abEditForm: AbsenceUpdate;
  setAbEditForm: Dispatch<SetStateAction<AbsenceUpdate>>;
  abSaving: boolean;
  handleSaveAb: () => void;
  cancelEditingAb: () => void;
  startEditingAb: (absence: Absence) => void;
  confirmDeleteAbId: number | null;
  setConfirmDeleteAbId: Dispatch<SetStateAction<number | null>>;
  handleDeleteAbsence: (id: number) => void;
  abForm: AbsenceCreate;
  setAbForm: Dispatch<SetStateAction<AbsenceCreate>>;
  handleAddAbsence: () => void;
}
