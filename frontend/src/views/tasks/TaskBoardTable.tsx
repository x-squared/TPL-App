import type { Code, Episode, Task, TaskGroup } from '../../api';
import TaskBoardActionForm from './TaskBoardActionForm';
import {
  boardStateSymbol,
  buildTaskReferences,
  formatDate,
  groupStateIndicator,
  isCancelledTask,
  isDoneTask,
  statusIndicator,
} from './taskBoardUtils';
import type {
  TaskActionState,
  TaskBoardRow,
  TaskCreateFormState,
  TaskGroupEditFormState,
  TaskEditFormState,
} from './taskBoardTypes';

interface TaskBoardTableProps {
  rows: TaskBoardRow[];
  episodesById: Record<number, Episode>;
  priorityCodes: Code[];
  allUserOptions: Array<{ id: number; name: string }>;
  editingTaskId: number | null;
  editForm: TaskEditFormState | null;
  setEditForm: (updater: (prev: TaskEditFormState | null) => TaskEditFormState | null) => void;
  editSaving: boolean;
  onSaveEdit: (taskId: number) => void;
  onCancelEdit: () => void;
  onStartComplete: (task: Task) => void;
  onStartDiscard: (task: Task) => void;
  onStartEdit: (task: Task) => void;
  actionState: TaskActionState | null;
  actionComment: string;
  setActionComment: (value: string) => void;
  actionSaving: boolean;
  onConfirmAction: () => void;
  onCancelAction: () => void;
  editingGroupId: number | null;
  groupEditForm: TaskGroupEditFormState | null;
  setGroupEditForm: (updater: (prev: TaskGroupEditFormState | null) => TaskGroupEditFormState | null) => void;
  groupEditSaving: boolean;
  onStartEditGroup: (group: TaskGroup) => void;
  onSaveEditGroup: (groupId: number) => void;
  onCancelEditGroup: () => void;
  creatingGroupId: number | null;
  createForm: TaskCreateFormState | null;
  setCreateForm: (updater: (prev: TaskCreateFormState | null) => TaskCreateFormState | null) => void;
  createSaving: boolean;
  onStartCreateTask: (taskGroupId: number) => void;
  onSaveCreateTask: (taskGroupId: number) => void;
  onCancelCreateTask: () => void;
  maxTableHeight: number | string;
}

export default function TaskBoardTable({
  rows,
  episodesById,
  priorityCodes,
  allUserOptions,
  editingTaskId,
  editForm,
  setEditForm,
  editSaving,
  onSaveEdit,
  onCancelEdit,
  onStartComplete,
  onStartDiscard,
  onStartEdit,
  actionState,
  actionComment,
  setActionComment,
  actionSaving,
  onConfirmAction,
  onCancelAction,
  editingGroupId,
  groupEditForm,
  setGroupEditForm,
  groupEditSaving,
  onStartEditGroup,
  onSaveEditGroup,
  onCancelEditGroup,
  creatingGroupId,
  createForm,
  setCreateForm,
  createSaving,
  onStartCreateTask,
  onSaveCreateTask,
  onCancelCreateTask,
  maxTableHeight,
}: TaskBoardTableProps) {
  const headerStateSymbol = boardStateSymbol(rows);

  return (
    <div className="ui-table-wrap task-board-table-scroll" style={{ maxHeight: maxTableHeight }}>
      <table className="data-table task-board-table">
        <thead>
          <tr>
            <th
              aria-label="State"
              title="State"
            >
              {headerStateSymbol}
            </th>
            <th>Priority</th>
            <th>Reference</th>
            <th className="task-col-description">Description</th>
            <th>Assigned To</th>
            <th>Due Date</th>
            <th className="task-col-comment">Comment</th>
            <th>Closed Date</th>
            <th>Closed By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={10}>No tasks match the current filters.</td>
            </tr>
          )}
          {rows.map((row, idx) => {
            if (row.type === 'group') {
              const isClosedGroup = row.state === 'COMPLETED' || row.state === 'DISCARDED';
              const isEditingGroup = editingGroupId === row.group.id && groupEditForm !== null;
              const isCreating = !isClosedGroup && creatingGroupId === row.group.id && createForm !== null;
              return [
                <tr key={`group-${row.group.id}-${idx}`} className="task-board-group-row">
                  <td className="task-board-state" title="Task group state" aria-label="Task group state">
                    {groupStateIndicator(row.state)}
                  </td>
                  <td colSpan={8} className="task-board-group-label">
                    {row.group.name || `Group #${row.group.id}`}
                  </td>
                  <td>
                    <div className="task-board-row-actions">
                      <button
                        className="edit-btn"
                        onClick={() => onStartEditGroup(row.group)}
                        disabled={editingGroupId !== null && editingGroupId !== row.group.id}
                        title="Edit task group"
                        aria-label="Edit task group"
                      >
                        ✎
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => onStartCreateTask(row.group.id)}
                        disabled={
                          isClosedGroup
                          || (creatingGroupId !== null && creatingGroupId !== row.group.id)
                          || editingGroupId !== null
                        }
                        title={isClosedGroup ? 'Task group is closed (completed/discarded); no new tasks allowed' : 'Add task to group'}
                        aria-label="Add task to group"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>,
                isEditingGroup ? (
                  <tr key={`group-edit-${row.group.id}`} className="task-board-inline-group-edit-row">
                    <td colSpan={10}>
                      <div className="task-board-action-form">
                        <p className="task-board-action-title">
                          Edit group #{row.group.id}
                        </p>
                        <div className="ui-filter-bar task-board-group-edit-fields">
                          <label>
                            Name
                            <input
                              className="ui-filter-input"
                              value={groupEditForm.name}
                              onChange={(e) =>
                                setGroupEditForm((prev) => (prev
                                  ? {
                                    ...prev,
                                    name: e.target.value,
                                  }
                                  : prev))
                              }
                            />
                          </label>
                        </div>
                        <div className="task-board-action-buttons">
                          <button
                            className="save-btn"
                            onClick={() => onSaveEditGroup(row.group.id)}
                            disabled={groupEditSaving || groupEditForm.name.trim() === ''}
                            title="Save group"
                            aria-label="Save group"
                          >
                            {groupEditSaving ? '…' : '✓'}
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={onCancelEditGroup}
                            disabled={groupEditSaving}
                            title="Cancel group edit"
                            aria-label="Cancel group edit"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null,
                isCreating ? (
                  <tr key={`group-add-${row.group.id}`} className="task-board-inline-create-row">
                    <td className="task-board-state">●</td>
                    <td>
                      <select
                        className="ui-filter-input task-board-cell-input"
                        value={createForm.priority_id ?? ''}
                        onChange={(e) =>
                          setCreateForm((prev) => (prev ? { ...prev, priority_id: e.target.value ? Number(e.target.value) : null } : prev))
                        }
                      >
                        <option value="">–</option>
                        {priorityCodes.map((priority) => (
                          <option key={priority.id} value={priority.id}>{priority.name_default}</option>
                        ))}
                      </select>
                    </td>
                    <td>Group #{row.group.id}</td>
                    <td className="task-col-description">
                      <input
                        className="ui-filter-input task-board-cell-input"
                        value={createForm.description}
                        onChange={(e) => setCreateForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                        placeholder="Description"
                      />
                    </td>
                    <td>
                      <select
                        className="ui-filter-input task-board-cell-input"
                        value={createForm.assigned_to_id ?? ''}
                        onChange={(e) =>
                          setCreateForm((prev) => (prev ? { ...prev, assigned_to_id: e.target.value ? Number(e.target.value) : null } : prev))
                        }
                      >
                        <option value="">–</option>
                        {allUserOptions.map((user) => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="ui-filter-input task-board-cell-input"
                        type="date"
                        value={createForm.until}
                        onChange={(e) => setCreateForm((prev) => (prev ? { ...prev, until: e.target.value } : prev))}
                      />
                    </td>
                    <td className="task-col-comment">
                      <input
                        className="ui-filter-input task-board-cell-input"
                        value={createForm.comment}
                        onChange={(e) => setCreateForm((prev) => (prev ? { ...prev, comment: e.target.value } : prev))}
                        placeholder="Comment"
                      />
                    </td>
                    <td>–</td>
                    <td>–</td>
                    <td>
                      <div className="task-board-row-actions">
                        <button
                          className="save-btn"
                          onClick={() => onSaveCreateTask(row.group.id)}
                          disabled={createSaving || createForm.description.trim() === '' || createForm.until.trim() === ''}
                          title="Create task"
                          aria-label="Create task"
                        >
                          {createSaving ? '…' : '✓'}
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={onCancelCreateTask}
                          disabled={createSaving}
                          title="Cancel task creation"
                          aria-label="Cancel task creation"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : null,
              ];
            }

            const task = row.task;
            const episode = row.group.episode_id ? episodesById[row.group.episode_id] : undefined;
            const references = buildTaskReferences({ group: row.group, task, episode });
            const done = isDoneTask(task);
            const cancelled = isCancelledTask(task);
            const rowClass = done
              ? 'task-board-task-row is-done'
              : cancelled
                ? 'task-board-task-row is-cancelled'
                : 'task-board-task-row';
            const isEditing = editingTaskId === task.id && editForm !== null;
            const canFinalize = !done && !cancelled;

            return [
              <tr key={`task-${task.id}`} className={rowClass}>
                <td className="task-board-state">{statusIndicator(task)}</td>
                <td>
                  {isEditing ? (
                    <select
                      className="ui-filter-input task-board-cell-input"
                      value={editForm.priority_id ?? ''}
                      onChange={(e) =>
                        setEditForm((prev) => (prev ? { ...prev, priority_id: e.target.value ? Number(e.target.value) : null } : prev))
                      }
                    >
                      <option value="">–</option>
                      {priorityCodes.map((priority) => (
                        <option key={priority.id} value={priority.id}>{priority.name_default}</option>
                      ))}
                    </select>
                  ) : (task.priority?.name_default ?? task.priority?.key ?? '–')}
                </td>
                <td>{references.length > 0 ? references.map((ref) => ref.label).join(' · ') : '–'}</td>
                <td className="task-col-description">
                  {isEditing ? (
                    <input
                      className="ui-filter-input task-board-cell-input"
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                    />
                  ) : (task.description || '–')}
                </td>
                <td>
                  {isEditing ? (
                    <select
                      className="ui-filter-input task-board-cell-input"
                      value={editForm.assigned_to_id ?? ''}
                      onChange={(e) =>
                        setEditForm((prev) => (prev ? { ...prev, assigned_to_id: e.target.value ? Number(e.target.value) : null } : prev))
                      }
                    >
                      <option value="">–</option>
                      {allUserOptions.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  ) : (task.assigned_to?.name ?? '–')}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="ui-filter-input task-board-cell-input"
                      type="date"
                      value={editForm.until}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, until: e.target.value } : prev))}
                    />
                  ) : formatDate(task.until)}
                </td>
                <td className="task-col-comment">
                  {isEditing ? (
                    <input
                      className="ui-filter-input task-board-cell-input"
                      value={editForm.comment}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, comment: e.target.value } : prev))}
                    />
                  ) : (task.comment || '–')}
                </td>
                <td>{formatDate(task.closed_at)}</td>
                <td>{task.closed_by?.name ?? '–'}</td>
                <td>
                  {isEditing ? (
                    <div className="task-board-row-actions">
                      <button
                        className="save-btn"
                        onClick={() => onSaveEdit(task.id)}
                        disabled={editSaving || editForm.until.trim() === ''}
                        title="Save edit"
                        aria-label="Save edit"
                      >
                        {editSaving ? '…' : '✓'}
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={onCancelEdit}
                        disabled={editSaving}
                        title="Cancel edit"
                        aria-label="Cancel edit"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="task-board-row-actions">
                      <button
                        className="edit-btn"
                        onClick={() => onStartComplete(task)}
                        disabled={!canFinalize}
                        title="Complete task"
                        aria-label="Complete task"
                      >
                        ✓
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => onStartDiscard(task)}
                        disabled={!canFinalize}
                        title="Discard task"
                        aria-label="Discard task"
                      >
                        −
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => onStartEdit(task)}
                        disabled={editingTaskId !== null}
                        title="Edit task"
                        aria-label="Edit task"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </td>
              </tr>,
              actionState?.task.id === task.id ? (
                <tr key={`task-action-${task.id}`} className="task-board-inline-action-row">
                  <td colSpan={10}>
                    <TaskBoardActionForm
                      actionState={actionState}
                      actionComment={actionComment}
                      setActionComment={setActionComment}
                      actionSaving={actionSaving}
                      onConfirm={onConfirmAction}
                      onCancel={onCancelAction}
                    />
                  </td>
                </tr>
              ) : null,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
