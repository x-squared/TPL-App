import { useState } from 'react';

import type { ProcurementAdminConfig } from '../../../../api';
import InlineDeleteActions from '../../../layout/InlineDeleteActions';
import type { ProcurementGroupCreatePayload, ProcurementGroupUpdatePayload } from './types';
import { suggestConfigKey } from './utils';

interface ConfiguredGroupsSectionProps {
  groups: ProcurementAdminConfig['field_group_templates'];
  saving: boolean;
  onCreateGroup: (payload: ProcurementGroupCreatePayload) => Promise<void>;
  onUpdateGroup: (groupId: number, payload: ProcurementGroupUpdatePayload) => Promise<void>;
  onReorderGroups: (groupIdsInOrder: number[]) => Promise<void>;
  onDeleteGroup: (groupId: number) => Promise<void>;
}

export default function ConfiguredGroupsSection({
  groups,
  saving,
  onCreateGroup,
  onUpdateGroup,
  onReorderGroups,
  onDeleteGroup,
}: ConfiguredGroupsSectionProps) {
  const [groupDraft, setGroupDraft] = useState({ key: '', name_default: '', comment: '' });
  const [groupKeyEdited, setGroupKeyEdited] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupDraft, setEditingGroupDraft] = useState({
    key: '',
    name_default: '',
    comment: '',
    is_active: true,
    pos: 0,
  });
  const [draggingGroupId, setDraggingGroupId] = useState<number | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<number | null>(null);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<number | null>(null);

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

  return (
    <section className="admin-proc-block">
      <div className="detail-section-heading admin-proc-block-heading">
        <h2>Groups</h2>
      </div>
      <div className="admin-proc-block-grid">
        <div className="admin-proc-pane admin-proc-define-pane">
          <h3>Definition Area</h3>
          <div className="admin-people-form">
            <label>
              <span>Name</span>
              <input
                className="detail-input"
                value={groupDraft.name_default}
                onChange={(e) => {
                  const nextName = e.target.value;
                  setGroupDraft((prev) => ({
                    ...prev,
                    name_default: nextName,
                    key: groupKeyEdited ? prev.key : suggestConfigKey(nextName),
                  }));
                }}
              />
            </label>
            <label>
              <span>Key</span>
              <input
                className="detail-input"
                value={groupDraft.key}
                onChange={(e) => {
                  setGroupKeyEdited(true);
                  applyUppercaseWithCaret(e.currentTarget, (value) => {
                    setGroupDraft((prev) => ({ ...prev, key: value }));
                  });
                }}
              />
            </label>
            <label>
              <span>Comment</span>
              <input
                className="detail-input"
                value={groupDraft.comment}
                onChange={(e) => setGroupDraft((prev) => ({ ...prev, comment: e.target.value }))}
              />
            </label>
            <div className="admin-proc-action-cell">
              <button
                type="button"
                className="patients-save-btn"
                disabled={saving || !groupDraft.key.trim() || !groupDraft.name_default.trim()}
                onClick={() => {
                  const nextPos = groups.reduce((maxPos, group) => Math.max(maxPos, group.pos), 0) + 1;
                  void onCreateGroup({
                    key: groupDraft.key.trim().toUpperCase(),
                    name_default: groupDraft.name_default.trim(),
                    comment: groupDraft.comment.trim(),
                    is_active: true,
                    pos: nextPos,
                  });
                  setGroupDraft({ key: '', name_default: '', comment: '' });
                  setGroupKeyEdited(false);
                }}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
        <div className="admin-proc-pane admin-proc-data-pane">
          <h3>Configured Data</h3>
          {groups.length === 0 ? (
            <p className="detail-empty">No groups configured.</p>
          ) : (
            <div className="patients-table-wrap ui-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Key</th>
                    <th>Comment</th>
                    <th>Active</th>
                    <th>Pos</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    editingGroupId === group.id ? (
                      <tr key={group.id} className="ci-editing-row">
                        <td>
                          <input
                            className="detail-input ci-inline-input"
                            value={editingGroupDraft.name_default}
                            onChange={(e) => setEditingGroupDraft((prev) => ({ ...prev, name_default: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            className="detail-input ci-inline-input"
                            value={editingGroupDraft.key}
                            onChange={(e) =>
                              applyUppercaseWithCaret(e.currentTarget, (value) => {
                                setEditingGroupDraft((prev) => ({ ...prev, key: value }));
                              })}
                          />
                        </td>
                        <td>
                          <input
                            className="detail-input ci-inline-input"
                            value={editingGroupDraft.comment}
                            onChange={(e) => setEditingGroupDraft((prev) => ({ ...prev, comment: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={editingGroupDraft.is_active}
                            onChange={(e) => setEditingGroupDraft((prev) => ({ ...prev, is_active: e.target.checked }))}
                          />
                        </td>
                        <td>
                          <input
                            className="detail-input ci-inline-input"
                            type="number"
                            value={editingGroupDraft.pos}
                            onChange={(e) => setEditingGroupDraft((prev) => ({ ...prev, pos: Number(e.target.value) || 0 }))}
                          />
                        </td>
                        <td className="detail-ci-actions">
                          <button
                            className="ci-save-inline"
                            onClick={() => {
                              void onUpdateGroup(group.id, {
                                key: editingGroupDraft.key.trim().toUpperCase(),
                                name_default: editingGroupDraft.name_default.trim(),
                                comment: editingGroupDraft.comment.trim(),
                                is_active: editingGroupDraft.is_active,
                                pos: editingGroupDraft.pos,
                              });
                              setEditingGroupId(null);
                            }}
                            disabled={saving || !editingGroupDraft.key.trim() || !editingGroupDraft.name_default.trim()}
                          >
                            ✓
                          </button>
                          <button
                            className="ci-cancel-inline"
                            onClick={() => setEditingGroupId(null)}
                            disabled={saving}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={group.id}
                        draggable={!saving && editingGroupId == null}
                        onDragStart={() => setDraggingGroupId(group.id)}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverGroupId(group.id);
                        }}
                        onDragLeave={() => setDragOverGroupId((prev) => (prev === group.id ? null : prev))}
                        onDrop={() => {
                          if (draggingGroupId == null) return;
                          const orderedIds = groups.map((entry) => entry.id);
                          const nextOrder = reorderIds(orderedIds, draggingGroupId, group.id);
                          if (nextOrder.join(',') !== orderedIds.join(',')) {
                            void onReorderGroups(nextOrder);
                          }
                          setDraggingGroupId(null);
                          setDragOverGroupId(null);
                        }}
                        onDragEnd={() => {
                          setDraggingGroupId(null);
                          setDragOverGroupId(null);
                        }}
                        className={draggingGroupId === group.id ? 'ci-dragging' : dragOverGroupId === group.id ? 'ci-drag-over' : ''}
                      >
                        <td>{group.name_default}</td>
                        <td><span className="admin-access-permission-key">{group.key}</span></td>
                        <td>{group.comment || '–'}</td>
                        <td>{group.is_active ? 'Yes' : 'No'}</td>
                        <td>{group.pos}</td>
                        <td className="detail-ci-actions">
                          <InlineDeleteActions
                            confirming={confirmDeleteGroupId === group.id}
                            deleting={saving}
                            onEdit={() => {
                              setEditingGroupId(group.id);
                              setEditingGroupDraft({
                                key: group.key,
                                name_default: group.name_default,
                                comment: group.comment ?? '',
                                is_active: group.is_active ?? true,
                                pos: group.pos,
                              });
                            }}
                            onRequestDelete={() => setConfirmDeleteGroupId(group.id)}
                            onConfirmDelete={() => {
                              const confirmed = window.confirm(
                                'Deleting this group will unassign fields from the group. Do you want to continue?',
                              );
                              if (!confirmed) return;
                              void onDeleteGroup(group.id);
                            }}
                            onCancelDelete={() => setConfirmDeleteGroupId(null)}
                          />
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
