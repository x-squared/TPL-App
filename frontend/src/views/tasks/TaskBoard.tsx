import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type Task, type TaskCreate, type TaskGroup, type TaskUpdate } from '../../api';
import '../layout/PanelLayout.css';
import './TaskBoard.css';
import TaskBoardFilters from './TaskBoardFilters';
import TaskBoardTable from './TaskBoardTable';
import { computeGroupState, isCancelledTask, isDoneTask, sortTasks } from './taskBoardUtils';
import type {
  TaskActionState,
  TaskBoardProps,
  TaskBoardRow,
  TaskCreateFormState,
  TaskGroupEditFormState,
  TaskEditFormState,
} from './taskBoardTypes';
import useTaskBoardData from './useTaskBoardData';

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  const [effectiveColloqiumAgendaId, setEffectiveColloqiumAgendaId] = useState<number | null>(
    criteria.colloqiumAgendaId ?? null,
  );
  const [organFilterId, setOrganFilterId] = useState<number | 'ALL'>('ALL');
  const [assignedToFilterId, setAssignedToFilterId] = useState<number | 'ALL'>('ALL');
  const [dueBefore, setDueBefore] = useState('');
  const [showDoneTasks, setShowDoneTasks] = useState(includeClosedTasks);
  const [showCancelledTasks, setShowCancelledTasks] = useState(includeClosedTasks);
  const [showGroupHeadings, setShowGroupHeadings] = useState(showGroupHeadingsDefault);
  const [actionState, setActionState] = useState<TaskActionState | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [actionSaving, setActionSaving] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TaskEditFormState | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [groupEditForm, setGroupEditForm] = useState<TaskGroupEditFormState | null>(null);
  const [groupEditSaving, setGroupEditSaving] = useState(false);
  const [creatingGroupId, setCreatingGroupId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<TaskCreateFormState | null>(null);
  const [createSaving, setCreateSaving] = useState(false);
  const [panelAddSaving, setPanelAddSaving] = useState(false);
  const [preferredTopGroupId, setPreferredTopGroupId] = useState<number | null>(null);
  const [autoCreatedTaskId, setAutoCreatedTaskId] = useState<number | null>(null);
  const prevAutoCreateTokenRef = useRef<number | undefined>(autoCreateToken);

  useEffect(() => {
    setEffectiveColloqiumAgendaId(criteria.colloqiumAgendaId ?? null);
  }, [criteria.colloqiumAgendaId, criteria.episodeId, criteria.colloqiumId, criteria.patientId]);

  const isGroupClosed = (taskGroup: TaskGroup): boolean => {
    const state = computeGroupState(tasksByGroup[taskGroup.id] ?? []);
    return state === 'COMPLETED' || state === 'DISCARDED';
  };

  useEffect(() => {
    setPreferredTopGroupId(null);
  }, [criteria.patientId, criteria.episodeId, effectiveColloqiumAgendaId, criteria.tplPhaseId]);

  const statusKeysToLoad = useMemo(() => {
    if (includeClosedTasks) return ['PENDING', 'COMPLETED', 'CANCELLED'];
    const keys = ['PENDING'];
    if (showDoneTasks) keys.push('COMPLETED');
    if (showCancelledTasks) keys.push('CANCELLED');
    return keys;
  }, [includeClosedTasks, showDoneTasks, showCancelledTasks]);

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
    setEditingGroupId(null);
    setGroupEditForm(null);
    setCreatingGroupId(null);
    setCreateForm(null);
    setEditingTaskId(null);
    setEditForm(null);
    setActionState({ task, type });
    setActionComment(task.comment ?? '');
  };

  const applyTaskAction = async () => {
    if (!actionState) return;
    const statusKey = actionState.type === 'complete' ? 'COMPLETED' : 'CANCELLED';
    const statusCode = taskStatusByKey[statusKey];
    if (!statusCode) return;
    const nextComment = actionComment.trim();
    if (actionState.type === 'discard' && !nextComment) return;

    setActionSaving(true);
    try {
      const payload: TaskUpdate = {
        status_id: statusCode.id,
        comment: nextComment || '',
      };
      await api.updateTask(actionState.task.id, payload);
      setActionState(null);
      setActionComment('');
      reload();
    } finally {
      setActionSaving(false);
    }
  };

  const startEditTask = (task: Task) => {
    setEditingGroupId(null);
    setGroupEditForm(null);
    setCreatingGroupId(null);
    setCreateForm(null);
    setActionState(null);
    setActionComment('');
    setEditingTaskId(task.id);
    setEditForm({
      description: task.description ?? '',
      priority_id: task.priority_id ?? null,
      assigned_to_id: task.assigned_to_id ?? null,
      until: task.until ?? '',
      comment: task.comment ?? '',
    });
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditForm(null);
  };

  const startCreateTask = (taskGroupId: number) => {
    setEditingGroupId(null);
    setGroupEditForm(null);
    setActionState(null);
    setActionComment('');
    setEditingTaskId(null);
    setEditForm(null);
    setCreatingGroupId(taskGroupId);
    setCreateForm({
      description: '',
      priority_id: null,
      assigned_to_id: null,
      until: todayIso(),
      comment: '',
    });
  };

  const cancelCreateTask = () => {
    setCreatingGroupId(null);
    setCreateForm(null);
  };

  const startEditGroup = (group: TaskGroup) => {
    setActionState(null);
    setActionComment('');
    setEditingTaskId(null);
    setEditForm(null);
    setCreatingGroupId(null);
    setCreateForm(null);
    setEditingGroupId(group.id);
    setGroupEditForm({
      name: group.name ?? '',
    });
  };

  const cancelEditGroup = () => {
    setEditingGroupId(null);
    setGroupEditForm(null);
  };

  const saveEditGroup = async (groupId: number) => {
    if (!groupEditForm) return;
    const nextName = groupEditForm.name.trim();
    if (!nextName) return;
    setGroupEditSaving(true);
    try {
      await api.updateTaskGroup(groupId, {
        name: nextName,
      });
      cancelEditGroup();
      reload();
    } finally {
      setGroupEditSaving(false);
    }
  };

  const saveCreateTask = async (taskGroupId: number) => {
    if (!createForm) return;
    const nextDescription = createForm.description.trim();
    if (!nextDescription) return;

    setCreateSaving(true);
    try {
      const payload: TaskCreate = {
        task_group_id: taskGroupId,
        description: nextDescription,
        priority_id: createForm.priority_id,
        assigned_to_id: createForm.assigned_to_id,
        until: createForm.until,
        comment: createForm.comment,
      };
      await api.createTask(payload);
      cancelCreateTask();
      reload();
    } finally {
      setCreateSaving(false);
    }
  };

  const findContextManagedGroup = (groups: TaskGroup[]): TaskGroup | null => {
    if (!criteria.patientId) return null;
    const contextEpisodeId = criteria.episodeId ?? null;
    const contextColloqiumAgendaId = effectiveColloqiumAgendaId;
    const contextPhaseId = contextEpisodeId != null ? (criteria.tplPhaseId ?? null) : null;
    const matches = groups.filter((group) =>
      group.patient_id === criteria.patientId
      && group.task_group_template_id === null
      && (group.episode_id ?? null) === contextEpisodeId
      && (group.tpl_phase_id ?? null) === contextPhaseId
      && !isGroupClosed(group));
    const exact = matches.filter((group) => (group.colloqium_agenda_id ?? null) === contextColloqiumAgendaId);
    const fallbackUnlinked = matches.filter((group) => group.colloqium_agenda_id == null);
    const candidates = exact.length > 0 ? exact : fallbackUnlinked;
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => a.id - b.id)[0];
  };

  const buildDefaultTaskDescription = (taskGroup: TaskGroup) => {
    const parts = [`New task for P#${taskGroup.patient_id}`];
    if (taskGroup.episode_id != null) parts.push(`E#${taskGroup.episode_id}`);
    if (taskGroup.tpl_phase?.name_default) parts.push(taskGroup.tpl_phase.name_default);
    return parts.join(' · ');
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
      let taskGroup = findContextManagedGroup(taskGroups);
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
          const message = err instanceof Error ? err.message : '';
          const isAgendaLinkError = message.includes('API 422')
            && (
              message.includes('colloqium_agenda_id references unknown COLLOQIUM_AGENDA')
              || message.includes('episode_id must match COLLOQIUM_AGENDA.episode_id')
            );
          if (!isAgendaLinkError) throw err;
          const resolvedAgendaId = await resolveCurrentColloqiumAgendaId();
          taskGroup = await tryCreateContextGroup(resolvedAgendaId);
        }
      }
      setPreferredTopGroupId(taskGroup.id);
      const createPayload = (groupId: number, description: string): TaskCreate => ({
        task_group_id: groupId,
        description,
        until: todayIso(),
        comment: '',
      });
      let createdTask: Task;
      try {
        createdTask = await api.createTask(createPayload(taskGroup.id, buildDefaultTaskDescription(taskGroup)));
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        const isClosedGroupError = message.includes('API 422')
          && message.includes('completed/discarded task group');
        if (!isClosedGroupError) throw err;
        let replacementGroup: TaskGroup;
        try {
          replacementGroup = await tryCreateContextGroup(effectiveColloqiumAgendaId);
        } catch (retryErr) {
          const retryMessage = retryErr instanceof Error ? retryErr.message : '';
          const isAgendaLinkError = retryMessage.includes('API 422')
            && (
              retryMessage.includes('colloqium_agenda_id references unknown COLLOQIUM_AGENDA')
              || retryMessage.includes('episode_id must match COLLOQIUM_AGENDA.episode_id')
            );
          if (!isAgendaLinkError) throw retryErr;
          const resolvedAgendaId = await resolveCurrentColloqiumAgendaId();
          replacementGroup = await tryCreateContextGroup(resolvedAgendaId);
        }
        setPreferredTopGroupId(replacementGroup.id);
        createdTask = await api.createTask(createPayload(replacementGroup.id, buildDefaultTaskDescription(replacementGroup)));
      }
      setActionState(null);
      setActionComment('');
      setCreatingGroupId(null);
      setCreateForm(null);
      setAutoCreatedTaskId(source === 'auto' ? createdTask.id : null);
      setEditingTaskId(createdTask.id);
      setEditForm({
        description: createdTask.description ?? '',
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
    if (editingTaskId == null) {
      cancelEditTask();
      return;
    }
    if (autoCreatedTaskId !== editingTaskId) {
      cancelEditTask();
      return;
    }
    try {
      const cancelled = taskStatusByKey.CANCELLED;
      if (cancelled) {
        await api.updateTask(editingTaskId, { status_id: cancelled.id, comment: '' });
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
    if (!editForm) return;
    setEditSaving(true);
    try {
      const payload: TaskUpdate = {
        description: editForm.description,
        priority_id: editForm.priority_id,
        assigned_to_id: editForm.assigned_to_id,
        until: editForm.until,
        comment: editForm.comment,
      };
      await api.updateTask(taskId, payload);
      if (autoCreatedTaskId === taskId) {
        setAutoCreatedTaskId(null);
        onAutoCreateSaved?.();
      }
      cancelEditTask();
      reload();
    } finally {
      setEditSaving(false);
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
      if (organFilterId !== 'ALL' && episode?.organ_id !== organFilterId) return;
      const groupState = computeGroupState(tasksByGroup[group.id] ?? []);

      const filteredTasks = sortTasks(tasksByGroup[group.id] ?? []).filter((task) => {
        if (!showDoneTasks && isDoneTask(task)) return false;
        if (!showCancelledTasks && isCancelledTask(task)) return false;
        if (assignedToFilterId !== 'ALL' && task.assigned_to_id !== assignedToFilterId) return false;
        if (dueBefore) {
          if (!task.until) return false;
          if (new Date(task.until).getTime() > new Date(dueBefore).getTime()) return false;
        }
        return true;
      });

      if (filteredTasks.length === 0) return;
      if (showGroupHeadings) nextRows.push({ type: 'group', group, state: groupState });
      filteredTasks.forEach((task) => nextRows.push({ type: 'task', group, task }));
    });

    return nextRows;
  }, [
    taskGroups,
    tasksByGroup,
    episodesById,
    organFilterId,
    assignedToFilterId,
    dueBefore,
    showDoneTasks,
    showCancelledTasks,
    showGroupHeadings,
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
          organFilterId={organFilterId}
          setOrganFilterId={setOrganFilterId}
          assignedToFilterId={assignedToFilterId}
          setAssignedToFilterId={setAssignedToFilterId}
          dueBefore={dueBefore}
          setDueBefore={setDueBefore}
          showDoneTasks={showDoneTasks}
          setShowDoneTasks={setShowDoneTasks}
          showCancelledTasks={showCancelledTasks}
          setShowCancelledTasks={setShowCancelledTasks}
          showGroupHeadings={showGroupHeadings}
          setShowGroupHeadings={setShowGroupHeadings}
          organOptions={organOptions}
          assignedToOptions={assignedToOptions}
        />
      )}

      {loading && <p className="status">Loading tasks...</p>}
      {!loading && error && <p className="status">{error}</p>}
      {!loading && !error && (
        <TaskBoardTable
          rows={rows}
          patientsById={patientsById}
          episodesById={episodesById}
          priorityCodes={priorityCodes}
          allUserOptions={allUserOptions}
          editingTaskId={editingTaskId}
          editForm={editForm}
          setEditForm={setEditForm}
          editSaving={editSaving}
          onSaveEdit={saveEditTask}
          onCancelEdit={() => {
            void handleCancelEditTask();
          }}
          onStartComplete={(task) => startTaskAction(task, 'complete')}
          onStartDiscard={(task) => startTaskAction(task, 'discard')}
          onStartEdit={startEditTask}
          actionState={actionState}
          actionComment={actionComment}
          setActionComment={setActionComment}
          actionSaving={actionSaving}
          onConfirmAction={applyTaskAction}
          onCancelAction={() => {
            setActionState(null);
            setActionComment('');
          }}
          editingGroupId={editingGroupId}
          groupEditForm={groupEditForm}
          setGroupEditForm={setGroupEditForm}
          groupEditSaving={groupEditSaving}
          onStartEditGroup={startEditGroup}
          onSaveEditGroup={saveEditGroup}
          onCancelEditGroup={cancelEditGroup}
          creatingGroupId={creatingGroupId}
          createForm={createForm}
          setCreateForm={setCreateForm}
          createSaving={createSaving}
          onStartCreateTask={startCreateTask}
          onSaveCreateTask={saveCreateTask}
          onCancelCreateTask={cancelCreateTask}
          maxTableHeight={maxTableHeight}
        />
      )}
    </section>
  );
}
