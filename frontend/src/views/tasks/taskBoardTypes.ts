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
  priority_id: number | null;
  assigned_to_id: number | null;
  until: string;
  comment: string;
}

export interface TaskCreateFormState {
  description: string;
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
