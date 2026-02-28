import { useState } from 'react';

import type { ProcurementAdminConfig, ProcurementSlotKey, ProcurementValueMode } from '../../../../api';
import type { ProcurementFieldCreatePayload, ProcurementFieldUpdatePayload, ProcurementScopeCreatePayload } from './types';
import { suggestConfigKey } from './utils';

interface ConfiguredFieldsSectionProps {
  config: ProcurementAdminConfig;
  groups: ProcurementAdminConfig['field_group_templates'];
  sortedDatatypes: ProcurementAdminConfig['datatype_definitions'];
  sortedFieldTemplates: ProcurementAdminConfig['field_templates'];
  groupNameById: Map<number, string>;
  datatypeNameById: Map<number, string>;
  scopesByFieldId: Record<number, ProcurementAdminConfig['field_scope_templates']>;
  saving: boolean;
  onCreateField: (payload: ProcurementFieldCreatePayload) => Promise<void>;
  onUpdateField: (fieldId: number, payload: ProcurementFieldUpdatePayload) => Promise<void>;
  onReorderFields: (
    assignments: Array<{ field_id: number; group_template_id: number | null; pos: number }>,
  ) => Promise<void>;
  onCreateScope: (payload: ProcurementScopeCreatePayload) => Promise<void>;
  onDeleteScope: (scopeId: number) => Promise<void>;
}

export default function ConfiguredFieldsSection({
  config,
  groups,
  sortedDatatypes,
  sortedFieldTemplates,
  groupNameById,
  datatypeNameById,
  scopesByFieldId,
  saving,
  onCreateField,
  onUpdateField,
  onReorderFields,
  onCreateScope,
  onDeleteScope,
}: ConfiguredFieldsSectionProps) {
  const [fieldDraft, setFieldDraft] = useState({
    key: '',
    name_default: '',
    comment: '',
    is_active: true,
    datatype_def_id: 0,
    group_template_id: 0,
    value_mode: 'SCALAR' as ProcurementValueMode,
  });
  const [fieldKeyEdited, setFieldKeyEdited] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [editingFieldDraft, setEditingFieldDraft] = useState({ group_template_id: 0, comment: '', is_active: true, pos: 0 });
  const [scopeDraftByFieldId, setScopeDraftByFieldId] = useState<Record<number, { organ_id: number; slot_key: ProcurementSlotKey }>>({});
  const [draggingFieldId, setDraggingFieldId] = useState<number | null>(null);
  const [dragOverFieldId, setDragOverFieldId] = useState<number | null>(null);
  const isScalarMode = fieldDraft.value_mode === 'SCALAR';

  const applyUppercaseWithCaret = (input: HTMLInputElement, update: (value: string) => void) => {
    const nextValue = input.value.toUpperCase();
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    update(nextValue);
    requestAnimationFrame(() => {
      if (document.activeElement !== input) return;
      if (selectionStart == null || selectionEnd == null) return;
      input.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const reorderIds = (ids: number[], sourceId: number, targetId: number): number[] => {
    const fromIndex = ids.indexOf(sourceId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return ids;
    }
    const next = [...ids];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  };

  const handleFieldDrop = (targetFieldId: number) => {
    if (draggingFieldId == null || draggingFieldId === targetFieldId) {
      setDraggingFieldId(null);
      setDragOverFieldId(null);
      return;
    }

    const byId = new Map(sortedFieldTemplates.map((entry) => [entry.id, entry]));
    const orderedIds = sortedFieldTemplates.map((entry) => entry.id);
    const nextOrderIds = reorderIds(orderedIds, draggingFieldId, targetFieldId);
    const targetField = byId.get(targetFieldId);
    if (!targetField) {
      setDraggingFieldId(null);
      setDragOverFieldId(null);
      return;
    }

    const movedField = byId.get(draggingFieldId);
    if (!movedField) {
      setDraggingFieldId(null);
      setDragOverFieldId(null);
      return;
    }

    const nextGroupById = new Map<number, number | null>();
    for (const field of sortedFieldTemplates) {
      nextGroupById.set(field.id, field.group_template_id ?? null);
    }
    nextGroupById.set(draggingFieldId, targetField.group_template_id ?? null);

    const nextPosByFieldId = new Map<number, number>();
    const posByGroup = new Map<string, number>();
    for (const fieldId of nextOrderIds) {
      const groupId = nextGroupById.get(fieldId) ?? null;
      const bucket = groupId == null ? 'ungrouped' : `group:${groupId}`;
      const nextPos = (posByGroup.get(bucket) ?? 0) + 1;
      posByGroup.set(bucket, nextPos);
      nextPosByFieldId.set(fieldId, nextPos);
    }

    const assignments: Array<{ field_id: number; group_template_id: number | null; pos: number }> = [];
    for (const field of sortedFieldTemplates) {
      const nextGroupId = nextGroupById.get(field.id) ?? null;
      const nextPos = nextPosByFieldId.get(field.id) ?? field.pos;
      if ((field.group_template_id ?? null) !== nextGroupId || field.pos !== nextPos) {
        assignments.push({
          field_id: field.id,
          group_template_id: nextGroupId,
          pos: nextPos,
        });
      }
    }

    if (assignments.length > 0) {
      void onReorderFields(assignments);
    }
    setDraggingFieldId(null);
    setDragOverFieldId(null);
  };

  return (
    <section className="admin-proc-block">
      <div className="detail-section-heading admin-proc-block-heading">
        <h2>Fields</h2>
        <p className="status">Define field templates and manage assigned scopes as runtime configuration data.</p>
      </div>
      <div className="admin-proc-block-grid">
        <div className="admin-proc-pane admin-proc-define-pane">
          <h3>Definition Area</h3>
          <div className="admin-people-form admin-proc-field-form">
            <label>
              <span>Name</span>
              <input
                className="detail-input"
                value={fieldDraft.name_default}
                onChange={(e) => {
                  const nextName = e.target.value;
                  setFieldDraft((prev) => ({
                    ...prev,
                    name_default: nextName,
                    key: fieldKeyEdited ? prev.key : suggestConfigKey(nextName),
                  }));
                }}
              />
            </label>
            <label>
              <span>Key</span>
              <input
                className="detail-input"
                value={fieldDraft.key}
                onChange={(e) => {
                  setFieldKeyEdited(true);
                  applyUppercaseWithCaret(e.currentTarget, (value) => {
                    setFieldDraft((prev) => ({ ...prev, key: value }));
                  });
                }}
              />
            </label>
            <label>
              <span>Comment</span>
              <input
                className="detail-input"
                value={fieldDraft.comment}
                onChange={(e) => setFieldDraft((prev) => ({ ...prev, comment: e.target.value }))}
              />
            </label>
            <label>
              <span>Group</span>
              <select
                className="detail-input"
                value={fieldDraft.group_template_id}
                onChange={(e) => setFieldDraft((prev) => ({ ...prev, group_template_id: Number(e.target.value) || 0 }))}
              >
                <option value={0}>No group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name_default}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Datatype</span>
              <select
                className="detail-input"
                value={fieldDraft.datatype_def_id}
                onChange={(e) => setFieldDraft((prev) => ({ ...prev, datatype_def_id: Number(e.target.value) || 0 }))}
                disabled={!isScalarMode}
              >
                <option value={0}>
                  {isScalarMode ? 'Select datatype' : 'Automatic (Managed by value mode)'}
                </option>
                {sortedDatatypes.map((datatype) => (
                  <option key={datatype.id} value={datatype.id}>
                    {datatype.code?.name_default ?? datatype.code?.key ?? `Datatype ${datatype.id}`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Value Mode</span>
              <select
                className="detail-input"
                value={fieldDraft.value_mode}
                onChange={(e) => {
                  const nextMode = e.target.value as ProcurementValueMode;
                  setFieldDraft((prev) => ({
                    ...prev,
                    value_mode: nextMode,
                    datatype_def_id: nextMode === 'SCALAR' ? prev.datatype_def_id : 0,
                  }));
                }}
              >
                <option value="SCALAR">Scalar</option>
                <option value="PERSON_SINGLE">Single Person</option>
                <option value="PERSON_LIST">Person List</option>
                <option value="TEAM_SINGLE">Single Team</option>
                <option value="TEAM_LIST">Team List</option>
                <option value="EPISODE">Episode</option>
              </select>
            </label>
            <div className="admin-proc-action-cell">
              <button
                type="button"
                className="patients-save-btn"
                disabled={
                  saving
                  || !fieldDraft.key.trim()
                  || !fieldDraft.name_default.trim()
                  || (isScalarMode && !fieldDraft.datatype_def_id)
                }
                onClick={() => {
                  const targetGroupId = fieldDraft.group_template_id || null;
                  const nextPos = sortedFieldTemplates
                    .filter((field) => (field.group_template_id ?? null) === targetGroupId)
                    .reduce((maxPos, field) => Math.max(maxPos, field.pos), 0) + 1;
                  void onCreateField({
                    key: fieldDraft.key.trim().toUpperCase(),
                    name_default: fieldDraft.name_default.trim(),
                    comment: fieldDraft.comment.trim(),
                    is_active: fieldDraft.is_active,
                    pos: nextPos,
                    datatype_def_id: isScalarMode ? fieldDraft.datatype_def_id : 0,
                    group_template_id: fieldDraft.group_template_id || null,
                    value_mode: fieldDraft.value_mode,
                  });
                  setFieldDraft({
                    key: '',
                    name_default: '',
                    comment: '',
                    is_active: true,
                    datatype_def_id: 0,
                    group_template_id: 0,
                    value_mode: 'SCALAR',
                  });
                  setFieldKeyEdited(false);
                }}
              >
                Create Field
              </button>
            </div>
          </div>
        </div>
        <div className="admin-proc-pane admin-proc-data-pane">
          <h3>Configured Data</h3>
          <div className="patients-table-wrap ui-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Field</th>
                  <th>Comment</th>
                  <th>Active</th>
                  <th>Pos</th>
                  <th>Datatype</th>
                  <th>Mode</th>
                  <th>Scopes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedFieldTemplates.map((field) => {
                  const currentScopeDraft = scopeDraftByFieldId[field.id] ?? { organ_id: 0, slot_key: 'MAIN' as ProcurementSlotKey };
                  const isEditingRow = editingFieldId === field.id;
                  return (
                    isEditingRow ? (
                      <tr key={field.id} className="ci-editing-row">
                        <td>
                          <select
                            className="detail-input ci-inline-input"
                            value={editingFieldDraft.group_template_id}
                            onChange={(e) => setEditingFieldDraft((prev) => ({ ...prev, group_template_id: Number(e.target.value) || 0 }))}
                          >
                            <option value={0}>No group</option>
                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>{group.name_default}</option>
                            ))}
                          </select>
                        </td>
                        <td>{field.name_default} <span className="admin-access-permission-key">({field.key})</span></td>
                        <td>
                          <input
                            className="detail-input ci-inline-input"
                            value={editingFieldDraft.comment}
                            onChange={(e) => setEditingFieldDraft((prev) => ({ ...prev, comment: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={editingFieldDraft.is_active}
                            onChange={(e) => setEditingFieldDraft((prev) => ({ ...prev, is_active: e.target.checked }))}
                          />
                        </td>
                        <td>
                          <input
                            className="detail-input ci-inline-input"
                            type="number"
                            value={editingFieldDraft.pos}
                            onChange={(e) => setEditingFieldDraft((prev) => ({ ...prev, pos: Number(e.target.value) || 0 }))}
                          />
                        </td>
                        <td>{datatypeNameById.get(field.datatype_def_id) ?? '–'}</td>
                        <td>{field.value_mode}</td>
                        <td>
                          <div className="admin-proc-scope-list">
                            {(scopesByFieldId[field.id] ?? []).map((scope) => (
                              <span key={scope.id} className="person-pill">
                                {(scope.organ?.name_default ?? 'All')} / {scope.slot_key}
                                <button
                                  type="button"
                                  className="person-pill-remove"
                                  title="Remove scope"
                                  onClick={() => {
                                    void onDeleteScope(scope.id);
                                  }}
                                  disabled={saving}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="admin-proc-scope-form">
                            <select
                              className="detail-input"
                              value={currentScopeDraft.organ_id}
                              onChange={(e) =>
                                setScopeDraftByFieldId((prev) => ({
                                  ...prev,
                                  [field.id]: {
                                    ...currentScopeDraft,
                                    organ_id: Number(e.target.value) || 0,
                                  },
                                }))}
                            >
                              <option value={0}>Select organ</option>
                              {config.organs.map((organ) => (
                                <option key={organ.id} value={organ.id}>{organ.name_default}</option>
                              ))}
                            </select>
                            <select
                              className="detail-input"
                              value={currentScopeDraft.slot_key}
                              onChange={(e) =>
                                setScopeDraftByFieldId((prev) => ({
                                  ...prev,
                                  [field.id]: {
                                    ...currentScopeDraft,
                                    slot_key: e.target.value as ProcurementSlotKey,
                                  },
                                }))}
                            >
                              <option value="MAIN">MAIN</option>
                              <option value="LEFT">LEFT</option>
                              <option value="RIGHT">RIGHT</option>
                            </select>
                            <button
                              type="button"
                              className="patients-save-btn"
                              disabled={saving || !currentScopeDraft.organ_id}
                              onClick={() => {
                                void onCreateScope({
                                  field_template_id: field.id,
                                  organ_id: currentScopeDraft.organ_id || null,
                                  slot_key: currentScopeDraft.slot_key,
                                });
                              }}
                            >
                              Add Scope
                            </button>
                          </div>
                        </td>
                        <td className="detail-ci-actions">
                          <button
                            className="ci-save-inline"
                            onClick={() => {
                              void onUpdateField(field.id, {
                                group_template_id: editingFieldDraft.group_template_id || null,
                                comment: editingFieldDraft.comment.trim(),
                                is_active: editingFieldDraft.is_active,
                                pos: editingFieldDraft.pos,
                              });
                              setEditingFieldId(null);
                            }}
                            disabled={
                              saving
                              || (
                                editingFieldDraft.group_template_id === (field.group_template_id ?? 0)
                                && editingFieldDraft.comment.trim() === (field.comment ?? '')
                                && editingFieldDraft.is_active === (field.is_active ?? true)
                                && editingFieldDraft.pos === (field.pos ?? 0)
                              )
                            }
                          >
                            ✓
                          </button>
                          <button
                            className="ci-cancel-inline"
                            onClick={() => setEditingFieldId(null)}
                            disabled={saving}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={field.id}
                        draggable={!saving && editingFieldId == null}
                        onDragStart={() => setDraggingFieldId(field.id)}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverFieldId(field.id);
                        }}
                        onDragLeave={() => setDragOverFieldId((prev) => (prev === field.id ? null : prev))}
                        onDrop={() => handleFieldDrop(field.id)}
                        onDragEnd={() => {
                          setDraggingFieldId(null);
                          setDragOverFieldId(null);
                        }}
                        className={draggingFieldId === field.id ? 'ci-dragging' : dragOverFieldId === field.id ? 'ci-drag-over' : ''}
                      >
                        <td>{field.group_template_id ? (groupNameById.get(field.group_template_id) ?? '–') : '–'}</td>
                        <td>{field.name_default} <span className="admin-access-permission-key">({field.key})</span></td>
                        <td>{field.comment || '–'}</td>
                        <td>{field.is_active ? 'Yes' : 'No'}</td>
                        <td>{field.pos}</td>
                        <td>{datatypeNameById.get(field.datatype_def_id) ?? '–'}</td>
                        <td>{field.value_mode}</td>
                        <td>
                          <div className="admin-proc-scope-list">
                            {(scopesByFieldId[field.id] ?? []).map((scope) => (
                              <span key={scope.id} className="person-pill">
                                {(scope.organ?.name_default ?? 'All')} / {scope.slot_key}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="detail-ci-actions">
                          <button
                            className="ci-edit-inline"
                            onClick={() => {
                              setEditingFieldId(field.id);
                              setEditingFieldDraft({
                                group_template_id: field.group_template_id ?? 0,
                                comment: field.comment ?? '',
                                is_active: field.is_active ?? true,
                                pos: field.pos ?? 0,
                              });
                            }}
                            disabled={saving}
                            title="Edit"
                          >
                            ✎
                          </button>
                        </td>
                      </tr>
                    )
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
