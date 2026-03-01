import type { Code, Episode, Patient, Task, TaskGroup } from '../../api';
import { boardStateSymbol } from './taskBoardUtils';
import TaskBoardRows from './TaskBoardRows';
import type {
  TaskActionState,
  TaskBoardRow,
  TaskCreateFormState,
  TaskGroupEditFormState,
  TaskEditFormState,
} from './taskBoardTypes';

export interface TaskBoardTableProps {
  rows: TaskBoardRow[];
  patientsById: Record<number, Patient>;
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
  patientsById,
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
            <th>Kind</th>
            <th className="task-col-description">Description</th>
            <th>Assigned To</th>
            <th>Due At</th>
            <th className="task-col-comment">Comment</th>
            <th>Closed At</th>
            <th>Closed By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={11}>No tasks match the current filters.</td>
            </tr>
          )}
          <TaskBoardRows
            rows={rows}
            patientsById={patientsById}
            episodesById={episodesById}
            priorityCodes={priorityCodes}
            allUserOptions={allUserOptions}
            editingTaskId={editingTaskId}
            editForm={editForm}
            setEditForm={setEditForm}
            editSaving={editSaving}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onStartComplete={onStartComplete}
            onStartDiscard={onStartDiscard}
            onStartEdit={onStartEdit}
            actionState={actionState}
            actionComment={actionComment}
            setActionComment={setActionComment}
            actionSaving={actionSaving}
            onConfirmAction={onConfirmAction}
            onCancelAction={onCancelAction}
            editingGroupId={editingGroupId}
            groupEditForm={groupEditForm}
            setGroupEditForm={setGroupEditForm}
            groupEditSaving={groupEditSaving}
            onStartEditGroup={onStartEditGroup}
            onSaveEditGroup={onSaveEditGroup}
            onCancelEditGroup={onCancelEditGroup}
            creatingGroupId={creatingGroupId}
            createForm={createForm}
            setCreateForm={setCreateForm}
            createSaving={createSaving}
            onStartCreateTask={onStartCreateTask}
            onSaveCreateTask={onSaveCreateTask}
            onCancelCreateTask={onCancelCreateTask}
          />
        </tbody>
      </table>
    </div>
  );
}
