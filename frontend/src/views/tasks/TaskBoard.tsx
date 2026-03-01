import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type Task, type TaskCreate, type TaskGroup, type TaskUpdate } from '../../api';
import { ApiError } from '../../api/error';
import ErrorBanner from '../layout/ErrorBanner';
import '../layout/PanelLayout.css';
import './TaskBoard.css';
import TaskBoardFilters from './TaskBoardFilters';
import TaskBoardTable from './TaskBoardTable';
import { computeGroupState, isCancelledTask, isDoneTask, sortTasks } from './taskBoardUtils';
import { buildDefaultTaskDescription, findContextManagedGroup } from './taskBoardContext';
import type {
  TaskBoardProps,
  TaskBoardRow,
} from './taskBoardTypes';
import useTaskBoardData from './useTaskBoardData';
import {
  useTaskBoardActionState,
  useTaskBoardEditState,
  useTaskBoardFilters,
  useTaskBoardGroupState,
} from './hooks/useTaskBoardUiState';

function nowLocalDateTimeIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}:00`;
}

export default function TaskBoard({
  criteria,
  title = 'Tasks',
  onAddClick = () => undefined,
  maxTableHeight = 420,
  headerMeta,
  hideFilters = false,
  showGroupHeadingsDefault = true,
  includeClosedTasks = false,
  autoCreateToken,
  onAutoCreateSaved,
  onAutoCreateDiscarded,
}: TaskBoardProps) {
  const apiErrorHasDetail = (error: unknown, expected: string): boolean => {
    if (!(error instanceof ApiError)) return false;
    const detail = (error.detail as { detail?: unknown })?.detail;
    if (typeof detail === 'string') return detail.includes(expected);
    if (Array.isArray(detail)) {
      return detail.some((item) => JSON.stringify(item).includes(expected));
    }
    return JSON.stringify(error.detail).includes(expected);
  };
  const [effectiveColloqiumAgendaId, setEffectiveColloqiumAgendaId] = useState<number | null>(
    criteria.colloqiumAgendaId ?? null,
  );
  const filters = useTaskBoardFilters(includeClosedTasks, showGroupHeadingsDefault);
  const actionStateModel = useTaskBoardActionState();
  const editStateModel = useTaskBoardEditState();
  const groupStateModel = useTaskBoardGroupState();
  const [panelAddSaving, setPanelAddSaving] = useState(false);
  const [preferredTopGroupId, setPreferredTopGroupId] = useState<number | null>(null);
  const [autoCreatedTaskId, setAutoCreatedTaskId] = useState<number | null>(null);
  const prevAutoCreateTokenRef = useRef<number | undefined>(autoCreateToken);

  useEffect(() => {
    setEffectiveColloqiumAgendaId(criteria.colloqiumAgendaId ?? null);
  }, [criteria.colloqiumAgendaId, criteria.episodeId, criteria.colloqiumId, criteria.patientId]);

  useEffect(() => {
    setPreferredTopGroupId(null);
  }, [criteria.patientId, criteria.episodeId, effectiveColloqiumAgendaId, criteria.tplPhaseId]);

  const statusKeysToLoad = useMemo(() => {
    if (includeClosedTasks) return ['PENDING', 'COMPLETED', 'CANCELLED'];
    const keys = ['PENDING'];
    if (filters.showDoneTasks) keys.push('COMPLETED');
    if (filters.showCancelledTasks) keys.push('CANCELLED');
    return keys;
  }, [includeClosedTasks, filters.showDoneTasks, filters.showCancelledTasks]);

  const effectiveCriteria = useMemo(
    () => ({
      ...criteria,
      colloqiumAgendaId: effectiveColloqiumAgendaId,
    }),
    [criteria, effectiveColloqiumAgendaId],
  );

  const {
    loading,
    error,
    taskGroups,
    tasksByGroup,
    patientsById,
    episodesById,
    organCodes,
    priorityCodes,
    taskStatusByKey,
    allUsers,
    reload,
  } = useTaskBoardData(effectiveCriteria, statusKeysToLoad);

  const assignedToOptions = useMemo(() => {
    const options = new Map<number, string>();
    Object.values(tasksByGroup).forEach((tasks) => {
      tasks.forEach((task) => {
        if (!task.assigned_to_id) return;
        options.set(task.assigned_to_id, task.assigned_to?.name ?? allUsers[task.assigned_to_id] ?? `User #${task.assigned_to_id}`);
      });
    });
    return [...options.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasksByGroup, allUsers]);

  const organOptions = useMemo(
    () => organCodes.map((organ) => ({ id: organ.id, name: organ.name_default })),
    [organCodes],
  );

  const allUserOptions = useMemo(
    () =>
      Object.entries(allUsers)
        .map(([id, name]) => ({ id: Number(id), name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allUsers],
  );

  const startTaskAction = (task: Task, type: 'complete' | 'discard') => {
    groupStateModel.setEditingGroupId(null);
    groupStateModel.setGroupEditForm(null);
    groupStateModel.setCreatingGroupId(null);
    groupStateModel.setCreateForm(null);
    editStateModel.setEditingTaskId(null);
    editStateModel.setEditForm(null);
    actionStateModel.setActionState({ task, type });
    actionStateModel.setActionComment(task.comment ?? '');
  };

  const applyTaskAction = async () => {
    if (!actionStateModel.actionState) return;
    const statusKey = actionStateModel.actionState.type === 'complete' ? 'COMPLETED' : 'CANCELLED';
    const statusCode = taskStatusByKey[statusKey];
    if (!statusCode) return;
    const nextComment = actionStateModel.actionComment.trim();
    if (actionStateModel.actionState.type === 'discard' && !nextComment) return;

    actionStateModel.setActionSaving(true);
    try {
      const payload: TaskUpdate = {
        status_id: statusCode.id,
        comment: nextComment || '',
      };
      await api.updateTask(actionStateModel.actionState.task.id, payload);
      actionStateModel.setActionState(null);
      actionStateModel.setActionComment('');
      reload();
    } finally {
      actionStateModel.setActionSaving(false);
    }
  };

  const startEditTask = (task: Task) => {
    groupStateModel.setEditingGroupId(null);
    groupStateModel.setGroupEditForm(null);
    groupStateModel.setCreatingGroupId(null);
    groupStateModel.setCreateForm(null);
    actionStateModel.setActionState(null);
    actionStateModel.setActionComment('');
    editStateModel.setEditingTaskId(task.id);
    editStateModel.setEditForm({
      description: task.description ?? '',
      kind_key: task.kind_key ?? 'TASK',
      priority_id: task.priority_id ?? null,
      assigned_to_id: task.assigned_to_id ?? null,
      until: task.until ?? '',
      comment: task.comment ?? '',
    });
  };

  const cancelEditTask = () => {
    editStateModel.setEditingTaskId(null);
    editStateModel.setEditForm(null);
  };

  const startCreateTask = (taskGroupId: number) => {
    groupStateModel.setEditingGroupId(null);
    groupStateModel.setGroupEditForm(null);
    actionStateModel.setActionState(null);
    actionStateModel.setActionComment('');
    editStateModel.setEditingTaskId(null);
    editStateModel.setEditForm(null);
    groupStateModel.setCreatingGroupId(taskGroupId);
    groupStateModel.setCreateForm({
      description: '',
      kind_key: 'TASK',
      priority_id: null,
      assigned_to_id: null,
      until: nowLocalDateTimeIso(),
      comment: '',
    });
  };

  const cancelCreateTask = () => {
    groupStateModel.setCreatingGroupId(null);
    groupStateModel.setCreateForm(null);
  };

  const startEditGroup = (group: TaskGroup) => {
    actionStateModel.setActionState(null);
    actionStateModel.setActionComment('');
    editStateModel.setEditingTaskId(null);
    editStateModel.setEditForm(null);
    groupStateModel.setCreatingGroupId(null);
    groupStateModel.setCreateForm(null);
    groupStateModel.setEditingGroupId(group.id);
    groupStateModel.setGroupEditForm({
      name: group.name ?? '',
    });
  };

  const cancelEditGroup = () => {
    groupStateModel.setEditingGroupId(null);
    groupStateModel.setGroupEditForm(null);
  };

  const saveEditGroup = async (groupId: number) => {
    if (!groupStateModel.groupEditForm) return;
    const nextName = groupStateModel.groupEditForm.name.trim();
    if (!nextName) return;
    groupStateModel.setGroupEditSaving(true);
    try {
      await api.updateTaskGroup(groupId, {
        name: nextName,
      });
      cancelEditGroup();
      reload();
    } finally {
      groupStateModel.setGroupEditSaving(false);
    }
  };

  const saveCreateTask = async (taskGroupId: number) => {
    if (!groupStateModel.createForm) return;
    const nextDescription = groupStateModel.createForm.description.trim();
    if (!nextDescription) return;

    groupStateModel.setCreateSaving(true);
    try {
      const payload: TaskCreate = {
        task_group_id: taskGroupId,
        description: nextDescription,
        kind_key: groupStateModel.createForm.kind_key,
        priority_id: groupStateModel.createForm.priority_id,
        assigned_to_id: groupStateModel.createForm.assigned_to_id,
        until: groupStateModel.createForm.until,
        comment: groupStateModel.createForm.comment,
      };
      await api.createTask(payload);
      cancelCreateTask();
      reload();
    } finally {
      groupStateModel.setCreateSaving(false);
    }
  };

  const createTaskFromPanelContext = async (source: 'manual' | 'auto' = 'manual') => {
    if (panelAddSaving) return;
    const contextPatientId = criteria.patientId;
    if (!contextPatientId) {
      return;
    }

    setPanelAddSaving(true);
    try {
      const resolveCurrentColloqiumAgendaId = async (): Promise<number | null> => {
        if (criteria.colloqiumId == null || criteria.episodeId == null) return effectiveColloqiumAgendaId;
        const agendas = await api.listColloqiumAgendas({ episodeId: criteria.episodeId });
        const matching = agendas
          .filter((agenda) => agenda.colloqium_id === criteria.colloqiumId)
          .sort((a, b) => a.id - b.id)[0];
        const resolved = matching?.id ?? null;
        setEffectiveColloqiumAgendaId(resolved);
        return resolved;
      };
      const tryCreateContextGroup = async (colloqiumAgendaId: number | null): Promise<TaskGroup> => api.createTaskGroup({
        patient_id: contextPatientId,
        task_group_template_id: null,
        episode_id: criteria.episodeId ?? null,
        colloqium_agenda_id: colloqiumAgendaId,
        tpl_phase_id: criteria.episodeId != null ? (criteria.tplPhaseId ?? null) : null,
      });
      let taskGroup = findContextManagedGroup({
        groups: taskGroups,
        patientId: criteria.patientId,
        episodeId: criteria.episodeId,
        colloqiumAgendaId: effectiveColloqiumAgendaId,
        tplPhaseId: criteria.tplPhaseId,
        taskGroupsTasks: tasksByGroup,
      });
      if (taskGroup && taskGroup.colloqium_agenda_id == null && effectiveColloqiumAgendaId != null) {
        try {
          taskGroup = await api.updateTaskGroup(taskGroup.id, { colloqium_agenda_id: effectiveColloqiumAgendaId });
        } catch {
          const resolvedAgendaId = await resolveCurrentColloqiumAgendaId();
          if (resolvedAgendaId != null) {
            taskGroup = await api.updateTaskGroup(taskGroup.id, { colloqium_agenda_id: resolvedAgendaId });
          }
        }
      }
      if (!taskGroup) {
        const initialAgendaId = effectiveColloqiumAgendaId;
        try {
          taskGroup = await tryCreateContextGroup(initialAgendaId);
        } catch (err) {
          const isAgendaLinkError =
            apiErrorHasDetail(err, 'colloqium_agenda_id references unknown COLLOQIUM_AGENDA')
            || apiErrorHasDetail(err, 'episode_id must match COLLOQIUM_AGENDA.episode_id');
          if (!isAgendaLinkError) throw err;
          const resolvedAgendaId = await resolveCurrentColloqiumAgendaId();
          taskGroup = await tryCreateContextGroup(resolvedAgendaId);
        }
      }
      setPreferredTopGroupId(taskGroup.id);
      const createPayload = (groupId: number, description: string): TaskCreate => ({
        task_group_id: groupId,
        description,
        kind_key: 'TASK',
        until: nowLocalDateTimeIso(),
        comment: '',
      });
      let createdTask: Task;
      try {
        createdTask = await api.createTask(createPayload(taskGroup.id, buildDefaultTaskDescription(taskGroup)));
      } catch (err) {
        const isClosedGroupError = apiErrorHasDetail(err, 'completed/discarded task group');
        if (!isClosedGroupError) throw err;
        let replacementGroup: TaskGroup;
        try {
          replacementGroup = await tryCreateContextGroup(effectiveColloqiumAgendaId);
        } catch (retryErr) {
          const isAgendaLinkError =
            apiErrorHasDetail(retryErr, 'colloqium_agenda_id references unknown COLLOQIUM_AGENDA')
            || apiErrorHasDetail(retryErr, 'episode_id must match COLLOQIUM_AGENDA.episode_id');
          if (!isAgendaLinkError) throw retryErr;
          const resolvedAgendaId = await resolveCurrentColloqiumAgendaId();
          replacementGroup = await tryCreateContextGroup(resolvedAgendaId);
        }
        setPreferredTopGroupId(replacementGroup.id);
        createdTask = await api.createTask(createPayload(replacementGroup.id, buildDefaultTaskDescription(replacementGroup)));
      }
      actionStateModel.setActionState(null);
      actionStateModel.setActionComment('');
      groupStateModel.setCreatingGroupId(null);
      groupStateModel.setCreateForm(null);
      setAutoCreatedTaskId(source === 'auto' ? createdTask.id : null);
      editStateModel.setEditingTaskId(createdTask.id);
      editStateModel.setEditForm({
        description: createdTask.description ?? '',
        kind_key: createdTask.kind_key ?? 'TASK',
        priority_id: createdTask.priority_id ?? null,
        assigned_to_id: createdTask.assigned_to_id ?? null,
        until: createdTask.until ?? '',
        comment: createdTask.comment ?? '',
      });
      reload();
      onAddClick();
    } finally {
      setPanelAddSaving(false);
    }
  };

  const handleCancelEditTask = async () => {
    if (editStateModel.editingTaskId == null) {
      cancelEditTask();
      return;
    }
    if (autoCreatedTaskId !== editStateModel.editingTaskId) {
      cancelEditTask();
      return;
    }
    try {
      const cancelled = taskStatusByKey.CANCELLED;
      if (cancelled) {
        await api.updateTask(editStateModel.editingTaskId, { status_id: cancelled.id, comment: '' });
      }
      setAutoCreatedTaskId(null);
      cancelEditTask();
      reload();
      onAutoCreateDiscarded?.();
    } catch {
      cancelEditTask();
    }
  };

  useEffect(() => {
    if (autoCreateToken === undefined || autoCreateToken === null) {
      prevAutoCreateTokenRef.current = autoCreateToken;
      return;
    }
    if (prevAutoCreateTokenRef.current === autoCreateToken) return;
    prevAutoCreateTokenRef.current = autoCreateToken;
    void createTaskFromPanelContext('auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCreateToken]);

  const saveEditTask = async (taskId: number) => {
    if (!editStateModel.editForm) return;
    editStateModel.setEditSaving(true);
    try {
      const payload: TaskUpdate = {
        description: editStateModel.editForm.description,
        kind_key: editStateModel.editForm.kind_key,
        priority_id: editStateModel.editForm.priority_id,
        assigned_to_id: editStateModel.editForm.assigned_to_id,
        until: editStateModel.editForm.until,
        comment: editStateModel.editForm.comment,
      };
      await api.updateTask(taskId, payload);
      if (autoCreatedTaskId === taskId) {
        setAutoCreatedTaskId(null);
        onAutoCreateSaved?.();
      }
      cancelEditTask();
      reload();
    } finally {
      editStateModel.setEditSaving(false);
    }
  };

  const rows = useMemo<TaskBoardRow[]>(() => {
    const groupsSorted = [...taskGroups].sort((a, b) => {
      if (preferredTopGroupId != null) {
        if (a.id === preferredTopGroupId) return -1;
        if (b.id === preferredTopGroupId) return 1;
      }
      return a.id - b.id;
    });
    const nextRows: TaskBoardRow[] = [];

    groupsSorted.forEach((group) => {
      const episode = group.episode_id ? episodesById[group.episode_id] : undefined;
      if (filters.organFilterId !== 'ALL' && episode?.organ_id !== filters.organFilterId) return;
      const groupState = computeGroupState(tasksByGroup[group.id] ?? []);

      const filteredTasks = sortTasks(tasksByGroup[group.id] ?? []).filter((task) => {
        if (!filters.showDoneTasks && isDoneTask(task)) return false;
        if (!filters.showCancelledTasks && isCancelledTask(task)) return false;
        if (filters.assignedToFilterId !== 'ALL' && task.assigned_to_id !== filters.assignedToFilterId) return false;
        if (filters.dueBefore) {
          if (!task.until) return false;
          if (new Date(task.until).getTime() > new Date(filters.dueBefore).getTime()) return false;
        }
        return true;
      });

      if (filteredTasks.length === 0) return;
      if (filters.showGroupHeadings) nextRows.push({ type: 'group', group, state: groupState });
      filteredTasks.forEach((task) => nextRows.push({ type: 'task', group, task }));
    });

    return nextRows;
  }, [
    taskGroups,
    tasksByGroup,
    episodesById,
    filters.organFilterId,
    filters.assignedToFilterId,
    filters.dueBefore,
    filters.showDoneTasks,
    filters.showCancelledTasks,
    filters.showGroupHeadings,
    preferredTopGroupId,
  ]);

  return (
    <section className="ui-panel-section task-board-section">
      <div className="ui-panel-heading">
        <div className="task-board-heading-main">
          <h2>{title}</h2>
          {headerMeta && <div className="task-board-header-meta">{headerMeta}</div>}
        </div>
        <button
          className="ci-add-btn"
          onClick={() => {
            void createTaskFromPanelContext('manual');
          }}
          disabled={panelAddSaving || !criteria.patientId}
          title={criteria.patientId ? 'Add task from current context' : 'Select a patient to add a task'}
          aria-label="Add task from current context"
        >
          {panelAddSaving ? '…' : '+ Add'}
        </button>
      </div>

      {!hideFilters && (
        <TaskBoardFilters
          organFilterId={filters.organFilterId}
          setOrganFilterId={filters.setOrganFilterId}
          assignedToFilterId={filters.assignedToFilterId}
          setAssignedToFilterId={filters.setAssignedToFilterId}
          dueBefore={filters.dueBefore}
          setDueBefore={filters.setDueBefore}
          showDoneTasks={filters.showDoneTasks}
          setShowDoneTasks={filters.setShowDoneTasks}
          showCancelledTasks={filters.showCancelledTasks}
          setShowCancelledTasks={filters.setShowCancelledTasks}
          showGroupHeadings={filters.showGroupHeadings}
          setShowGroupHeadings={filters.setShowGroupHeadings}
          organOptions={organOptions}
          assignedToOptions={assignedToOptions}
        />
      )}

      {loading && <p className="status">Loading tasks...</p>}
      {!loading && error && <ErrorBanner message={error} />}
      {!loading && !error && (
        <TaskBoardTable
          rows={rows}
          patientsById={patientsById}
          episodesById={episodesById}
          priorityCodes={priorityCodes}
          allUserOptions={allUserOptions}
          editingTaskId={editStateModel.editingTaskId}
          editForm={editStateModel.editForm}
          setEditForm={editStateModel.setEditForm}
          editSaving={editStateModel.editSaving}
          onSaveEdit={saveEditTask}
          onCancelEdit={() => {
            void handleCancelEditTask();
          }}
          onStartComplete={(task) => startTaskAction(task, 'complete')}
          onStartDiscard={(task) => startTaskAction(task, 'discard')}
          onStartEdit={startEditTask}
          actionState={actionStateModel.actionState}
          actionComment={actionStateModel.actionComment}
          setActionComment={actionStateModel.setActionComment}
          actionSaving={actionStateModel.actionSaving}
          onConfirmAction={applyTaskAction}
          onCancelAction={() => {
            actionStateModel.setActionState(null);
            actionStateModel.setActionComment('');
          }}
          editingGroupId={groupStateModel.editingGroupId}
          groupEditForm={groupStateModel.groupEditForm}
          setGroupEditForm={groupStateModel.setGroupEditForm}
          groupEditSaving={groupStateModel.groupEditSaving}
          onStartEditGroup={startEditGroup}
          onSaveEditGroup={saveEditGroup}
          onCancelEditGroup={cancelEditGroup}
          creatingGroupId={groupStateModel.creatingGroupId}
          createForm={groupStateModel.createForm}
          setCreateForm={groupStateModel.setCreateForm}
          createSaving={groupStateModel.createSaving}
          onStartCreateTask={startCreateTask}
          onSaveCreateTask={saveCreateTask}
          onCancelCreateTask={cancelCreateTask}
          maxTableHeight={maxTableHeight}
        />
      )}
    </section>
  );
}
