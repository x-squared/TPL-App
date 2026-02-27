import type { ColloqiumAgenda, ColloqiumType } from '../../../api';
import ErrorBanner from '../../layout/ErrorBanner';

interface Props {
  loadingEpisodeColloqiums: boolean;
  episodeColloqiumAgendas: ColloqiumAgenda[];
  onOpenColloqium: (colloqiumId: number) => void;
  onOpenAssignDialog: () => void;
  formatDate: (iso: string | null) => string;
  assignDialogOpen: boolean;
  assigningColloqium: boolean;
  assignError: string;
  selectableColloqiumTypes: ColloqiumType[];
  assignTypeId: number | null;
  setAssignTypeId: (value: number | null) => void;
  assignDate: string;
  setAssignDate: (value: string) => void;
  onAssign: () => void;
  onCloseAssignDialog: () => void;
}

export default function EpisodeColloquiumSection({
  loadingEpisodeColloqiums,
  episodeColloqiumAgendas,
  onOpenColloqium,
  onOpenAssignDialog,
  formatDate,
  assignDialogOpen,
  assigningColloqium,
  assignError,
  selectableColloqiumTypes,
  assignTypeId,
  setAssignTypeId,
  assignDate,
  setAssignDate,
  onAssign,
  onCloseAssignDialog,
}: Props) {
  return (
    <>
      <section className="detail-section episode-colloqium-section">
        <div className="detail-section-heading">
          <h2>Colloquium</h2>
          <button className="ci-add-btn" onClick={onOpenAssignDialog}>+ Add</button>
        </div>
        {loadingEpisodeColloqiums ? (
          <p className="detail-empty">Loading colloquiums...</p>
        ) : episodeColloqiumAgendas.length === 0 ? (
          <p className="detail-empty">Episode is not assigned to any colloquium.</p>
        ) : (
          <table className="detail-contact-table">
            <thead>
              <tr>
                <th className="open-col"></th>
                <th>Type</th>
                <th>Name</th>
                <th>Date</th>
                <th>Participants</th>
              </tr>
            </thead>
            <tbody>
              {episodeColloqiumAgendas.map((agenda) => {
                const colloqiumId = agenda.colloqium?.id ?? null;
                return (
                  <tr
                    key={agenda.id}
                    onDoubleClick={() => {
                      if (colloqiumId) onOpenColloqium(colloqiumId);
                    }}
                  >
                    <td className="open-col">
                      <button
                        className="open-btn"
                        onClick={() => {
                          if (colloqiumId) onOpenColloqium(colloqiumId);
                        }}
                        title="Open colloquium"
                        disabled={!colloqiumId}
                      >
                        &#x279C;
                      </button>
                    </td>
                    <td>{agenda.colloqium?.colloqium_type?.organ?.name_default ?? '–'}</td>
                    <td>{agenda.colloqium?.colloqium_type?.name ?? '–'}</td>
                    <td>{formatDate(agenda.colloqium?.date ?? null)}</td>
                    <td>{agenda.colloqium?.participants ?? ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {assignDialogOpen && (
        <div className="episode-colloqium-dialog-overlay" role="dialog" aria-modal="true" aria-label="Assign episode to colloquium">
          <div className="episode-colloqium-dialog">
            <h3>Assign episode to colloquium</h3>
            <div className="episode-colloqium-dialog-fields">
              <label>
                Colloquium type
                <select
                  className="detail-input"
                  value={assignTypeId ?? ''}
                  onChange={(e) => setAssignTypeId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select type...</option>
                  {selectableColloqiumTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.organ?.name_default ?? '–'} - {type.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input
                  className="detail-input"
                  type="date"
                  value={assignDate}
                  onChange={(e) => setAssignDate(e.target.value)}
                />
              </label>
            </div>
            <ErrorBanner message={assignError} />
            <div className="ci-add-actions">
              <button
                className="save-btn"
                onClick={onAssign}
                disabled={assigningColloqium || !assignTypeId || !assignDate}
              >
                {assigningColloqium ? 'Assigning...' : 'Assign'}
              </button>
              <button
                className="cancel-btn"
                onClick={onCloseAssignDialog}
                disabled={assigningColloqium}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

