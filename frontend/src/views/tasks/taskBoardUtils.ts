import type { Task } from '../../api';
import type {
  TaskBoardRow,
  TaskGroupState,
  TaskReferenceContext,
  TaskReferenceRenderer,
  TaskReferenceSegment,
} from './taskBoardTypes';

const defaultReferenceRenderers: TaskReferenceRenderer[] = [
  {
    id: 'patient',
    buildSegment: ({ group }) => ({
      key: `patient-${group.patient_id}`,
      label: `P#${group.patient_id}`,
    }),
  },
  {
    id: 'episode',
    buildSegment: ({ group, episode }) => {
      if (!group.episode_id) return null;
      const organ = episode?.organ?.name_default ? ` (${episode.organ.name_default})` : '';
      return {
        key: `episode-${group.episode_id}`,
        label: `E#${group.episode_id}${organ}`,
      };
    },
  },
  {
    id: 'phase',
    buildSegment: ({ group }) => {
      if (!group.tpl_phase) return null;
      return {
        key: `phase-${group.tpl_phase.id}`,
        label: `Phase: ${group.tpl_phase.name_default}`,
      };
    },
  },
];

export function buildTaskReferences(
  context: TaskReferenceContext,
  renderers: TaskReferenceRenderer[] = defaultReferenceRenderers,
): TaskReferenceSegment[] {
  return renderers
    .map((renderer) => renderer.buildSegment(context))
    .filter((segment): segment is TaskReferenceSegment => segment !== null);
}

export function isDoneTask(task: Task): boolean {
  return task.status?.key === 'COMPLETED';
}

export function isCancelledTask(task: Task): boolean {
  return task.status?.key === 'CANCELLED';
}

function isOverdue(task: Task): boolean {
  if (!task.until) return false;
  const due = new Date(task.until);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export function isUrgentTask(task: Task): boolean {
  if (isDoneTask(task) || isCancelledTask(task)) return false;
  return task.priority?.key === 'HIGH' || isOverdue(task);
}

export function formatDate(iso: string | null): string {
  if (!iso) return '–';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '–';
  return date.toLocaleDateString('de-CH');
}

function dueDateValue(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime();
}

function priorityRank(task: Task): number {
  if (task.priority?.key === 'HIGH') return 0;
  if (task.priority?.key === 'NORMAL') return 1;
  if (task.priority?.key === 'LOW') return 2;
  return 3;
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const urgentCmp = Number(isUrgentTask(b)) - Number(isUrgentTask(a));
    if (urgentCmp !== 0) return urgentCmp;

    if (isUrgentTask(a) && isUrgentTask(b)) {
      const prCmp = priorityRank(a) - priorityRank(b);
      if (prCmp !== 0) return prCmp;
    }

    const dueCmp = dueDateValue(a.until) - dueDateValue(b.until);
    if (dueCmp !== 0) return dueCmp;

    return a.id - b.id;
  });
}

export function statusIndicator(task: Task): string {
  if (isCancelledTask(task)) return '—';
  if (isDoneTask(task)) return '✓';
  if (isUrgentTask(task)) return '⚠';
  return '●';
}

export function computeGroupState(tasks: Task[]): TaskGroupState {
  if (tasks.length === 0) return 'NONE';

  const hasUrgentOpen = tasks.some((task) => isUrgentTask(task));
  if (hasUrgentOpen) return 'HIGH_OPEN';

  const hasPending = tasks.some((task) => !isDoneTask(task) && !isCancelledTask(task));
  if (hasPending) return 'PENDING';

  const allDiscarded = tasks.every((task) => isCancelledTask(task));
  if (allDiscarded) return 'DISCARDED';

  const allClosed = tasks.every((task) => isDoneTask(task) || isCancelledTask(task));
  const hasCompleted = tasks.some((task) => isDoneTask(task));
  if (allClosed && hasCompleted) return 'COMPLETED';

  return 'NONE';
}

export function groupStateIndicator(state: TaskGroupState): string {
  if (state === 'HIGH_OPEN') return '⚠';
  if (state === 'PENDING') return '●';
  if (state === 'COMPLETED') return '✓';
  if (state === 'DISCARDED') return '—';
  return '–';
}

export function boardStateSymbol(rows: TaskBoardRow[]): string {
  const state = computeGroupState(
    rows
      .filter((row): row is Extract<TaskBoardRow, { type: 'task' }> => row.type === 'task')
      .map((row) => row.task),
  );
  return groupStateIndicator(state);
}
