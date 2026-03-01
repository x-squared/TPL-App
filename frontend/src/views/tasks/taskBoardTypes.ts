import type { ReactNode } from 'react';
import type { Episode, Patient, Task, TaskGroup } from '../../api';

export interface TaskBoardCriteria {
  patientId?: number;
  episodeId?: number | null;
  colloqiumAgendaId?: number | null;
  colloqiumId?: number | null;
  tplPhaseId?: number | null;
  extraParams?: Record<string, string | number | boolean | null | undefined>;
}

export interface TaskBoardProps {
  criteria: TaskBoardCriteria;
  title?: string;
  onAddClick?: () => void;
  maxTableHeight?: number | string;
  headerMeta?: ReactNode;
  hideFilters?: boolean;
  showGroupHeadingsDefault?: boolean;
  includeClosedTasks?: boolean;
  autoCreateToken?: number;
  onAutoCreateSaved?: () => void;
  onAutoCreateDiscarded?: () => void;
}

export interface TaskReferenceContext {
  group: TaskGroup;
  task: Task;
  patient: Patient | undefined;
  episode: Episode | undefined;
}

export interface TaskReferenceSegment {
  key: string;
  label: string;
  kind?: 'patient' | 'episode' | 'phase' | 'other';
}

export interface TaskReferenceRenderer {
  id: string;
  buildSegment: (context: TaskReferenceContext) => TaskReferenceSegment | null;
}

export type TaskActionType = 'complete' | 'discard';

export interface TaskActionState {
  task: Task;
  type: TaskActionType;
}

export type TaskGroupState = 'HIGH_OPEN' | 'PENDING' | 'COMPLETED' | 'DISCARDED' | 'NONE';

export interface TaskEditFormState {
  description: string;
  kind_key: 'TASK' | 'EVENT';
  priority_id: number | null;
  assigned_to_id: number | null;
  until: string;
  comment: string;
}

export interface TaskCreateFormState {
  description: string;
  kind_key: 'TASK' | 'EVENT';
  priority_id: number | null;
  assigned_to_id: number | null;
  until: string;
  comment: string;
}

export interface TaskGroupEditFormState {
  name: string;
}

export type TaskBoardRow =
  | { type: 'group'; group: TaskGroup; state: TaskGroupState }
  | { type: 'task'; group: TaskGroup; task: Task };

export interface TaskBoardFilterModel {
  organFilterId: number | 'ALL';
  setOrganFilterId: (value: number | 'ALL') => void;
  assignedToFilterId: number | 'ALL';
  setAssignedToFilterId: (value: number | 'ALL') => void;
  dueBefore: string;
  setDueBefore: (value: string) => void;
  showDoneTasks: boolean;
  setShowDoneTasks: (value: boolean) => void;
  showCancelledTasks: boolean;
  setShowCancelledTasks: (value: boolean) => void;
  showGroupHeadings: boolean;
  setShowGroupHeadings: (value: boolean) => void;
}

export interface TaskBoardTableDataModel {
  rows: TaskBoardRow[];
  patientsById: Record<number, Patient>;
  episodesById: Record<number, Episode>;
}

export interface TaskBoardUsersModel {
  priorityCodes: Array<{ id: number; name_default: string }>;
  allUserOptions: Array<{ id: number; name: string }>;
}

export interface TaskBoardEditModel {
  editingTaskId: number | null;
  editForm: TaskEditFormState | null;
  setEditForm: (updater: (prev: TaskEditFormState | null) => TaskEditFormState | null) => void;
  editSaving: boolean;
  onSaveEdit: (taskId: number) => void;
  onCancelEdit: () => void;
  onStartEdit: (task: Task) => void;
}

export interface TaskBoardActionModel {
  actionState: TaskActionState | null;
  actionComment: string;
  setActionComment: (value: string) => void;
  actionSaving: boolean;
  onConfirmAction: () => void;
  onCancelAction: () => void;
  onStartComplete: (task: Task) => void;
  onStartDiscard: (task: Task) => void;
}

export interface TaskBoardGroupEditModel {
  editingGroupId: number | null;
  groupEditForm: TaskGroupEditFormState | null;
  setGroupEditForm: (updater: (prev: TaskGroupEditFormState | null) => TaskGroupEditFormState | null) => void;
  groupEditSaving: boolean;
  onStartEditGroup: (group: TaskGroup) => void;
  onSaveEditGroup: (groupId: number) => void;
  onCancelEditGroup: () => void;
}

export interface TaskBoardCreateModel {
  creatingGroupId: number | null;
  createForm: TaskCreateFormState | null;
  setCreateForm: (updater: (prev: TaskCreateFormState | null) => TaskCreateFormState | null) => void;
  createSaving: boolean;
  onStartCreateTask: (taskGroupId: number) => void;
  onSaveCreateTask: (taskGroupId: number) => void;
  onCancelCreateTask: () => void;
}
