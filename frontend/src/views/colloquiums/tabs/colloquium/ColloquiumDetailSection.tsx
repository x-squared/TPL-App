import type { Colloqium, ColloqiumAgenda, PatientListItem } from '../../../../api';
import ColloquiumAgendaTable from './ColloquiumAgendaTable';
import EpisodePickerDialog from './EpisodePickerDialog';

interface EpisodeChoice {
  episodeId: number;
  patientId: number;
  fallNr: string;
  start: string | null;
  end: string | null;
}

interface PickerRow {
  patient: PatientListItem;
  episodes: EpisodeChoice[];
}

interface EpisodePreview {
  episodeId: number;
  patientName: string;
  patientFirstName: string;
  patientPid: string;
  fallNr: string;
  organName: string;
  statusName: string;
  start: string | null;
  end: string | null;
}

interface Props {
  colloqium: Colloqium;
  draftName: string;
  draftDate: string;
  draftParticipants: string;
  loadingAgendas: boolean;
  agendas: ColloqiumAgenda[];
  editingAgendaId: number | null;
  savingAgenda: boolean;
  deletingAgendaId: number | null;
  editingAgendaForm: {
    episode_id: number | null;
    episode_ids: number[];
    presented_by: string;
    decision: string;
    comment: string;
  };
  selectedEpisodePreviews: EpisodePreview[];
  selectedEpisodeLabel: string;
  pickerOpen: boolean;
  pickerRows: PickerRow[];
  pickerLoading: boolean;
  pickerNonSelectableEpisodeIds: number[];
  patientsById: Record<number, PatientListItem>;
  onStartAddAgenda: () => void;
  onStartEditAgenda: (agenda: ColloqiumAgenda) => void;
  onCancelEditAgenda: () => void;
  onSaveAgenda: () => void;
  onDeleteAgenda: (agendaId: number) => void;
  onPickEpisode: () => void;
  onPickEpisodeClose: () => void;
  onPickEpisodeConfirm: (episodeIds: number[]) => void;
  onAgendaFormChange: (patch: Partial<{
    episode_id: number | null;
    episode_ids: number[];
    presented_by: string;
    decision: string;
    comment: string;
  }>) => void;
  onChangeName: (value: string) => void;
  onChangeDate: (value: string) => void;
  onChangeParticipants: (value: string) => void;
  onSaveGeneralDetails: () => void;
  onStartGeneralEditing: () => void;
  onCancelGeneralEditing: () => void;
  generalEditing: boolean;
  savingGeneral: boolean;
  generalDirty: boolean;
  generalSaveError: string;
}

export default function ColloquiumDetailSection({
  colloqium,
  draftName,
  draftDate,
  draftParticipants,
  loadingAgendas,
  agendas,
  editingAgendaId,
  savingAgenda,
  deletingAgendaId,
  editingAgendaForm,
  selectedEpisodePreviews,
  selectedEpisodeLabel,
  pickerOpen,
  pickerRows,
  pickerLoading,
  pickerNonSelectableEpisodeIds,
  patientsById,
  onStartAddAgenda,
  onStartEditAgenda,
  onCancelEditAgenda,
  onSaveAgenda,
  onDeleteAgenda,
  onPickEpisode,
  onPickEpisodeClose,
  onPickEpisodeConfirm,
  onAgendaFormChange,
  onChangeName,
  onChangeDate,
  onChangeParticipants,
  onSaveGeneralDetails,
  onStartGeneralEditing,
  onCancelGeneralEditing,
  generalEditing,
  savingGeneral,
  generalDirty,
  generalSaveError,
}: Props) {
  const formatDate = (iso: string) => {
    if (!iso) return '–';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return '–';
    return `${d}.${m}.${y}`;
  };

  return (
    <section className="detail-section colloquiums-detail-section">
      <div className="detail-section-heading">
        <h2>Colloquium Details</h2>
        {!generalEditing ? (
          <button className="edit-btn" onClick={onStartGeneralEditing}>Edit</button>
        ) : (
          <div className="edit-actions">
            <button className="save-btn" onClick={onSaveGeneralDetails} disabled={savingGeneral || !generalDirty}>
              {savingGeneral ? 'Saving...' : 'Save'}
            </button>
            <button className="cancel-btn" onClick={onCancelGeneralEditing} disabled={savingGeneral}>Cancel</button>
          </div>
        )}
      </div>
      <div className="detail-grid">
        <div className="detail-field">
          <span className="detail-label">Name</span>
          {generalEditing ? (
            <input
              className="detail-input"
              type="text"
              value={draftName}
              onChange={(e) => onChangeName(e.target.value)}
            />
          ) : (
            <span className="detail-value">{draftName || '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Date</span>
          {generalEditing ? (
            <input
              className="detail-input"
              type="date"
              value={draftDate}
              onChange={(e) => onChangeDate(e.target.value)}
            />
          ) : (
            <span className="detail-value">{formatDate(draftDate)}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Participants</span>
          {generalEditing ? (
            <input
              className="detail-input"
              type="text"
              value={draftParticipants}
              onChange={(e) => onChangeParticipants(e.target.value)}
            />
          ) : (
            <span className="detail-value">{draftParticipants || '–'}</span>
          )}
        </div>
      </div>
      {generalSaveError && <p className="status">{generalSaveError}</p>}
      <div className="colloquiums-agenda-section">
        <div className="detail-section-heading">
          <h3>Agenda</h3>
          {editingAgendaId === null && (
            <button className="ci-add-btn" onClick={onStartAddAgenda}>+ Add</button>
          )}
        </div>
        {loadingAgendas ? (
          <p className="status">Loading agenda...</p>
        ) : (
          <ColloquiumAgendaTable
            agendas={agendas}
            editingAgendaId={editingAgendaId}
            savingAgenda={savingAgenda}
            deletingAgendaId={deletingAgendaId}
            editingForm={editingAgendaForm}
            selectedEpisodePreviews={selectedEpisodePreviews}
            patientsById={patientsById}
            onStartEdit={onStartEditAgenda}
            onCancelEdit={onCancelEditAgenda}
            onSave={onSaveAgenda}
            onDelete={onDeleteAgenda}
            onPickEpisode={onPickEpisode}
            onEditFormChange={onAgendaFormChange}
            selectedEpisodeLabel={selectedEpisodeLabel}
          />
        )}
      </div>
      <EpisodePickerDialog
        open={pickerOpen}
        organLabel={colloqium.colloqium_type?.organ?.name_default ?? 'Unknown organ'}
        rows={pickerRows}
        loading={pickerLoading}
        initialSelectedEpisodeIds={
          editingAgendaForm.episode_ids.length > 0
            ? editingAgendaForm.episode_ids
            : (editingAgendaForm.episode_id ? [editingAgendaForm.episode_id] : [])
        }
        nonSelectableEpisodeIds={pickerNonSelectableEpisodeIds}
        onClose={onPickEpisodeClose}
        onConfirm={onPickEpisodeConfirm}
      />
    </section>
  );
}

