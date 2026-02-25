import type { PatientMedicalValuesModel } from '../../patient-detail/PatientDetailTabs';

type MedicalValuesSectionProps = PatientMedicalValuesModel & {
  formatDate: (iso: string | null) => string;
};

export default function MedicalValuesSection({
  addingMv,
  setAddingMv,
  handleAddAllMv,
  mvSaving,
  sortedMedicalValues,
  toggleMvSort,
  mvSortIndicator,
  editingMvId,
  mvEditForm,
  setMvEditForm,
  mvTemplates,
  renderValueInput,
  resolveDt,
  handleSaveMv,
  cancelEditingMv,
  validateValue,
  confirmDeleteMvId,
  setConfirmDeleteMvId,
  handleDeleteMv,
  startEditingMv,
  mvSortKey,
  mvSortAsc,
  mvDragId,
  mvDragOverId,
  setMvDragId,
  setMvDragOverId,
  handleMvDrop,
  formatValue,
  formatDate,
  catalogueCache,
  getCatalogueType,
  mvAddMode,
  setMvAddMode,
  mvForm,
  setMvForm,
  datatypeCodes,
  handleAddMv,
}: MedicalValuesSectionProps) {
  return (
    <section className="detail-section">
      <div className="detail-section-heading">
        <h2>Medical Values</h2>
        {!addingMv && (
          <>
            <button className="ci-add-btn" onClick={handleAddAllMv} disabled={mvSaving}>+ Add all</button>
            <button className="ci-add-btn" onClick={() => setAddingMv(true)}>+ Add</button>
          </>
        )}
      </div>
      {addingMv && (
        <div className="ci-add-form">
          <div className="mv-mode-toggle">
            <button
              className={`mv-mode-btn ${mvAddMode === 'template' ? 'active' : ''}`}
              onClick={() => {
                setMvAddMode('template');
                const first = mvTemplates[0];
                setMvForm({ medical_value_template_id: first?.id ?? null, name: first?.name_default ?? '', value: '', renew_date: '' });
              }}
            >From Template</button>
            <button
              className={`mv-mode-btn ${mvAddMode === 'custom' ? 'active' : ''}`}
              onClick={() => {
                setMvAddMode('custom');
                setMvForm({ medical_value_template_id: null, datatype_id: datatypeCodes[0]?.id ?? null, name: '', value: '', renew_date: '' });
              }}
            >Custom</button>
          </div>

          {mvAddMode === 'template' ? (
            <select
              className="detail-input"
              value={mvForm.medical_value_template_id ?? ''}
              onChange={(e) => {
                const tplId = Number(e.target.value);
                const tpl = mvTemplates.find((t) => t.id === tplId);
                setMvForm((f) => ({ ...f, medical_value_template_id: tplId, name: tpl?.name_default ?? '' }));
              }}
            >
              {mvTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name_default}</option>
              ))}
            </select>
          ) : (
            <>
              <select
                className="detail-input"
                value={mvForm.datatype_id ?? ''}
                onChange={(e) => setMvForm((f) => ({ ...f, datatype_id: Number(e.target.value) }))}
              >
                <option value="" disabled>Datatype...</option>
                {datatypeCodes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_default}</option>
                ))}
              </select>
              <input
                className="detail-input"
                placeholder="Name"
                value={mvForm.name}
                onChange={(e) => setMvForm((f) => ({ ...f, name: e.target.value }))}
              />
            </>
          )}

          {renderValueInput(
            mvForm.value ?? '',
            mvAddMode === 'template'
              ? resolveDt(mvForm.medical_value_template_id)
              : resolveDt(null, mvForm.datatype_id),
            (v: string) => setMvForm((f) => ({ ...f, value: v })),
            'detail-input',
          )}
          <input
            className="detail-input"
            type="date"
            placeholder="Renew Date"
            value={mvForm.renew_date ?? ''}
            onChange={(e) => setMvForm((f) => ({ ...f, renew_date: e.target.value || null }))}
          />
          <div className="ci-add-actions">
            <button
              className="save-btn"
              onClick={handleAddMv}
              disabled={
                mvSaving ||
                (mvAddMode === 'template'
                  ? !mvForm.medical_value_template_id
                  : (!mvForm.datatype_id || !mvForm.name?.trim())) ||
                !validateValue(
                  mvForm.value ?? '',
                  mvAddMode === 'template' ? resolveDt(mvForm.medical_value_template_id) : resolveDt(null, mvForm.datatype_id)
                )
              }
            >
              {mvSaving ? 'Saving...' : 'Save'}
            </button>
            <button className="cancel-btn" onClick={() => setAddingMv(false)} disabled={mvSaving}>Cancel</button>
          </div>
        </div>
      )}
      <table className="detail-contact-table">
        <thead>
          <tr>
            <th className="mv-pos sortable-th" onClick={() => toggleMvSort('pos')}>#{mvSortIndicator('pos')}</th>
            <th className="mv-name sortable-th" onClick={() => toggleMvSort('name')}>Name{mvSortIndicator('name')}</th>
            <th className="mv-value">Value</th>
            <th className="mv-renew-date sortable-th" onClick={() => toggleMvSort('renew_date')}>Renew Date{mvSortIndicator('renew_date')}</th>
            <th className="diag-date">Edited</th>
            <th className="detail-ci-actions"></th>
          </tr>
        </thead>
        <tbody>
          {sortedMedicalValues.length > 0 ? (
            sortedMedicalValues.map((mv) => (
              editingMvId === mv.id ? (
                <tr key={mv.id} className="ci-editing-row">
                  <td className="mv-pos">{mv.pos || ''}</td>
                  <td className="mv-name">
                    <select
                      className="detail-input ci-inline-input"
                      value={mvEditForm.medical_value_template_id}
                      onChange={(e) => {
                        const tplId = Number(e.target.value);
                        const tpl = mvTemplates.find((t) => t.id === tplId);
                        setMvEditForm((f) => ({ ...f, medical_value_template_id: tplId, name: tpl?.name_default ?? f.name }));
                      }}
                    >
                      {mvTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name_default}</option>
                      ))}
                    </select>
                  </td>
                  <td className="mv-value">
                    {renderValueInput(
                      mvEditForm.value ?? '',
                      resolveDt(mvEditForm.medical_value_template_id, mv.datatype_id),
                      (v: string) => setMvEditForm((f) => ({ ...f, value: v })),
                      'detail-input ci-inline-input',
                    )}
                  </td>
                  <td className="mv-renew-date">
                    <input
                      className="detail-input ci-inline-input"
                      type="date"
                      value={mvEditForm.renew_date ?? ''}
                      onChange={(e) => setMvEditForm((f) => ({ ...f, renew_date: e.target.value || null }))}
                    />
                  </td>
                  <td className="diag-date">{formatDate(mv.updated_at ?? mv.created_at)}</td>
                  <td className="detail-ci-actions">
                    <button className="ci-save-inline" onClick={handleSaveMv} disabled={mvSaving || !validateValue(mvEditForm.value ?? '', resolveDt(mvEditForm.medical_value_template_id, mv.datatype_id))}>✓</button>
                    <button className="ci-cancel-inline" onClick={cancelEditingMv} disabled={mvSaving}>✕</button>
                  </td>
                </tr>
              ) : (
                <tr
                  key={mv.id}
                  draggable={mvSortKey === 'pos' && mvSortAsc && editingMvId === null}
                  onDragStart={() => setMvDragId(mv.id)}
                  onDragOver={(e) => { e.preventDefault(); setMvDragOverId(mv.id); }}
                  onDragLeave={() => setMvDragOverId((prev) => prev === mv.id ? null : prev)}
                  onDrop={() => handleMvDrop(mv.id)}
                  onDragEnd={() => { setMvDragId(null); setMvDragOverId(null); }}
                  onDoubleClick={() => startEditingMv({ id: mv.id, medical_value_template_id: mv.medical_value_template_id, name: mv.name, value: mv.value, renew_date: mv.renew_date })}
                  className={mvDragId === mv.id ? 'mv-dragging' : mvDragOverId === mv.id ? 'mv-drag-over' : ''}
                >
                  <td className="mv-pos mv-drag-handle">{mv.pos || ''}</td>
                  <td className="mv-name">{mv.name || mv.medical_value_template?.name_default || '–'}</td>
                  <td className="mv-value">{formatValue(mv.value, mv.datatype, catalogueCache[getCatalogueType(mv.datatype)])}</td>
                  <td className="mv-renew-date">{formatDate(mv.renew_date)}</td>
                  <td className="diag-date">{formatDate(mv.updated_at ?? mv.created_at)}</td>
                  <td className="detail-ci-actions">
                    {confirmDeleteMvId === mv.id ? (
                      <span className="ci-confirm">
                        <span className="ci-confirm-text">Delete?</span>
                        <button className="ci-confirm-yes" onClick={() => handleDeleteMv(mv.id)}>Yes</button>
                        <button className="ci-confirm-no" onClick={() => setConfirmDeleteMvId(null)}>No</button>
                      </span>
                    ) : (
                      <>
                        <button className="ci-edit-inline" onClick={() => startEditingMv({ id: mv.id, medical_value_template_id: mv.medical_value_template_id, name: mv.name, value: mv.value, renew_date: mv.renew_date })} title="Edit">✎</button>
                        <button className="ci-delete-btn" onClick={() => setConfirmDeleteMvId(mv.id)} title="Delete">×</button>
                      </>
                    )}
                  </td>
                </tr>
              )
            ))
          ) : (
            <tr><td colSpan={6} className="detail-empty">No medical values.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
