import './MedicalDataTab.css';

export default function MedicalDataTab(props: any) {
  const {
    patient,
    editing,
    startEditing,
    saving,
    handleSave,
    cancelEditing,
    form,
    setForm,
    bloodTypes,
    addingDiag,
    setAddingDiag,
    diagCodes,
    diagForm,
    setDiagForm,
    diagSaving,
    handleAddDiag,
    editingDiagId,
    diagEditForm,
    setDiagEditForm,
    handleSaveDiag,
    cancelEditingDiag,
    startEditingDiag,
    confirmDeleteDiagId,
    setConfirmDeleteDiagId,
    handleDeleteDiag,
    formatDate,
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
    catalogueCache,
    getCatalogueType,
    mvAddMode,
    setMvAddMode,
    mvForm,
    setMvForm,
    datatypeCodes,
    handleAddMv,
  } = props;

  return (
    <>
      <section className="detail-section" style={{ marginTop: '1.5rem' }}>
        <div className="detail-section-heading">
          <h2>Basic Data</h2>
          {!editing ? (
            <button className="edit-btn" onClick={startEditing}>Edit</button>
          ) : (
            <div className="edit-actions">
              <button className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="cancel-btn" onClick={cancelEditing} disabled={saving}>Cancel</button>
            </div>
          )}
        </div>
        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-label">Blood Type</span>
            {editing ? (
              <select
                className="detail-input"
                value={form.blood_type_id ?? ''}
                onChange={(e) => setForm((f: any) => ({ ...f, blood_type_id: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">–</option>
                {bloodTypes.map((bt: any) => (
                  <option key={bt.id} value={bt.id}>{bt.name_default}</option>
                ))}
              </select>
            ) : (
              <span className="detail-value">{patient.blood_type?.name_default ?? '–'}</span>
            )}
          </div>
        </div>
      </section>

      <section className="detail-section" style={{ marginTop: '1.5rem' }}>
        <div className="detail-section-heading">
          <h2>Diagnoses</h2>
          {!addingDiag && (
            <button className="ci-add-btn" onClick={() => setAddingDiag(true)}>+ Add</button>
          )}
        </div>
        {patient.diagnoses && patient.diagnoses.length > 0 ? (
          <table className="detail-contact-table">
            <tbody>
              {patient.diagnoses.map((d: any) => (
                editingDiagId === d.id ? (
                  <tr key={d.id} className="ci-editing-row">
                    <td className="diag-code">
                      <select
                        className="detail-input ci-inline-input"
                        value={diagEditForm.catalogue_id}
                        onChange={(e) => setDiagEditForm((f: any) => ({ ...f, catalogue_id: Number(e.target.value) }))}
                      >
                        {diagCodes.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.key} – {c.name_default}</option>
                        ))}
                      </select>
                    </td>
                    <td className="diag-comment">
                      <input
                        className="detail-input ci-inline-input"
                        value={diagEditForm.comment ?? ''}
                        onChange={(e) => setDiagEditForm((f: any) => ({ ...f, comment: e.target.value }))}
                      />
                    </td>
                    <td className="diag-date">{formatDate(d.updated_at ?? d.created_at)}</td>
                    <td className="detail-ci-actions">
                      <button className="ci-save-inline" onClick={handleSaveDiag} disabled={diagSaving}>✓</button>
                      <button className="ci-cancel-inline" onClick={cancelEditingDiag} disabled={diagSaving}>✕</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={d.id} onDoubleClick={() => startEditingDiag({ id: d.id, catalogue_id: d.catalogue_id, comment: d.comment ?? '' })}>
                    <td className="diag-code">{d.catalogue ? `${d.catalogue.key} – ${d.catalogue.name_default}` : '–'}</td>
                    <td className="diag-comment">{d.comment || ''}</td>
                    <td className="diag-date">{formatDate(d.updated_at ?? d.created_at)}</td>
                    <td className="detail-ci-actions">
                      {confirmDeleteDiagId === d.id ? (
                        <span className="ci-confirm">
                          <span className="ci-confirm-text">Delete?</span>
                          <button className="ci-confirm-yes" onClick={() => handleDeleteDiag(d.id)}>Yes</button>
                          <button className="ci-confirm-no" onClick={() => setConfirmDeleteDiagId(null)}>No</button>
                        </span>
                      ) : (
                        <>
                          <button className="ci-edit-inline" onClick={() => startEditingDiag({ id: d.id, catalogue_id: d.catalogue_id, comment: d.comment ?? '' })} title="Edit">✎</button>
                          <button className="ci-delete-btn" onClick={() => setConfirmDeleteDiagId(d.id)} title="Delete">×</button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        ) : (
          <p className="detail-empty">No diagnoses.</p>
        )}

        {addingDiag && (
          <div className="ci-add-form">
            <select
              className="detail-input"
              value={diagForm.catalogue_id}
              onChange={(e) => setDiagForm((f: any) => ({ ...f, catalogue_id: Number(e.target.value) }))}
            >
              {diagCodes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.key} – {c.name_default}</option>
              ))}
            </select>
            <input
              className="detail-input"
              placeholder="Comment"
              value={diagForm.comment}
              onChange={(e) => setDiagForm((f: any) => ({ ...f, comment: e.target.value }))}
            />
            <div className="ci-add-actions">
              <button className="save-btn" onClick={handleAddDiag} disabled={diagSaving || !diagForm.catalogue_id}>
                {diagSaving ? 'Saving...' : 'Save'}
              </button>
              <button className="cancel-btn" onClick={() => setAddingDiag(false)} disabled={diagSaving}>Cancel</button>
            </div>
          </div>
        )}
      </section>

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
        <table className="detail-contact-table">
          <thead>
            <tr>
              <th className="mv-pos sortable-th" onClick={() => toggleMvSort('pos')}>#{ mvSortIndicator('pos')}</th>
              <th className="mv-name sortable-th" onClick={() => toggleMvSort('name')}>Name{mvSortIndicator('name')}</th>
              <th className="mv-value">Value</th>
              <th className="mv-renew-date sortable-th" onClick={() => toggleMvSort('renew_date')}>Renew Date{mvSortIndicator('renew_date')}</th>
              <th className="diag-date">Edited</th>
              <th className="detail-ci-actions"></th>
            </tr>
          </thead>
          <tbody>
            {sortedMedicalValues.length > 0 ? (
              sortedMedicalValues.map((mv: any) => (
                editingMvId === mv.id ? (
                  <tr key={mv.id} className="ci-editing-row">
                    <td className="mv-pos">{mv.pos || ''}</td>
                    <td className="mv-name">
                      <select
                        className="detail-input ci-inline-input"
                        value={mvEditForm.medical_value_template_id}
                        onChange={(e) => {
                          const tplId = Number(e.target.value);
                          const tpl = mvTemplates.find((t: any) => t.id === tplId);
                          setMvEditForm((f: any) => ({ ...f, medical_value_template_id: tplId, name: tpl?.name_default ?? f.name }));
                        }}
                      >
                        {mvTemplates.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name_default}</option>
                        ))}
                      </select>
                    </td>
                    <td className="mv-value">
                      {renderValueInput(
                        mvEditForm.value ?? '',
                        resolveDt(mvEditForm.medical_value_template_id, mv.datatype_id),
                        (v: string) => setMvEditForm((f: any) => ({ ...f, value: v })),
                        'detail-input ci-inline-input',
                      )}
                    </td>
                    <td className="mv-renew-date">
                      <input
                        className="detail-input ci-inline-input"
                        type="date"
                        value={mvEditForm.renew_date ?? ''}
                        onChange={(e) => setMvEditForm((f: any) => ({ ...f, renew_date: e.target.value || null }))}
                      />
                    </td>
                    <td className="diag-date">{formatDate(mv.updated_at ?? mv.created_at)}</td>
                    <td className="detail-ci-actions">
                      <button className="ci-save-inline" onClick={handleSaveMv} disabled={mvSaving || !validateValue(mvEditForm.value, resolveDt(mvEditForm.medical_value_template_id, mv.datatype_id))}>✓</button>
                      <button className="ci-cancel-inline" onClick={cancelEditingMv} disabled={mvSaving}>✕</button>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={mv.id}
                    draggable={mvSortKey === 'pos' && mvSortAsc && editingMvId === null}
                    onDragStart={() => setMvDragId(mv.id)}
                    onDragOver={(e) => { e.preventDefault(); setMvDragOverId(mv.id); }}
                    onDragLeave={() => setMvDragOverId((prev: any) => prev === mv.id ? null : prev)}
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
                  const tpl = mvTemplates.find((t: any) => t.id === tplId);
                  setMvForm((f: any) => ({ ...f, medical_value_template_id: tplId, name: tpl?.name_default ?? '' }));
                }}
              >
                {mvTemplates.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name_default}</option>
                ))}
              </select>
            ) : (
              <>
                <select
                  className="detail-input"
                  value={mvForm.datatype_id ?? ''}
                  onChange={(e) => setMvForm((f: any) => ({ ...f, datatype_id: Number(e.target.value) }))}
                >
                  <option value="" disabled>Datatype...</option>
                  {datatypeCodes.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name_default}</option>
                  ))}
                </select>
                <input
                  className="detail-input"
                  placeholder="Name"
                  value={mvForm.name}
                  onChange={(e) => setMvForm((f: any) => ({ ...f, name: e.target.value }))}
                />
              </>
            )}

            {renderValueInput(
              mvForm.value ?? '',
              mvAddMode === 'template'
                ? resolveDt(mvForm.medical_value_template_id)
                : resolveDt(null, mvForm.datatype_id),
              (v: string) => setMvForm((f: any) => ({ ...f, value: v })),
              'detail-input',
            )}
            <input
              className="detail-input"
              type="date"
              placeholder="Renew Date"
              value={mvForm.renew_date ?? ''}
              onChange={(e) => setMvForm((f: any) => ({ ...f, renew_date: e.target.value || null }))}
            />
            <div className="ci-add-actions">
              <button
                className="save-btn"
                onClick={handleAddMv}
                disabled={mvSaving || (mvAddMode === 'template' ? !mvForm.medical_value_template_id : (!mvForm.datatype_id || !mvForm.name?.trim())) || !validateValue(mvForm.value, mvAddMode === 'template' ? resolveDt(mvForm.medical_value_template_id) : resolveDt(null, mvForm.datatype_id))}
              >
                {mvSaving ? 'Saving...' : 'Save'}
              </button>
              <button className="cancel-btn" onClick={() => setAddingMv(false)} disabled={mvSaving}>Cancel</button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
