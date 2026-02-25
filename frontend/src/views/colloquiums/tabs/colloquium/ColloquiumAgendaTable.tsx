import type { ColloqiumAgenda, PatientListItem } from '../../../../api';

function formatDate(iso: string | null): string {
  if (!iso) return '–';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

interface Props {
  agendas: ColloqiumAgenda[];
  editingAgendaId: number | null;
  savingAgenda: boolean;
  deletingAgendaId: number | null;
  editingForm: {
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
  patientsById: Record<number, PatientListItem>;
  onStartEdit: (agenda: ColloqiumAgenda) => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: (agendaId: number) => void;
  onPickEpisode: () => void;
  onEditFormChange: (patch: Partial<{
    episode_id: number | null;
    episode_ids: number[];
    presented_by: string;
    decision: string;
    comment: string;
  }>) => void;
  selectedEpisodeLabel: string;
}

export default function ColloquiumAgendaTable({
  agendas,
  editingAgendaId,
  savingAgenda,
  deletingAgendaId,
  editingForm,
  selectedEpisodePreviews,
  patientsById,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onPickEpisode,
  onEditFormChange,
  selectedEpisodeLabel,
}: Props) {
  const hasRows = agendas.length > 0;
  const hasEpisodeSelection = (editingForm.episode_ids?.length ?? 0) > 0 || Boolean(editingForm.episode_id);
  const selectedPreview = selectedEpisodePreviews.length === 1 ? selectedEpisodePreviews[0] : null;
  return (
    <div className="patients-table-wrap ui-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Episode</th>
            <th>Name</th>
            <th>First Name</th>
            <th>PID</th>
            <th>Organ</th>
            <th>Status</th>
            <th>Start</th>
            <th>End</th>
            <th>Presented By</th>
            <th>Decision</th>
            <th>Comment</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {!hasRows && editingAgendaId === null && (
            <tr>
              <td colSpan={12}>
                <p className="contact-empty">No agenda entries.</p>
              </td>
            </tr>
          )}
          {agendas.map((agenda) => {
            const isEditing = editingAgendaId === agenda.id;
            const patient = agenda.episode ? patientsById[agenda.episode.patient_id] : undefined;
            return (
              <tr key={agenda.id} className={isEditing ? 'ci-editing-row' : ''}>
                <td>
                  {isEditing ? (
                    <button className="link-btn" onClick={onPickEpisode}>
                      {selectedEpisodeLabel}
                    </button>
                  ) : (
                    (agenda.episode?.fall_nr || `#${agenda.episode_id}`)
                  )}
                </td>
                <td>{patient?.name ?? '–'}</td>
                <td>{patient?.first_name ?? '–'}</td>
                <td>{patient?.pid ?? '–'}</td>
                <td>{isEditing ? (selectedPreview?.organName ?? (selectedEpisodePreviews.length > 1 ? 'Multiple' : '–')) : (agenda.episode?.organ?.name_default ?? '–')}</td>
                <td>{isEditing ? (selectedPreview?.statusName ?? (selectedEpisodePreviews.length > 1 ? 'Multiple' : '–')) : (agenda.episode?.status?.name_default ?? '–')}</td>
                <td>{isEditing ? formatDate(selectedPreview?.start ?? null) : formatDate(agenda.episode?.start ?? null)}</td>
                <td>{isEditing ? formatDate(selectedPreview?.end ?? null) : formatDate(agenda.episode?.end ?? null)}</td>
                <td>
                  {isEditing ? (
                    <input
                      className="ci-inline-input"
                      value={editingForm.presented_by}
                      onChange={(e) => onEditFormChange({ presented_by: e.target.value })}
                    />
                  ) : (
                    agenda.presented_by || '–'
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="ci-inline-input"
                      value={editingForm.decision}
                      onChange={(e) => onEditFormChange({ decision: e.target.value })}
                    />
                  ) : (
                    agenda.decision || '–'
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="ci-inline-input"
                      value={editingForm.comment}
                      onChange={(e) => onEditFormChange({ comment: e.target.value })}
                    />
                  ) : (
                    agenda.comment || '–'
                  )}
                </td>
                <td className="detail-ci-actions">
                  {!isEditing ? (
                    <>
                      <button className="ci-edit-inline" onClick={() => onStartEdit(agenda)} title="Edit" aria-label="Edit">✎</button>
                      <button
                        className="ci-delete-btn"
                        onClick={() => onDelete(agenda.id)}
                        disabled={deletingAgendaId === agenda.id}
                        title="Delete"
                        aria-label="Delete"
                      >
                        {deletingAgendaId === agenda.id ? '…' : '✕'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="ci-save-inline" onClick={onSave} disabled={savingAgenda || !hasEpisodeSelection} title="Save" aria-label="Save">✓</button>
                      <button className="ci-cancel-inline" onClick={onCancelEdit} disabled={savingAgenda} title="Cancel" aria-label="Cancel">✕</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {editingAgendaId === 0 && (
            <tr className="ci-editing-row">
              <td>
                <button className="link-btn" onClick={onPickEpisode}>
                  {selectedEpisodeLabel}
                </button>
              </td>
              <td>{selectedPreview?.patientName ?? (selectedEpisodePreviews.length > 1 ? 'Multiple' : '–')}</td>
              <td>{selectedPreview?.patientFirstName ?? (selectedEpisodePreviews.length > 1 ? 'Multiple' : '–')}</td>
              <td>{selectedPreview?.patientPid ?? (selectedEpisodePreviews.length > 1 ? 'Multiple' : '–')}</td>
              <td>{selectedPreview?.organName ?? (selectedEpisodePreviews.length > 1 ? 'Multiple' : '–')}</td>
              <td>{selectedPreview?.statusName ?? (selectedEpisodePreviews.length > 1 ? 'Multiple' : '–')}</td>
              <td>{formatDate(selectedPreview?.start ?? null)}</td>
              <td>{formatDate(selectedPreview?.end ?? null)}</td>
              <td>
                <input
                  className="ci-inline-input"
                  value={editingForm.presented_by}
                  onChange={(e) => onEditFormChange({ presented_by: e.target.value })}
                />
              </td>
              <td>
                <input
                  className="ci-inline-input"
                  value={editingForm.decision}
                  onChange={(e) => onEditFormChange({ decision: e.target.value })}
                />
              </td>
              <td>
                <input
                  className="ci-inline-input"
                  value={editingForm.comment}
                  onChange={(e) => onEditFormChange({ comment: e.target.value })}
                />
              </td>
              <td className="detail-ci-actions">
                <button className="ci-save-inline" onClick={onSave} disabled={savingAgenda || !hasEpisodeSelection} title="Save" aria-label="Save">✓</button>
                <button className="ci-cancel-inline" onClick={onCancelEdit} disabled={savingAgenda} title="Cancel" aria-label="Cancel">✕</button>
              </td>
            </tr>
          )}
          {editingAgendaId === 0 && selectedEpisodePreviews.length > 1 && (
            <tr className="contact-row">
              <td colSpan={12}>
                <div className="contact-section">
                  <p className="contact-empty">
                    Selected episodes:{' '}
                    {selectedEpisodePreviews.map((item) =>
                      `${item.fallNr} (${item.patientName}, ${item.patientFirstName}, ${item.patientPid})`,
                    ).join(' | ')}
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

