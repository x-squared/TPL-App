import { useEffect, useMemo, useState } from 'react';

import type { Code, TaskGroupTemplate, TaskTemplate } from '../../../api';
import ErrorBanner from '../../layout/ErrorBanner';
import { combineOffsetMinutes, splitOffsetMinutes } from '../hooks/useAdminTaskTemplates';

interface OffsetParts {
  days: number;
  hours: number;
  minutes: number;
}

interface EditFormState {
  task_group_template_id: number;
  description: string;
  kind_key: 'TASK' | 'EVENT';
  priority_id: number | null;
  is_active: boolean;
  sort_pos: number;
  offset: OffsetParts;
}

interface CreateFormState extends EditFormState {}

interface GroupTemplateCreateFormState {
  key: string;
  name: string;
  description: string;
  organ_id: number | null;
  is_active: boolean;
  sort_pos: number;
}

interface GroupTemplateEditFormState {
  key: string;
  name: string;
  description: string;
  organ_id: number | null;
  is_active: boolean;
  sort_pos: number;
}

interface AdminTaskTemplatesTabProps {
  templates: TaskTemplate[];
  groupTemplates: TaskGroupTemplate[];
  taskScopeCodes: Code[];
  organCodes: Code[];
  priorityCodes: Code[];
  loading: boolean;
  saving: boolean;
  error: string;
  onCreateGroupTemplate: (payload: {
    key: string;
    name: string;
    description: string;
    scope_id: number;
    organ_id: number | null;
    is_active: boolean;
    sort_pos: number;
  }) => Promise<void>;
  onUpdateGroupTemplate: (
    taskGroupTemplateId: number,
    payload: {
      key: string;
      name: string;
      description: string;
      organ_id: number | null;
      is_active: boolean;
      sort_pos: number;
    },
  ) => Promise<void>;
  onCreateTemplate: (payload: {
    task_group_template_id: number;
    description: string;
    kind_key: 'TASK' | 'EVENT';
    priority_id: number | null;
    offset_minutes_default: number;
    is_active: boolean;
    sort_pos: number;
  }) => Promise<void>;
  onUpdateTemplate: (
    taskTemplateId: number,
    payload: {
      task_group_template_id: number;
      description: string;
      kind_key: 'TASK' | 'EVENT';
      priority_id: number | null;
      offset_minutes_default: number;
      is_active: boolean;
      sort_pos: number;
    },
  ) => Promise<void>;
}

function buildInitialCreateForm(groupTemplates: TaskGroupTemplate[]): CreateFormState {
  return {
    task_group_template_id: groupTemplates[0]?.id ?? 0,
    description: '',
    kind_key: 'TASK',
    priority_id: null,
    is_active: true,
    sort_pos: 0,
    offset: { days: 0, hours: 0, minutes: 0 },
  };
}

export default function AdminTaskTemplatesTab({
  templates,
  groupTemplates,
  taskScopeCodes,
  organCodes,
  priorityCodes,
  loading,
  saving,
  error,
  onCreateGroupTemplate,
  onUpdateGroupTemplate,
  onCreateTemplate,
  onUpdateTemplate,
}: AdminTaskTemplatesTabProps) {
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [createForm, setCreateForm] = useState<CreateFormState>(buildInitialCreateForm(groupTemplates));
  const [editingGroupTemplateId, setEditingGroupTemplateId] = useState<number | null>(null);
  const [editGroupTemplateForm, setEditGroupTemplateForm] = useState<GroupTemplateEditFormState | null>(null);
  const [createGroupTemplateForm, setCreateGroupTemplateForm] = useState<GroupTemplateCreateFormState>({
    key: '',
    name: '',
    description: '',
    organ_id: null,
    is_active: true,
    sort_pos: 0,
  });

  useEffect(() => {
    if (groupTemplates.length === 0) return;
    setCreateForm((prev) => (
      prev.task_group_template_id
        ? prev
        : { ...prev, task_group_template_id: groupTemplates[0].id }
    ));
  }, [groupTemplates]);

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => (a.sort_pos - b.sort_pos) || (a.id - b.id)),
    [templates],
  );
  const sortedGroupTemplates = useMemo(
    () => [...groupTemplates].sort((a, b) => (a.sort_pos - b.sort_pos) || (a.id - b.id)),
    [groupTemplates],
  );
  const coordinationProtocolScopeId = taskScopeCodes.find((entry) => entry.key === 'COORDINATION_PROTOCOL')?.id ?? null;

  const startEdit = (template: TaskTemplate) => {
    setEditingTemplateId(template.id);
    setEditForm({
      task_group_template_id: template.task_group_template_id,
      description: template.description,
      kind_key: template.kind_key ?? 'TASK',
      priority_id: template.priority_id,
      is_active: template.is_active,
      sort_pos: template.sort_pos,
      offset: splitOffsetMinutes(template.offset_minutes_default),
    });
  };

  const saveEdit = async (templateId: number) => {
    if (!editForm) return;
    await onUpdateTemplate(templateId, {
      task_group_template_id: editForm.task_group_template_id,
      description: editForm.description.trim(),
      kind_key: editForm.kind_key,
      priority_id: editForm.priority_id,
      offset_minutes_default: combineOffsetMinutes(editForm.offset),
      is_active: editForm.is_active,
      sort_pos: editForm.sort_pos,
    });
    setEditingTemplateId(null);
    setEditForm(null);
  };

  const saveCreate = async () => {
    if (!createForm.description.trim() || !createForm.task_group_template_id) return;
    await onCreateTemplate({
      task_group_template_id: createForm.task_group_template_id,
      description: createForm.description.trim(),
      kind_key: createForm.kind_key,
      priority_id: createForm.priority_id,
      offset_minutes_default: combineOffsetMinutes(createForm.offset),
      is_active: createForm.is_active,
      sort_pos: createForm.sort_pos,
    });
    setCreateForm((prev) => ({ ...buildInitialCreateForm(groupTemplates), task_group_template_id: prev.task_group_template_id }));
  };

  const startEditGroupTemplate = (template: TaskGroupTemplate) => {
    setEditingGroupTemplateId(template.id);
    setEditGroupTemplateForm({
      key: template.key,
      name: template.name,
      description: template.description,
      organ_id: template.organ_id,
      is_active: template.is_active,
      sort_pos: template.sort_pos,
    });
  };

  const saveCreateGroupTemplate = async () => {
    if (!coordinationProtocolScopeId) return;
    if (!createGroupTemplateForm.key.trim() || !createGroupTemplateForm.name.trim()) return;
    await onCreateGroupTemplate({
      key: createGroupTemplateForm.key.trim(),
      name: createGroupTemplateForm.name.trim(),
      description: createGroupTemplateForm.description.trim(),
      scope_id: coordinationProtocolScopeId,
      organ_id: createGroupTemplateForm.organ_id,
      is_active: createGroupTemplateForm.is_active,
      sort_pos: createGroupTemplateForm.sort_pos,
    });
    setCreateGroupTemplateForm({
      key: '',
      name: '',
      description: '',
      organ_id: null,
      is_active: true,
      sort_pos: 0,
    });
  };

  const saveEditGroupTemplate = async (taskGroupTemplateId: number) => {
    if (!editGroupTemplateForm) return;
    await onUpdateGroupTemplate(taskGroupTemplateId, {
      key: editGroupTemplateForm.key.trim(),
      name: editGroupTemplateForm.name.trim(),
      description: editGroupTemplateForm.description.trim(),
      organ_id: editGroupTemplateForm.organ_id,
      is_active: editGroupTemplateForm.is_active,
      sort_pos: editGroupTemplateForm.sort_pos,
    });
    setEditingGroupTemplateId(null);
    setEditGroupTemplateForm(null);
  };

  return (
    <section className="detail-section ui-panel-section">
      <div className="detail-section-heading">
        <h2>Coordination Protocol Task Templates</h2>
      </div>
      {loading && <p className="status">Loading task templates...</p>}
      {error && <ErrorBanner message={error} />}
      {!loading && (
        <>
          <div className="admin-task-template-create admin-people-form">
            <label>
              <span>Group Key</span>
              <input
                className="detail-input"
                value={createGroupTemplateForm.key}
                onChange={(e) => setCreateGroupTemplateForm((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="COORD_PROTOCOL_COMMON"
              />
            </label>
            <label>
              <span>Group Name</span>
              <input
                className="detail-input"
                value={createGroupTemplateForm.name}
                onChange={(e) => setCreateGroupTemplateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Protocol - Common"
              />
            </label>
            <label>
              <span>Description</span>
              <input
                className="detail-input"
                value={createGroupTemplateForm.description}
                onChange={(e) => setCreateGroupTemplateForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </label>
            <label>
              <span>Organ</span>
              <select
                className="detail-input"
                value={createGroupTemplateForm.organ_id ?? ''}
                onChange={(e) => setCreateGroupTemplateForm((prev) => ({ ...prev, organ_id: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">All organs</option>
                {organCodes.map((organ) => (
                  <option key={organ.id} value={organ.id}>
                    {organ.name_default}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Active</span>
              <input
                type="checkbox"
                checked={createGroupTemplateForm.is_active}
                onChange={(e) => setCreateGroupTemplateForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
            </label>
            <label>
              <span>Pos</span>
              <input
                className="detail-input"
                type="number"
                value={createGroupTemplateForm.sort_pos}
                onChange={(e) => setCreateGroupTemplateForm((prev) => ({ ...prev, sort_pos: Number(e.target.value || 0) }))}
              />
            </label>
            <div className="admin-proc-action-cell">
              <button
                className="save-btn"
                disabled={saving || !createGroupTemplateForm.key.trim() || !createGroupTemplateForm.name.trim() || !coordinationProtocolScopeId}
                onClick={() => { void saveCreateGroupTemplate(); }}
              >
                + Add Group Template
              </button>
            </div>
          </div>

          <div className="ui-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Organ</th>
                  <th>Active</th>
                  <th>Pos</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedGroupTemplates.map((groupTemplate) => {
                  const isEditing = editingGroupTemplateId === groupTemplate.id && editGroupTemplateForm !== null;
                  return (
                    <tr key={groupTemplate.id}>
                      <td>
                        {isEditing ? (
                          <input
                            className="detail-input"
                            value={editGroupTemplateForm.key}
                            onChange={(e) => setEditGroupTemplateForm((prev) => (prev ? { ...prev, key: e.target.value } : prev))}
                          />
                        ) : groupTemplate.key}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="detail-input"
                            value={editGroupTemplateForm.name}
                            onChange={(e) => setEditGroupTemplateForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                          />
                        ) : groupTemplate.name}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="detail-input"
                            value={editGroupTemplateForm.description}
                            onChange={(e) => setEditGroupTemplateForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                          />
                        ) : groupTemplate.description}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className="detail-input"
                            value={editGroupTemplateForm.organ_id ?? ''}
                            onChange={(e) => setEditGroupTemplateForm((prev) => (prev ? { ...prev, organ_id: e.target.value ? Number(e.target.value) : null } : prev))}
                          >
                            <option value="">All organs</option>
                            {organCodes.map((organ) => (
                              <option key={organ.id} value={organ.id}>
                                {organ.name_default}
                              </option>
                            ))}
                          </select>
                        ) : (groupTemplate.organ?.name_default ?? 'All organs')}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editGroupTemplateForm.is_active}
                            onChange={(e) => setEditGroupTemplateForm((prev) => (prev ? { ...prev, is_active: e.target.checked } : prev))}
                          />
                        ) : (groupTemplate.is_active ? 'Yes' : 'No')}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="detail-input"
                            type="number"
                            value={editGroupTemplateForm.sort_pos}
                            onChange={(e) => setEditGroupTemplateForm((prev) => (prev ? { ...prev, sort_pos: Number(e.target.value || 0) } : prev))}
                          />
                        ) : groupTemplate.sort_pos}
                      </td>
                      <td className="admin-people-actions-cell">
                        {isEditing ? (
                          <div className="admin-inline-actions">
                            <button
                              className="save-btn"
                              disabled={saving || !editGroupTemplateForm.key.trim() || !editGroupTemplateForm.name.trim()}
                              onClick={() => { void saveEditGroupTemplate(groupTemplate.id); }}
                            >
                              ✓
                            </button>
                            <button
                              className="cancel-btn"
                              disabled={saving}
                              onClick={() => { setEditingGroupTemplateId(null); setEditGroupTemplateForm(null); }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button className="edit-btn" disabled={saving} onClick={() => startEditGroupTemplate(groupTemplate)}>
                            ✎
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {sortedGroupTemplates.length === 0 && (
                  <tr>
                    <td colSpan={7}>No coordination protocol group templates available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-task-template-create admin-people-form">
            <label>
              <span>Group Template</span>
              <select
                className="detail-input"
                value={createForm.task_group_template_id}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, task_group_template_id: Number(e.target.value) }))}
              >
                {groupTemplates.map((groupTemplate) => (
                  <option key={groupTemplate.id} value={groupTemplate.id}>
                    {groupTemplate.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Description</span>
              <input
                className="detail-input"
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </label>
            <label>
              <span>Kind</span>
              <select
                className="detail-input"
                value={createForm.kind_key}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, kind_key: e.target.value as 'TASK' | 'EVENT' }))}
              >
                <option value="TASK">Task</option>
                <option value="EVENT">Event</option>
              </select>
            </label>
            <label>
              <span>Priority</span>
              <select
                className="detail-input"
                value={createForm.priority_id ?? ''}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, priority_id: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">(default)</option>
                {priorityCodes.map((priority) => (
                  <option key={priority.id} value={priority.id}>{priority.name_default}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Offset Days</span>
              <input
                className="detail-input"
                type="number"
                value={createForm.offset.days}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, offset: { ...prev.offset, days: Number(e.target.value || 0) } }))}
              />
            </label>
            <label>
              <span>Offset Hours</span>
              <input
                className="detail-input"
                type="number"
                value={createForm.offset.hours}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, offset: { ...prev.offset, hours: Number(e.target.value || 0) } }))}
              />
            </label>
            <label>
              <span>Offset Minutes</span>
              <input
                className="detail-input"
                type="number"
                value={createForm.offset.minutes}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, offset: { ...prev.offset, minutes: Number(e.target.value || 0) } }))}
              />
            </label>
            <div className="admin-proc-action-cell">
              <button className="save-btn" disabled={saving || !createForm.description.trim()} onClick={() => { void saveCreate(); }}>
                + Add Template
              </button>
            </div>
          </div>

          <div className="ui-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Kind</th>
                  <th>Description</th>
                  <th>Priority</th>
                  <th>Days</th>
                  <th>Hours</th>
                  <th>Minutes</th>
                  <th>Active</th>
                  <th>Pos</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTemplates.map((template) => {
                  const isEditing = editingTemplateId === template.id && editForm !== null;
                  const offset = splitOffsetMinutes(template.offset_minutes_default);
                  return (
                    <tr key={template.id}>
                      <td>
                        {isEditing ? (
                          <select
                            className="detail-input"
                            value={editForm.task_group_template_id}
                            onChange={(e) => setEditForm((prev) => (prev ? { ...prev, task_group_template_id: Number(e.target.value) } : prev))}
                          >
                            {groupTemplates.map((groupTemplate) => (
                              <option key={groupTemplate.id} value={groupTemplate.id}>
                                {groupTemplate.name}
                              </option>
                            ))}
                          </select>
                        ) : (template.task_group_template?.name ?? `#${template.task_group_template_id}`)}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className="detail-input"
                            value={editForm.kind_key}
                            onChange={(e) => setEditForm((prev) => (prev ? { ...prev, kind_key: e.target.value as 'TASK' | 'EVENT' } : prev))}
                          >
                            <option value="TASK">Task</option>
                            <option value="EVENT">Event</option>
                          </select>
                        ) : template.kind_key}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="detail-input"
                            value={editForm.description}
                            onChange={(e) => setEditForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                          />
                        ) : template.description}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className="detail-input"
                            value={editForm.priority_id ?? ''}
                            onChange={(e) => setEditForm((prev) => (prev ? { ...prev, priority_id: e.target.value ? Number(e.target.value) : null } : prev))}
                          >
                            <option value="">(default)</option>
                            {priorityCodes.map((priority) => (
                              <option key={priority.id} value={priority.id}>{priority.name_default}</option>
                            ))}
                          </select>
                        ) : (template.priority?.name_default ?? '–')}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="detail-input"
                            type="number"
                            value={editForm.offset.days}
                            onChange={(e) => setEditForm((prev) => (prev ? { ...prev, offset: { ...prev.offset, days: Number(e.target.value || 0) } } : prev))}
                          />
                        ) : offset.days}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="detail-input"
                            type="number"
                            value={editForm.offset.hours}
                            onChange={(e) => setEditForm((prev) => (prev ? { ...prev, offset: { ...prev.offset, hours: Number(e.target.value || 0) } } : prev))}
                          />
                        ) : offset.hours}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="detail-input"
                            type="number"
                            value={editForm.offset.minutes}
                            onChange={(e) => setEditForm((prev) => (prev ? { ...prev, offset: { ...prev.offset, minutes: Number(e.target.value || 0) } } : prev))}
                          />
                        ) : offset.minutes}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editForm.is_active}
                            onChange={(e) => setEditForm((prev) => (prev ? { ...prev, is_active: e.target.checked } : prev))}
                          />
                        ) : (template.is_active ? 'Yes' : 'No')}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="detail-input"
                            type="number"
                            value={editForm.sort_pos}
                            onChange={(e) => setEditForm((prev) => (prev ? { ...prev, sort_pos: Number(e.target.value || 0) } : prev))}
                          />
                        ) : template.sort_pos}
                      </td>
                      <td className="admin-people-actions-cell">
                        {isEditing ? (
                          <div className="admin-inline-actions">
                            <button className="save-btn" disabled={saving || !editForm.description.trim()} onClick={() => { void saveEdit(template.id); }}>
                              ✓
                            </button>
                            <button className="cancel-btn" disabled={saving} onClick={() => { setEditingTemplateId(null); setEditForm(null); }}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button className="edit-btn" disabled={saving} onClick={() => startEdit(template)}>
                            ✎
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {sortedTemplates.length === 0 && (
                  <tr>
                    <td colSpan={10}>No task templates available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
