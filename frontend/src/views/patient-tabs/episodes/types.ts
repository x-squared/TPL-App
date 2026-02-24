import type { Dispatch, SetStateAction } from 'react';
import type { Code, Episode, EpisodeCreate, EpisodeUpdate, Patient } from '../../../api';

export type EpisodeDetailTab = 'Evaluation' | 'Listing' | 'Transplantation' | 'Follow-Up' | 'Closed';

export type EpisodeMetaForm = {
  comment: string;
  cave: string;
};

export type EpisodeDetailForm = Record<string, string | boolean | null>;

export interface EpisodesTabProps {
  patient: Patient;
  addingEpisode: boolean;
  setAddingEpisode: Dispatch<SetStateAction<boolean>>;
  editingEpId: number | null;
  epEditForm: EpisodeUpdate;
  setEpEditForm: Dispatch<SetStateAction<EpisodeUpdate>>;
  epSaving: boolean;
  handleSaveEp: () => void;
  cancelEditingEp: () => void;
  startEditingEp: (ep: Episode) => void;
  confirmDeleteEpId: number | null;
  setConfirmDeleteEpId: Dispatch<SetStateAction<number | null>>;
  handleDeleteEpisode: (id: number) => void;
  organCodes: Code[];
  tplStatusCodes: Code[];
  epForm: EpisodeCreate;
  setEpForm: Dispatch<SetStateAction<EpisodeCreate>>;
  handleAddEpisode: () => void;
  formatDate: (iso: string | null) => string;
  refreshPatient: () => Promise<void>;
}
