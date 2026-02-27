import { useState } from 'react';
import type { PatientMedicalValuesModel } from '../../patient-detail/PatientDetailTabs';
import InlineDeleteActions from '../../layout/InlineDeleteActions';

type MedicalValuesSectionProps = PatientMedicalValuesModel & {
  formatDate: (iso: string | null) => string;
};

export default function MedicalValuesSection({
  addingMv,
  setAddingMv,
  handleAddAllMv,
  mvSaving,
  groupedMedicalValues,
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
  setMvAddMode,
  mvForm,
  setMvForm,
  datatypeCodes,
  handleAddMv,
  editingGroupRenewId,
  groupRenewDraft,
  setGroupRenewDraft,
  startEditingGroupRenew,
  cancelEditingGroupRenew,
  saveGroupRenewDate,
}: MedicalValuesSectionProps) {
  const [addingMvGroupId, setAddingMvGroupId] = useState<number | null>(null);

  const openAddForGroup = (group: { id: number; key: string }, groupTemplateOptions: typeof mvTemplates) => {
    const isUserCapturedGroup = group.key === 'USER_CAPTURED';
    const hasTemplates = groupTemplateOptions.length > 0 || mvTemplates.length > 0;
    if (!isUserCapturedGroup && hasTemplates) {
      setMvAddMode('template');
      setMvForm({
        medical_value_template_id: null,
        medical_value_group_id: group.id,
        name: '',
        value: '',
        renew_date: '',
      });
    } else {
      setMvAddMode('custom');
      setMvForm({
        medical_value_template_id: null,
        datatype_id: null,
        medical_value_group_id: group.id,
        name: '',
        value: '',
        renew_date: '',
      });
    }
    setAddingMvGroupId(group.id);
    setAddingMv(true);
  };

  const closeAddForGroup = () => {
    setAddingMv(false);
    setAddingMvGroupId(null);
  };

  return (
    <section className="detail-section medical-values-section">
      <div className="detail-section-heading">
        <h2>Medical Values</h2>
        {!addingMv && (
          <>
            <button className="ci-add-btn" onClick={handleAddAllMv} disabled={mvSaving}>+ Add all</button>
          </>
        )}
      </div>
      {groupedMedicalValues.length === 0 ? (
        <table className="detail-contact-table">
          <tbody>
            <tr><td colSpan={6} className="detail-empty">No medical values.</td></tr>
          </tbody>
        </table>
      ) : (
        groupedMedicalValues.map(({ group, values }) => (
          <div key={group.id} className="mv-group-block">
            {(() => {
              const groupTemplates = mvTemplates.filter((template) => template.medical_value_group_id === group.id);
              const templateOptions = groupTemplates.length > 0 ? groupTemplates : mvTemplates;
              const effectiveAddMode = group.key === 'USER_CAPTURED' ? 'custom' : 'template';
              return (
                <>
            <div className="detail-section-heading mv-group-heading">
              <h3>{group.name_default || group.key}</h3>
              {editingGroupRenewId === group.id ? (
                <div className="edit-actions">
                  <input
                    className="detail-input ci-inline-input"
                    type="date"
                    value={groupRenewDraft}
                    onChange={(e) => setGroupRenewDraft(e.target.value)}
                  />
                  <button className="ci-save-inline" onClick={() => void saveGroupRenewDate(group.id)} title="Save renewal">✓</button>
                  <button className="ci-cancel-inline" onClick={cancelEditingGroupRenew} title="Cancel">✕</button>
                  <button className="mv-group-add-inline" onClick={() => openAddForGroup(group, templateOptions)} title={`Add value to ${group.name_default || group.key}`}>+ Add</button>
                </div>
              ) : (
                <div className="mv-group-renew-read">
                  <span className="detail-label">Renewal: {formatDate(group.renew_date)}</span>
                  <button className="ci-edit-inline" onClick={() => startEditingGroupRenew(group)} title="Edit group renewal">✎</button>
                  <button className="mv-group-add-inline" onClick={() => openAddForGroup(group, templateOptions)} title={`Add value to ${group.name_default || group.key}`}>+ Add</button>
                </div>
              )}
            </div>
            {addingMv && addingMvGroupId === group.id && (
              <div className="ci-add-form mv-group-add-form">
                {effectiveAddMode === 'template' ? (
                  <select
                    className="detail-input"
                    value={mvForm.medical_value_template_id ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const tplId = raw ? Number(raw) : null;
                      const tpl = templateOptions.find((t) => t.id === tplId);
                      setMvForm((f) => ({
                        ...f,
                        medical_value_template_id: tplId,
                        medical_value_group_id: group.id,
                        name: tpl?.name_default ?? f.name ?? '',
                        value: '',
                      }));
                    }}
                  >
                    <option value="" disabled>Template...</option>
                    {templateOptions.map((t) => (
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
                {effectiveAddMode === 'template' && !mvForm.medical_value_template_id ? (
                  <input className="detail-input" value="" placeholder="Choose template first" disabled />
                ) : (
                  renderValueInput(
                    mvForm.value ?? '',
                    effectiveAddMode === 'template'
                      ? resolveDt(mvForm.medical_value_template_id)
                      : resolveDt(null, mvForm.datatype_id),
                    (v: string) => setMvForm((f) => ({ ...f, value: v })),
                    'detail-input',
                  )
                )}
                <div className="mv-renew-capture-field">
                  <span className="mv-renew-capture-label">Renewal</span>
                  <input
                    className="detail-input"
                    type="date"
                    value={mvForm.renew_date ?? ''}
                    onChange={(e) => setMvForm((f) => ({ ...f, renew_date: e.target.value || null }))}
                  />
                </div>
                <div className="ci-add-actions">
                  <button
                    className="save-btn"
                    onClick={async () => {
                      await handleAddMv();
                      setAddingMvGroupId(null);
                    }}
                    disabled={
                      mvSaving ||
                      (effectiveAddMode === 'template'
                        ? !mvForm.medical_value_template_id
                        : (!mvForm.datatype_id || !mvForm.name?.trim())) ||
                      !validateValue(
                        mvForm.value ?? '',
                        effectiveAddMode === 'template' ? resolveDt(mvForm.medical_value_template_id) : resolveDt(null, mvForm.datatype_id)
                      )
                    }
                  >
                    {mvSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button className="cancel-btn" onClick={closeAddForGroup} disabled={mvSaving}>Cancel</button>
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
                {values.length > 0 ? (
                  values.map((mv) => (
                    editingMvId === mv.id ? (
                      <tr key={mv.id} className="ci-editing-row">
                        <td className="mv-pos">{mv.pos || ''}</td>
                        <td className="mv-name">
                          <select
                            className="detail-input ci-inline-input"
                            value={mvEditForm.medical_value_template_id ?? ''}
                            onChange={(e) => {
                              const tplId = Number(e.target.value);
                              const tpl = mvTemplates.find((t) => t.id === tplId);
                              setMvEditForm((f) => ({
                                ...f,
                                medical_value_template_id: tplId,
                                medical_value_group_id: tpl?.medical_value_group_id ?? f.medical_value_group_id ?? null,
                                name: tpl?.name_default ?? f.name,
                              }));
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
                        onDrop={() => void handleMvDrop(mv.id)}
                        onDragEnd={() => { setMvDragId(null); setMvDragOverId(null); }}
                        onDoubleClick={() => startEditingMv({
                          id: mv.id,
                          medical_value_template_id: mv.medical_value_template_id,
                          medical_value_group_id: mv.medical_value_group_id,
                          name: mv.name,
                          value: mv.value,
                          renew_date: mv.renew_date,
                        })}
                        className={mvDragId === mv.id ? 'mv-dragging' : mvDragOverId === mv.id ? 'mv-drag-over' : ''}
                      >
                        <td className="mv-pos mv-drag-handle">{mv.pos || ''}</td>
                        <td className="mv-name">
                          {mv.medical_value_template?.is_main ? (
                            <span className="mv-main-badge" title="Primary value" aria-label="Primary value" />
                          ) : null}
                          {mv.name || mv.medical_value_template?.name_default || '–'}
                        </td>
                        <td className="mv-value">{formatValue(mv.value, mv.datatype, catalogueCache[getCatalogueType(mv.datatype)])}</td>
                        <td className="mv-renew-date">{formatDate(mv.renew_date)}</td>
                        <td className="diag-date">{formatDate(mv.updated_at ?? mv.created_at)}</td>
                        <td className="detail-ci-actions">
                          <InlineDeleteActions
                            confirming={confirmDeleteMvId === mv.id}
                            onEdit={() => startEditingMv({
                              id: mv.id,
                              medical_value_template_id: mv.medical_value_template_id,
                              medical_value_group_id: mv.medical_value_group_id,
                              name: mv.name,
                              value: mv.value,
                              renew_date: mv.renew_date,
                            })}
                            onRequestDelete={() => setConfirmDeleteMvId(mv.id)}
                            onConfirmDelete={() => void handleDeleteMv(mv.id)}
                            onCancelDelete={() => setConfirmDeleteMvId(null)}
                          />
                        </td>
                      </tr>
                    )
                  ))
                ) : (
                  <tr><td colSpan={6} className="detail-empty">No values in this bunch.</td></tr>
                )}
              </tbody>
            </table>
                </>
              );
            })()}
          </div>
        ))
      )}
    </section>
  );
}
