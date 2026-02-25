import type React from 'react';
import type { Colloqium, ColloqiumAgenda, PatientListItem } from '../../../api';
import type { AgendaDraft } from '../tabs/protocol/ColloquiumProtocolTab';
import ColloquiumProtocolTab from '../tabs/protocol/ColloquiumProtocolTab';
import ColloquiumDetailSection from '../tabs/colloquium/ColloquiumDetailSection';

type Tab = 'colloquium' | 'protocol';

interface Props {
  loading: boolean;
  colloqium: Colloqium | null;
  tab: Tab;
  setTab: (tab: Tab) => void;
  onBack: () => void;
  standalone: boolean;
  onOpenDetachedProtocol: () => void;
  draftName: string;
  draftDate: string;
  draftParticipants: string;
  loadingAgendas: boolean;
  agendas: ColloqiumAgenda[];
  agendaDrafts: Record<number, AgendaDraft>;
  editingAgendaId: number | null;
  agendaSaving: boolean;
  agendaDeletingId: number | null;
  agendaForm: {
    episode_id: number | null;
    episode_ids: number[];
    presented_by: string;
    decision: string;
    comment: string;
  };
  selectedEpisodePreviews: Array<{
    episodeId: number;
    patientName: string;
    patientFirstName: string;
    patientPid: string;
    fallNr: string;
    organName: string;
    statusName: string;
    start: string | null;
    end: string | null;
  }>;
  selectedEpisodeLabel: string;
  pickerOpen: boolean;
  pickerRows: Array<{
    patient: PatientListItem;
    episodes: Array<{
      episodeId: number;
      patientId: number;
      fallNr: string;
      start: string | null;
      end: string | null;
    }>;
  }>;
  pickerLoading: boolean;
  pickerNonSelectableEpisodeIds: number[];
  patientsById: Record<number, PatientListItem>;
  generalEditing: boolean;
  savingGeneral: boolean;
  isGeneralDirty: boolean;
  generalSaveError: string;
  setDraftName: (value: string) => void;
  setDraftDate: (value: string) => void;
  setDraftParticipants: (value: string) => void;
  saveGeneralDetails: () => void;
  startGeneralEditing: () => void;
  cancelGeneralEditing: () => void;
  startAddAgenda: () => void;
  startEditAgenda: (agenda: ColloqiumAgenda) => void;
  cancelEditAgenda: () => void;
  saveAgenda: () => void;
  deleteAgenda: (agendaId: number) => void;
  openEpisodePicker: () => void;
  setPickerOpen: (open: boolean) => void;
  setAgendaForm: React.Dispatch<React.SetStateAction<{
    episode_id: number | null;
    episode_ids: number[];
    presented_by: string;
    decision: string;
    comment: string;
  }>>;
  setAgendaDrafts: React.Dispatch<React.SetStateAction<Record<number, AgendaDraft>>>;
}

export default function ColloquiumDetailTabs({
  loading,
  colloqium,
  tab,
  setTab,
  onBack,
  standalone,
  onOpenDetachedProtocol,
  draftName,
  draftDate,
  draftParticipants,
  loadingAgendas,
  agendas,
  agendaDrafts,
  editingAgendaId,
  agendaSaving,
  agendaDeletingId,
  agendaForm,
  selectedEpisodePreviews,
  selectedEpisodeLabel,
  pickerOpen,
  pickerRows,
  pickerLoading,
  pickerNonSelectableEpisodeIds,
  patientsById,
  generalEditing,
  savingGeneral,
  isGeneralDirty,
  generalSaveError,
  setDraftName,
  setDraftDate,
  setDraftParticipants,
  saveGeneralDetails,
  startGeneralEditing,
  cancelGeneralEditing,
  startAddAgenda,
  startEditAgenda,
  cancelEditAgenda,
  saveAgenda,
  deleteAgenda,
  openEpisodePicker,
  setPickerOpen,
  setAgendaForm,
  setAgendaDrafts,
}: Props) {
  return (
    <>
      <header className="ui-detail-heading">
        <button className="ui-back-btn" onClick={onBack} title="Back to list">
          &larr;
        </button>
        <h1>Colloquium</h1>
        <div className="patients-add-actions">
          {!standalone && (
            <button className="patients-cancel-btn" onClick={onOpenDetachedProtocol}>
              Open detached protocol
            </button>
          )}
        </div>
      </header>

      <nav className="detail-tabs">
        <button
          className={`detail-tab ${tab === 'colloquium' ? 'active' : ''}`}
          onClick={() => setTab('colloquium')}
        >
          Colloquium
        </button>
        <button
          className={`detail-tab ${tab === 'protocol' ? 'active' : ''}`}
          onClick={() => setTab('protocol')}
        >
          Protocol
        </button>
      </nav>

      {loading ? (
        <p className="status">Loading...</p>
      ) : !colloqium ? (
        <p className="status">Colloquium not found.</p>
      ) : tab === 'colloquium' ? (
        <ColloquiumDetailSection
          colloqium={colloqium}
          draftName={draftName}
          draftDate={draftDate}
          draftParticipants={draftParticipants}
          loadingAgendas={loadingAgendas}
          agendas={agendas}
          editingAgendaId={editingAgendaId}
          savingAgenda={agendaSaving}
          deletingAgendaId={agendaDeletingId}
          editingAgendaForm={agendaForm}
          selectedEpisodePreviews={selectedEpisodePreviews}
          selectedEpisodeLabel={selectedEpisodeLabel}
          pickerOpen={pickerOpen}
          pickerRows={pickerRows}
          pickerLoading={pickerLoading}
          pickerNonSelectableEpisodeIds={pickerNonSelectableEpisodeIds}
          patientsById={patientsById}
          onStartAddAgenda={startAddAgenda}
          onStartEditAgenda={startEditAgenda}
          onCancelEditAgenda={cancelEditAgenda}
          onSaveAgenda={saveAgenda}
          onDeleteAgenda={deleteAgenda}
          onPickEpisode={openEpisodePicker}
          onPickEpisodeClose={() => setPickerOpen(false)}
          onPickEpisodeConfirm={(episodeIds) => {
            const unique = [...new Set(episodeIds)];
            const resolved = editingAgendaId && editingAgendaId > 0 ? unique.slice(0, 1) : unique;
            setAgendaForm((prev) => ({
              ...prev,
              episode_ids: resolved,
              episode_id: resolved[0] ?? null,
            }));
            setPickerOpen(false);
          }}
          onAgendaFormChange={(patch) => setAgendaForm((prev) => ({ ...prev, ...patch }))}
          onChangeName={setDraftName}
          onChangeDate={setDraftDate}
          onChangeParticipants={setDraftParticipants}
          onSaveGeneralDetails={saveGeneralDetails}
          onStartGeneralEditing={startGeneralEditing}
          onCancelGeneralEditing={cancelGeneralEditing}
          generalEditing={generalEditing}
          savingGeneral={savingGeneral}
          generalDirty={isGeneralDirty}
          generalSaveError={generalSaveError}
        />
      ) : (
        <div className="colloquium-protocol-tab-wrap">
          <ColloquiumProtocolTab
            draftName={draftName}
            draftDate={draftDate}
            draftParticipants={draftParticipants}
            loadingAgendas={loadingAgendas}
            agendas={agendas}
            agendaDrafts={agendaDrafts}
            patientsById={patientsById}
            onChangeAgendaDraft={(agendaId, patch) =>
              setAgendaDrafts((prev) => ({
                ...prev,
                [agendaId]: { ...(prev[agendaId] ?? { presented_by: '', decision: '', comment: '' }), ...patch },
              }))
            }
          />
        </div>
      )}
    </>
  );
}
