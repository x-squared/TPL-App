import { useState } from 'react';
import { api } from '../../api';
import './EpisodesTab.css';

function toFieldLabel(key: string, prefix?: string): string {
  const normalized = prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key;
  return normalized
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEpisodeDetailValue(key: string, value: unknown, formatDate: (iso: string | null) => string): string {
  if (value === null || value === undefined || value === '') return '–';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /_date$|_start$|_end$|_sent$/.test(key)) {
      return formatDate(value);
    }
    return value;
  }
  return String(value);
}

export default function EpisodesTab(props: any) {
  const {
    patient,
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
    refreshPatient,
  } = props;
  const episodeDetailTabs = ['Evaluation', 'Listing', 'Transplantation', 'Follow-Up', 'Closed'] as const;
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null);
  const [activeEpisodeTab, setActiveEpisodeTab] = useState<(typeof episodeDetailTabs)[number]>('Evaluation');
  const [editingDetailTab, setEditingDetailTab] = useState<(typeof episodeDetailTabs)[number] | null>(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailForm, setDetailForm] = useState<Record<string, any>>({});
  const [detailSaveError, setDetailSaveError] = useState('');
  const [editingEpisodeMeta, setEditingEpisodeMeta] = useState(false);
  const [episodeMetaForm, setEpisodeMetaForm] = useState({ comment: '', cave: '' });
  const evalKeys = ['eval_start', 'eval_end', 'eval_assigned_to', 'eval_stat', 'eval_register_date', 'eval_excluded', 'eval_non_list_sent'] as const;
  const listKeys = ['list_start', 'list_end', 'list_rs_nr', 'list_reason_delist', 'list_expl_delist', 'list_delist_sent'] as const;
  const tplKeys = ['tpl_date'] as const;
  const followUpKeys = ['fup_recipient_card_done', 'fup_recipient_card_date'] as const;
  const closedKeys = ['closed', 'end'] as const;
  const sortedEpisodes = [...(patient.episodes ?? [])].sort((a, b) => (a.status?.pos ?? 999) - (b.status?.pos ?? 999));
  const selectedEpisode = sortedEpisodes.find((ep) => ep.id === selectedEpisodeId) ?? null;
  const evalEntries = selectedEpisode ? evalKeys.map((key) => [key, (selectedEpisode as any)[key] ?? null] as const) : [];
  const listEntries = selectedEpisode ? listKeys.map((key) => [key, (selectedEpisode as any)[key] ?? null] as const) : [];
  const tplEntries = selectedEpisode ? tplKeys.map((key) => [key, (selectedEpisode as any)[key] ?? null] as const) : [];
  const followUpEntries = selectedEpisode ? followUpKeys.map((key) => [key, (selectedEpisode as any)[key] ?? null] as const) : [];
  const closedEntries = selectedEpisode ? closedKeys.map((key) => [key, (selectedEpisode as any)[key] ?? null] as const) : [];

  const getEntriesForTab = (tab: (typeof episodeDetailTabs)[number]) => {
    if (tab === 'Evaluation') return evalEntries;
    if (tab === 'Listing') return listEntries;
    if (tab === 'Transplantation') return tplEntries;
    if (tab === 'Follow-Up') return followUpEntries;
    if (tab === 'Closed') return closedEntries;
    return [];
  };

  const isDateField = (key: string) => /_date$|_start$|_end$|_sent$/.test(key);

  const startEditingDetailTab = (tab: (typeof episodeDetailTabs)[number]) => {
    const entries = getEntriesForTab(tab);
    const next: Record<string, any> = {};
    entries.forEach(([key, value]) => {
      next[key] = value;
    });
    setDetailForm(next);
    setEditingDetailTab(tab);
  };

  const handleSaveDetailTab = async () => {
    if (!selectedEpisode) return;
    const payload: Record<string, any> = {};
    Object.entries(detailForm).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        payload[key] = value;
      } else if (isDateField(key)) {
        payload[key] = value || null;
      } else {
        payload[key] = value ?? '';
      }
    });
    setDetailSaving(true);
    setDetailSaveError('');
    try {
      await api.updateEpisode(patient.id, selectedEpisode.id, payload);
      await refreshPatient();
      setEditingDetailTab(null);
    } catch (err) {
      setDetailSaveError(err instanceof Error ? err.message : 'Could not save episode details.');
    } finally {
      setDetailSaving(false);
    }
  };

  const startEditingEpisodeMeta = () => {
    if (!selectedEpisode) return;
    setEpisodeMetaForm({
      comment: selectedEpisode.comment ?? '',
      cave: selectedEpisode.cave ?? '',
    });
    setDetailSaveError('');
    setEditingEpisodeMeta(true);
  };

  const handleSaveEpisodeMeta = async () => {
    if (!selectedEpisode) return;
    setDetailSaving(true);
    setDetailSaveError('');
    try {
      await api.updateEpisode(patient.id, selectedEpisode.id, {
        comment: episodeMetaForm.comment ?? '',
        cave: episodeMetaForm.cave ?? '',
      });
      await refreshPatient();
      setEditingEpisodeMeta(false);
    } catch (err) {
      setDetailSaveError(err instanceof Error ? err.message : 'Could not save episode details.');
    } finally {
      setDetailSaving(false);
    }
  };

  return (
    <section className="detail-section" style={{ marginTop: '1.5rem' }}>
      <div className="detail-section-heading">
        <h2>Episodes</h2>
        {!addingEpisode && (
          <button className="ci-add-btn" onClick={() => setAddingEpisode(true)}>+ Add</button>
        )}
      </div>
      {patient.episodes && patient.episodes.length > 0 ? (
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
                    <select className="detail-input ci-inline-input" value={epEditForm.organ_id ?? ''} onChange={(e) => setEpEditForm((f: any) => ({ ...f, organ_id: Number(e.target.value) }))}>
                      {organCodes.map((c: any) => <option key={c.id} value={c.id}>{c.name_default}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="detail-input ci-inline-input" value={epEditForm.status_id ?? ''} onChange={(e) => setEpEditForm((f: any) => ({ ...f, status_id: e.target.value ? Number(e.target.value) : null }))}>
                      <option value="">–</option>
                      {tplStatusCodes.map((c: any) => <option key={c.id} value={c.id}>{c.name_default}</option>)}
                    </select>
                  </td>
                  <td><input type="date" className="detail-input ci-inline-input" value={epEditForm.start ?? ''} onChange={(e) => setEpEditForm((f: any) => ({ ...f, start: e.target.value || null }))} /></td>
                  <td><input type="date" className="detail-input ci-inline-input" value={epEditForm.end ?? ''} onChange={(e) => setEpEditForm((f: any) => ({ ...f, end: e.target.value || null }))} /></td>
                  <td><input className="detail-input ci-inline-input" value={epEditForm.fall_nr ?? ''} onChange={(e) => setEpEditForm((f: any) => ({ ...f, fall_nr: e.target.value }))} /></td>
                  <td><input type="date" className="detail-input ci-inline-input" value={epEditForm.tpl_date ?? ''} onChange={(e) => setEpEditForm((f: any) => ({ ...f, tpl_date: e.target.value || null }))} /></td>
                  <td>
                    <label className="detail-checkbox">
                      <input type="checkbox" checked={epEditForm.closed ?? false} disabled={!epEditForm.end} onChange={(e) => setEpEditForm((f: any) => ({ ...f, closed: e.target.checked }))} />
                    </label>
                  </td>
                  <td>
                    <label className="detail-checkbox">
                      <input type="checkbox" checked={epEditForm.fup_recipient_card_done ?? false} onChange={(e) => setEpEditForm((f: any) => ({ ...f, fup_recipient_card_done: e.target.checked }))} />
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
                  onClick={() => {
                    setSelectedEpisodeId(ep.id);
                    setActiveEpisodeTab('Evaluation');
                    setEditingDetailTab(null);
                  }}
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
                    {confirmDeleteEpId === ep.id ? (
                      <span className="ci-confirm">
                        <span className="ci-confirm-text">Delete?</span>
                        <button className="ci-confirm-yes" onClick={() => handleDeleteEpisode(ep.id)}>Yes</button>
                        <button className="ci-confirm-no" onClick={() => setConfirmDeleteEpId(null)}>No</button>
                      </span>
                    ) : (
                      <>
                        <button className="ci-edit-inline" onClick={() => startEditingEp(ep)} title="Edit">✎</button>
                        <button className="ci-delete-btn" onClick={() => setConfirmDeleteEpId(ep.id)} title="Delete">×</button>
                      </>
                    )}
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      ) : (
        <p className="detail-empty">No episodes.</p>
      )}

      {selectedEpisode && (
        <section className="detail-section episode-detail-section">
          <div className="detail-section-heading">
            <h2>Episode {selectedEpisode.organ?.name_default ?? '–'}</h2>
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
          <section className="episode-meta-section">
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
          <div className="episode-tabs-header-row">
            <div className="episode-process-tabs" role="tablist" aria-label="Episode process tabs">
              {episodeDetailTabs.map((tab, idx) => (
                <div key={tab} className="episode-process-step">
                  <button
                    role="tab"
                    aria-selected={activeEpisodeTab === tab}
                    className={`episode-process-tab ${activeEpisodeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveEpisodeTab(tab)}
                  >
                    {tab}
                  </button>
                  {idx < episodeDetailTabs.length - 1 && (
                    <span className="episode-process-arrow" aria-hidden="true">→</span>
                  )}
                </div>
              ))}
            </div>
            <div className="episode-tab-actions">
              {editingDetailTab === activeEpisodeTab ? (
                <div className="edit-actions">
                  <button
                    type="button"
                    className="save-btn"
                    onClick={handleSaveDetailTab}
                    disabled={detailSaving}
                  >
                    {detailSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setEditingDetailTab(null)}
                    disabled={detailSaving}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="edit-btn"
                  onClick={() => {
                    setDetailSaveError('');
                    startEditingDetailTab(activeEpisodeTab);
                  }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
          {detailSaveError && <p className="episode-detail-error">{detailSaveError}</p>}
          {activeEpisodeTab === 'Evaluation' && (
            <div className="episode-detail-grid">
              {evalEntries.map(([key, value]) => (
                <div key={key} className="episode-detail-field">
                  <span className="episode-detail-label">{toFieldLabel(key, 'eval_')}</span>
                  {editingDetailTab === 'Evaluation' ? (
                    typeof value === 'boolean' ? (
                      <label className="detail-checkbox">
                        <input
                          type="checkbox"
                          checked={Boolean(detailForm[key])}
                          onChange={(e) => setDetailForm((f) => ({ ...f, [key]: e.target.checked }))}
                        />
                      </label>
                    ) : (
                      <input
                        className="detail-input"
                        type={isDateField(key) ? 'date' : 'text'}
                        value={detailForm[key] ?? ''}
                        onChange={(e) => setDetailForm((f) => ({ ...f, [key]: isDateField(key) ? (e.target.value || null) : e.target.value }))}
                      />
                    )
                  ) : (
                    <span className="episode-detail-value">{formatEpisodeDetailValue(key, value, formatDate)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeEpisodeTab === 'Listing' && (
            <div className="episode-detail-grid">
              {listEntries.map(([key, value]) => (
                <div key={key} className="episode-detail-field">
                  <span className="episode-detail-label">{toFieldLabel(key, 'list_')}</span>
                  {editingDetailTab === 'Listing' ? (
                    typeof value === 'boolean' ? (
                      <label className="detail-checkbox">
                        <input
                          type="checkbox"
                          checked={Boolean(detailForm[key])}
                          onChange={(e) => setDetailForm((f) => ({ ...f, [key]: e.target.checked }))}
                        />
                      </label>
                    ) : (
                      <input
                        className="detail-input"
                        type={isDateField(key) ? 'date' : 'text'}
                        value={detailForm[key] ?? ''}
                        onChange={(e) => setDetailForm((f) => ({ ...f, [key]: isDateField(key) ? (e.target.value || null) : e.target.value }))}
                      />
                    )
                  ) : (
                    <span className="episode-detail-value">{formatEpisodeDetailValue(key, value, formatDate)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeEpisodeTab === 'Transplantation' && (
            <div className="episode-detail-grid">
              {tplEntries.map(([key, value]) => (
                <div key={key} className="episode-detail-field">
                  <span className="episode-detail-label">{toFieldLabel(key, 'tpl_')}</span>
                  {editingDetailTab === 'Transplantation' ? (
                    typeof value === 'boolean' ? (
                      <label className="detail-checkbox">
                        <input
                          type="checkbox"
                          checked={Boolean(detailForm[key])}
                          onChange={(e) => setDetailForm((f) => ({ ...f, [key]: e.target.checked }))}
                        />
                      </label>
                    ) : (
                      <input
                        className="detail-input"
                        type={isDateField(key) ? 'date' : 'text'}
                        value={detailForm[key] ?? ''}
                        onChange={(e) => setDetailForm((f) => ({ ...f, [key]: isDateField(key) ? (e.target.value || null) : e.target.value }))}
                      />
                    )
                  ) : (
                    <span className="episode-detail-value">{formatEpisodeDetailValue(key, value, formatDate)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeEpisodeTab === 'Follow-Up' && (
            <div className="episode-detail-grid">
              {followUpEntries.map(([key, value]) => (
                <div key={key} className="episode-detail-field">
                  <span className="episode-detail-label">{toFieldLabel(key)}</span>
                  {editingDetailTab === 'Follow-Up' ? (
                    typeof value === 'boolean' ? (
                      <label className="detail-checkbox">
                        <input
                          type="checkbox"
                          checked={Boolean(detailForm[key])}
                          onChange={(e) => setDetailForm((f) => ({ ...f, [key]: e.target.checked }))}
                        />
                      </label>
                    ) : (
                      <input
                        className="detail-input"
                        type={isDateField(key) ? 'date' : 'text'}
                        value={detailForm[key] ?? ''}
                        onChange={(e) => setDetailForm((f) => ({ ...f, [key]: isDateField(key) ? (e.target.value || null) : e.target.value }))}
                      />
                    )
                  ) : (
                    <span className="episode-detail-value">{formatEpisodeDetailValue(key, value, formatDate)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeEpisodeTab === 'Closed' && (
            <div className="episode-detail-grid">
              {closedEntries.map(([key, value]) => (
                <div key={key} className="episode-detail-field">
                  <span className="episode-detail-label">{toFieldLabel(key)}</span>
                  {editingDetailTab === 'Closed' ? (
                    typeof value === 'boolean' ? (
                      <label className="detail-checkbox">
                        <input
                          type="checkbox"
                          checked={Boolean(detailForm[key])}
                          onChange={(e) => setDetailForm((f) => ({ ...f, [key]: e.target.checked }))}
                        />
                      </label>
                    ) : (
                      <input
                        className="detail-input"
                        type={isDateField(key) ? 'date' : 'text'}
                        value={detailForm[key] ?? ''}
                        onChange={(e) => setDetailForm((f) => ({ ...f, [key]: isDateField(key) ? (e.target.value || null) : e.target.value }))}
                      />
                    )
                  ) : (
                    <span className="episode-detail-value">{formatEpisodeDetailValue(key, value, formatDate)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {addingEpisode && (
        <div className="ci-add-form">
          <select className="detail-input" value={epForm.organ_id} onChange={(e) => setEpForm((f: any) => ({ ...f, organ_id: Number(e.target.value) }))}>
            {organCodes.map((c: any) => <option key={c.id} value={c.id}>{c.name_default}</option>)}
          </select>
          <select className="detail-input" value={epForm.status_id ?? ''} onChange={(e) => setEpForm((f: any) => ({ ...f, status_id: e.target.value ? Number(e.target.value) : null }))}>
            <option value="">Status...</option>
            {tplStatusCodes.map((c: any) => <option key={c.id} value={c.id}>{c.name_default}</option>)}
          </select>
          <input type="date" className="detail-input" placeholder="Start" value={epForm.start ?? ''} onChange={(e) => setEpForm((f: any) => ({ ...f, start: e.target.value || null }))} />
          <input type="date" className="detail-input" placeholder="End" value={epForm.end ?? ''} onChange={(e) => setEpForm((f: any) => ({ ...f, end: e.target.value || null }))} />
          <input className="detail-input" placeholder="Fall Nr" value={epForm.fall_nr ?? ''} onChange={(e) => setEpForm((f: any) => ({ ...f, fall_nr: e.target.value }))} />
          <div className="ci-add-actions">
            <button className="save-btn" onClick={handleAddEpisode} disabled={epSaving || !epForm.organ_id}>
              {epSaving ? 'Saving...' : 'Save'}
            </button>
            <button className="cancel-btn" onClick={() => setAddingEpisode(false)} disabled={epSaving}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
