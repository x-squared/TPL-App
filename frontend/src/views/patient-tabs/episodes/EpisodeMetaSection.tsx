import { useMemo, useState } from 'react';
import type { Code, Episode, EpisodeOrgan } from '../../../api';
import type { EpisodeMetaForm } from './types';

interface EpisodeMetaSectionProps {
  selectedEpisode: Episode;
  editingEpisodeMeta: boolean;
  episodeMetaForm: EpisodeMetaForm;
  setEpisodeMetaForm: React.Dispatch<React.SetStateAction<EpisodeMetaForm>>;
  detailSaving: boolean;
  startEditingEpisodeMeta: () => void;
  handleSaveEpisodeMeta: () => void;
  setEditingEpisodeMeta: React.Dispatch<React.SetStateAction<boolean>>;
  formatDate: (iso: string | null) => string;
  organCodes: Code[];
  organActionLoading: boolean;
  onAddOrReactivateOrgan: (payload: {
    organ_id: number;
    date_added?: string | null;
    comment?: string;
    reason_activation_change?: string;
  }) => void;
  onUpdateOrgan: (episodeOrganId: number, payload: {
    comment?: string;
    is_active?: boolean;
    date_inactivated?: string | null;
    reason_activation_change?: string;
  }) => void;
  favoriteControl?: React.ReactNode;
}

export default function EpisodeMetaSection({
  selectedEpisode,
  editingEpisodeMeta,
  episodeMetaForm,
  setEpisodeMetaForm,
  detailSaving,
  startEditingEpisodeMeta,
  handleSaveEpisodeMeta,
  setEditingEpisodeMeta,
  formatDate,
  organCodes,
  organActionLoading,
  onAddOrReactivateOrgan,
  onUpdateOrgan,
  favoriteControl,
}: EpisodeMetaSectionProps) {
  const [addingOrgan, setAddingOrgan] = useState(false);
  const [newOrganId, setNewOrganId] = useState<number | null>(null);
  const [newOrganDateAdded, setNewOrganDateAdded] = useState(() => new Date().toISOString().slice(0, 10));
  const [newOrganComment, setNewOrganComment] = useState('');
  const [newOrganReason, setNewOrganReason] = useState('');
  const [editingOrganId, setEditingOrganId] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState('');
  const [editingReason, setEditingReason] = useState('');

  const activeOrganName = useMemo(() => {
    const active = selectedEpisode.episode_organs
      .filter((row) => row.is_active)
      .map((row) => row.organ?.name_default)
      .filter((name): name is string => Boolean(name));
    if (active.length > 0) return active.join(' / ');
    return selectedEpisode.organ?.name_default ?? '–';
  }, [selectedEpisode]);

  const currentOrganIds = new Set(selectedEpisode.episode_organs.map((row) => row.organ_id));

  const sortedRows = useMemo(
    () =>
      [...selectedEpisode.episode_organs].sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        const an = a.organ?.name_default ?? '';
        const bn = b.organ?.name_default ?? '';
        return an.localeCompare(bn);
      }),
    [selectedEpisode.episode_organs],
  );

  const handleAdd = () => {
    if (!newOrganId) return;
    onAddOrReactivateOrgan({
      organ_id: newOrganId,
      date_added: newOrganDateAdded || null,
      comment: newOrganComment.trim(),
      reason_activation_change: newOrganReason.trim(),
    });
    setAddingOrgan(false);
    setNewOrganId(null);
    setNewOrganDateAdded(new Date().toISOString().slice(0, 10));
    setNewOrganComment('');
    setNewOrganReason('');
  };

  const startEditingOrgan = (row: EpisodeOrgan) => {
    setEditingOrganId(row.id);
    setEditingComment(row.comment ?? '');
    setEditingReason(row.reason_activation_change ?? '');
  };

  const cancelEditingOrgan = () => {
    setEditingOrganId(null);
    setEditingComment('');
    setEditingReason('');
  };

  const saveEditingOrgan = (row: EpisodeOrgan) => {
    onUpdateOrgan(row.id, {
      comment: editingComment.trim(),
      reason_activation_change: editingReason.trim(),
    });
    cancelEditingOrgan();
  };

  return (
    <>
      <div className="detail-section-heading">
        <div className="ui-heading-title-with-favorite">
          <h2>Episode {activeOrganName}</h2>
          {favoriteControl}
        </div>
        {!addingOrgan ? (
          <button
            className="ci-add-btn"
            onClick={() => {
              setAddingOrgan(true);
              setNewOrganId(null);
              setNewOrganDateAdded(new Date().toISOString().slice(0, 10));
            }}
            disabled={organActionLoading}
          >
            + Add organ
          </button>
        ) : null}
      </div>
      <section className="episode-meta-section">
        <table className="detail-contact-table episode-organs-table">
          <thead>
            <tr>
              <th>Organ</th>
              <th>Date added</th>
              <th>Comment</th>
              <th>Active</th>
              <th>Date inactivated</th>
              <th>Reason</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 && !addingOrgan ? (
              <tr>
                <td colSpan={7} className="detail-empty">No organs linked to this episode.</td>
              </tr>
            ) : null}
            {sortedRows.map((row) => (
              <tr key={row.id} className={row.is_active ? '' : 'episode-organ-row-inactive'}>
                <td>{row.organ?.name_default ?? '–'}</td>
                <td>{formatDate(row.date_added)}</td>
                <td>
                  {editingOrganId === row.id ? (
                    <input
                      className="detail-input ci-inline-input"
                      value={editingComment}
                      onChange={(e) => setEditingComment(e.target.value)}
                      maxLength={512}
                      disabled={organActionLoading}
                    />
                  ) : (
                    row.comment || '–'
                  )}
                </td>
                <td>{row.is_active ? 'Yes' : 'No'}</td>
                <td>{formatDate(row.date_inactivated)}</td>
                <td>
                  {editingOrganId === row.id ? (
                    <input
                      className="detail-input ci-inline-input"
                      value={editingReason}
                      onChange={(e) => setEditingReason(e.target.value)}
                      maxLength={128}
                      disabled={organActionLoading}
                    />
                  ) : (
                    row.reason_activation_change || '–'
                  )}
                </td>
                <td className="detail-ci-actions">
                  {editingOrganId === row.id ? (
                    <>
                      <button
                        type="button"
                        className="ci-save-inline"
                        onClick={() => saveEditingOrgan(row)}
                        disabled={organActionLoading}
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        className="ci-cancel-inline"
                        onClick={cancelEditingOrgan}
                        disabled={organActionLoading}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="ci-edit-inline"
                        onClick={() => startEditingOrgan(row)}
                        disabled={organActionLoading}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className={row.is_active ? 'ci-delete-btn' : 'ci-save-inline'}
                        onClick={() =>
                          onUpdateOrgan(row.id, {
                            is_active: !row.is_active,
                            date_inactivated: row.is_active ? new Date().toISOString().slice(0, 10) : null,
                          })
                        }
                        disabled={organActionLoading}
                        title={row.is_active ? 'Deactivate' : 'Reactivate'}
                      >
                        {row.is_active ? '×' : '↺'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {addingOrgan ? (
              <tr className="ci-editing-row">
                <td>
                  <select
                    className="detail-input ci-inline-input"
                    value={newOrganId ?? ''}
                    onChange={(e) => setNewOrganId(e.target.value ? Number(e.target.value) : null)}
                    disabled={organActionLoading}
                  >
                    <option value="">Select organ...</option>
                    {organCodes.map((code) => (
                      <option key={code.id} value={code.id}>
                        {code.name_default}
                        {currentOrganIds.has(code.id) ? ' (existing)' : ''}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="date"
                    className="detail-input ci-inline-input"
                    value={newOrganDateAdded}
                    onChange={(e) => setNewOrganDateAdded(e.target.value)}
                    disabled={organActionLoading}
                  />
                </td>
                <td>
                  <input
                    className="detail-input ci-inline-input"
                    value={newOrganComment}
                    onChange={(e) => setNewOrganComment(e.target.value)}
                    maxLength={512}
                    disabled={organActionLoading}
                  />
                </td>
                <td>Yes</td>
                <td>–</td>
                <td>
                  <input
                    className="detail-input ci-inline-input"
                    value={newOrganReason}
                    onChange={(e) => setNewOrganReason(e.target.value)}
                    maxLength={128}
                    disabled={organActionLoading}
                  />
                </td>
                <td className="detail-ci-actions">
                  <button
                    type="button"
                    className="ci-save-inline"
                    onClick={handleAdd}
                    disabled={organActionLoading || !newOrganId}
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="ci-cancel-inline"
                    onClick={() => {
                      setAddingOrgan(false);
                      setNewOrganId(null);
                      setNewOrganDateAdded(new Date().toISOString().slice(0, 10));
                      setNewOrganComment('');
                      setNewOrganReason('');
                    }}
                    disabled={organActionLoading}
                    title="Cancel"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="detail-section-heading episode-meta-notes-heading">
          <h3>Comment / Cave</h3>
          {editingEpisodeMeta ? (
            <div className="edit-actions">
              <button
                type="button"
                className="save-btn"
                onClick={handleSaveEpisodeMeta}
                disabled={detailSaving}
              >
                {detailSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setEditingEpisodeMeta(false)}
                disabled={detailSaving}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="edit-btn" onClick={startEditingEpisodeMeta}>Edit</button>
          )}
        </div>
        <div className="episode-meta-grid">
          <div className="episode-detail-field episode-meta-comment">
            <span className="episode-detail-label">Comment</span>
            {editingEpisodeMeta ? (
              <textarea
                className="detail-input episode-meta-textarea"
                rows={2}
                value={episodeMetaForm.comment}
                onChange={(e) => setEpisodeMetaForm((f) => ({ ...f, comment: e.target.value }))}
              />
            ) : (
              <textarea
                className="detail-input episode-meta-textarea episode-meta-readonly"
                rows={2}
                readOnly
                value={selectedEpisode.comment ?? ''}
              />
            )}
          </div>
          <div className="episode-detail-field episode-meta-cave">
            <span className="episode-detail-label">Cave</span>
            {editingEpisodeMeta ? (
              <textarea
                className="detail-input episode-meta-textarea"
                rows={2}
                value={episodeMetaForm.cave}
                onChange={(e) => setEpisodeMetaForm((f) => ({ ...f, cave: e.target.value }))}
              />
            ) : (
              <textarea
                className="detail-input episode-meta-textarea episode-meta-readonly"
                rows={2}
                readOnly
                value={selectedEpisode.cave ?? ''}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
