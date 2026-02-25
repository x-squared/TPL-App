import type { Code, Episode, EpisodeCreate, EpisodeUpdate } from '../../../api';
import InlineDeleteActions from '../../layout/InlineDeleteActions';

interface EpisodeTableProps {
  patientEpisodes: Episode[];
  sortedEpisodes: Episode[];
  addingEpisode: boolean;
  setAddingEpisode: React.Dispatch<React.SetStateAction<boolean>>;
  editingEpId: number | null;
  epEditForm: EpisodeUpdate;
  setEpEditForm: React.Dispatch<React.SetStateAction<EpisodeUpdate>>;
  epSaving: boolean;
  handleSaveEp: () => void;
  cancelEditingEp: () => void;
  startEditingEp: (ep: Episode) => void;
  confirmDeleteEpId: number | null;
  setConfirmDeleteEpId: React.Dispatch<React.SetStateAction<number | null>>;
  handleDeleteEpisode: (id: number) => void;
  organCodes: Code[];
  tplStatusCodes: Code[];
  epForm: EpisodeCreate;
  setEpForm: React.Dispatch<React.SetStateAction<EpisodeCreate>>;
  handleAddEpisode: () => void;
  formatDate: (iso: string | null) => string;
  selectedEpisodeId: number | null;
  onSelectEpisode: (id: number) => void;
}

export default function EpisodeTable({
  patientEpisodes,
  sortedEpisodes,
  addingEpisode,
  setAddingEpisode,
  editingEpId,
  epEditForm,
  setEpEditForm,
  epSaving,
  handleSaveEp,
  cancelEditingEp,
  startEditingEp,
  confirmDeleteEpId,
  setConfirmDeleteEpId,
  handleDeleteEpisode,
  organCodes,
  tplStatusCodes,
  epForm,
  setEpForm,
  handleAddEpisode,
  formatDate,
  selectedEpisodeId,
  onSelectEpisode,
}: EpisodeTableProps) {
  return (
    <>
      {patientEpisodes && patientEpisodes.length > 0 ? (
        <table className="detail-contact-table episode-table">
          <thead>
            <tr>
              <th>Organ</th>
              <th>Status</th>
              <th>Start</th>
              <th>End</th>
              <th>Fall Nr</th>
              <th>TPL Date</th>
              <th>Closed</th>
              <th>Rec. Card</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedEpisodes.map((ep) => (
              editingEpId === ep.id ? (
                <tr key={ep.id} className="ci-editing-row">
                  <td>
                    <select className="detail-input ci-inline-input" value={epEditForm.organ_id ?? ''} onChange={(e) => setEpEditForm((f) => ({ ...f, organ_id: Number(e.target.value) }))}>
                      {organCodes.map((c) => <option key={c.id} value={c.id}>{c.name_default}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="detail-input ci-inline-input" value={epEditForm.status_id ?? ''} onChange={(e) => setEpEditForm((f) => ({ ...f, status_id: e.target.value ? Number(e.target.value) : null }))}>
                      <option value="">–</option>
                      {tplStatusCodes.map((c) => <option key={c.id} value={c.id}>{c.name_default}</option>)}
                    </select>
                  </td>
                  <td><input type="date" className="detail-input ci-inline-input" value={epEditForm.start ?? ''} onChange={(e) => setEpEditForm((f) => ({ ...f, start: e.target.value || null }))} /></td>
                  <td><input type="date" className="detail-input ci-inline-input" value={epEditForm.end ?? ''} onChange={(e) => setEpEditForm((f) => ({ ...f, end: e.target.value || null }))} /></td>
                  <td><input className="detail-input ci-inline-input" value={epEditForm.fall_nr ?? ''} onChange={(e) => setEpEditForm((f) => ({ ...f, fall_nr: e.target.value }))} /></td>
                  <td><input type="date" className="detail-input ci-inline-input" value={epEditForm.tpl_date ?? ''} onChange={(e) => setEpEditForm((f) => ({ ...f, tpl_date: e.target.value || null }))} /></td>
                  <td>
                    <label className="detail-checkbox">
                      <input type="checkbox" checked={epEditForm.closed ?? false} disabled={!epEditForm.end} onChange={(e) => setEpEditForm((f) => ({ ...f, closed: e.target.checked }))} />
                    </label>
                  </td>
                  <td>
                    <label className="detail-checkbox">
                      <input type="checkbox" checked={epEditForm.fup_recipient_card_done ?? false} onChange={(e) => setEpEditForm((f) => ({ ...f, fup_recipient_card_done: e.target.checked }))} />
                    </label>
                  </td>
                  <td className="detail-ci-actions">
                    <button className="ci-save-inline" onClick={handleSaveEp} disabled={epSaving || (epEditForm.closed && !epEditForm.end)}>✓</button>
                    <button className="ci-cancel-inline" onClick={cancelEditingEp} disabled={epSaving}>✕</button>
                  </td>
                </tr>
              ) : (
                <tr
                  key={ep.id}
                  onClick={() => onSelectEpisode(ep.id)}
                  onDoubleClick={() => startEditingEp(ep)}
                  className={selectedEpisodeId === ep.id ? 'episode-row-selected' : ''}
                >
                  <td>{ep.organ?.name_default ?? '–'}</td>
                  <td>{ep.status?.name_default ?? '–'}</td>
                  <td>{formatDate(ep.start)}</td>
                  <td>{formatDate(ep.end)}</td>
                  <td>{ep.fall_nr || '–'}</td>
                  <td>{formatDate(ep.tpl_date)}</td>
                  <td>{ep.closed ? 'Yes' : 'No'}</td>
                  <td>{ep.fup_recipient_card_done ? (ep.fup_recipient_card_date ? formatDate(ep.fup_recipient_card_date) : 'Yes') : 'No'}</td>
                  <td className="detail-ci-actions">
                    <InlineDeleteActions
                      confirming={confirmDeleteEpId === ep.id}
                      onEdit={() => startEditingEp(ep)}
                      onRequestDelete={() => setConfirmDeleteEpId(ep.id)}
                      onConfirmDelete={() => handleDeleteEpisode(ep.id)}
                      onCancelDelete={() => setConfirmDeleteEpId(null)}
                    />
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      ) : (
        <p className="detail-empty">No episodes.</p>
      )}

      {addingEpisode && (
        <div className="ci-add-form">
          <select className="detail-input" value={epForm.organ_id} onChange={(e) => setEpForm((f) => ({ ...f, organ_id: Number(e.target.value) }))}>
            {organCodes.map((c) => <option key={c.id} value={c.id}>{c.name_default}</option>)}
          </select>
          <select className="detail-input" value={epForm.status_id ?? ''} onChange={(e) => setEpForm((f) => ({ ...f, status_id: e.target.value ? Number(e.target.value) : null }))}>
            <option value="">Status...</option>
            {tplStatusCodes.map((c) => <option key={c.id} value={c.id}>{c.name_default}</option>)}
          </select>
          <input type="date" className="detail-input" placeholder="Start" value={epForm.start ?? ''} onChange={(e) => setEpForm((f) => ({ ...f, start: e.target.value || null }))} />
          <input type="date" className="detail-input" placeholder="End" value={epForm.end ?? ''} onChange={(e) => setEpForm((f) => ({ ...f, end: e.target.value || null }))} />
          <input className="detail-input" placeholder="Fall Nr" value={epForm.fall_nr ?? ''} onChange={(e) => setEpForm((f) => ({ ...f, fall_nr: e.target.value }))} />
          <div className="ci-add-actions">
            <button className="save-btn" onClick={handleAddEpisode} disabled={epSaving || !epForm.organ_id}>
              {epSaving ? 'Saving...' : 'Save'}
            </button>
            <button className="cancel-btn" onClick={() => setAddingEpisode(false)} disabled={epSaving}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
