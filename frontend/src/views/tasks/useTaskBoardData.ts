import { useCallback, useEffect, useState } from 'react';
import { api, type Code, type Episode, type Task, type TaskGroup } from '../../api';
import type { TaskBoardCriteria } from './taskBoardTypes';

interface TaskBoardDataState {
  loading: boolean;
  error: string;
  taskGroups: TaskGroup[];
  tasksByGroup: Record<number, Task[]>;
  episodesById: Record<number, Episode>;
  organCodes: Code[];
  priorityCodes: Code[];
  taskStatusByKey: Record<string, Code>;
  allUsers: Record<number, string>;
}

const initialState: TaskBoardDataState = {
  loading: true,
  error: '',
  taskGroups: [],
  tasksByGroup: {},
  episodesById: {},
  organCodes: [],
  priorityCodes: [],
  taskStatusByKey: {},
  allUsers: {},
};

export default function useTaskBoardData(criteria: TaskBoardCriteria, statusKeysToLoad: string[]) {
  const [state, setState] = useState<TaskBoardDataState>(initialState);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setState((prev) => ({ ...prev, loading: true, error: '' }));
      try {
        const groupParams = {
          patient_id: criteria.patientId,
          episode_id: criteria.episodeId ?? undefined,
        };
        const groups = await api.listTaskGroups(groupParams);
        const [users, organs, priorities, taskStatuses] = await Promise.all([
          api.listUsers(),
          api.listCodes('ORGAN'),
          api.listCodes('PRIORITY'),
          api.listCodes('TASK_STATUS'),
        ]);

        const groupsWithPhase = criteria.tplPhaseId == null
          ? groups
          : groups.filter((group) => group.tpl_phase_id === criteria.tplPhaseId);
        const groupsWithContext = (() => {
          if (criteria.colloqiumAgendaId == null) return groupsWithPhase;
          const exact = groupsWithPhase.filter((group) => group.colloqium_agenda_id === criteria.colloqiumAgendaId);
          if (exact.length > 0) return exact;
          // Legacy fallback: tasks created before proper colloquium agenda linking.
          return groupsWithPhase.filter((group) =>
            group.colloqium_agenda_id == null && group.task_group_template_id == null);
        })();

        const patientIds = [...new Set(groupsWithContext.map((group) => group.patient_id))];
        const patientDetails = await Promise.all(patientIds.map((id) => api.getPatient(id)));

        const tasksPerGroup = await Promise.all(
          groupsWithContext.map(async (group) => ({
            groupId: group.id,
            tasks: await api.listTasks({
              task_group_id: group.id,
              status_key: statusKeysToLoad,
            }),
          })),
        );

        if (cancelled) return;

        const nextTasksByGroup: Record<number, Task[]> = {};
        tasksPerGroup.forEach(({ groupId, tasks }) => {
          nextTasksByGroup[groupId] = tasks;
        });

        const nextEpisodesById: Record<number, Episode> = {};
        patientDetails.forEach((patient) => {
          (patient.episodes ?? []).forEach((ep) => {
            nextEpisodesById[ep.id] = ep;
          });
        });

        const nextUsers: Record<number, string> = {};
        users.forEach((user) => {
          nextUsers[user.id] = user.name;
        });

        const nextTaskStatusByKey: Record<string, Code> = {};
        taskStatuses.forEach((status) => {
          nextTaskStatusByKey[status.key] = status;
        });

        setState({
          loading: false,
          error: '',
          taskGroups: groupsWithContext,
          tasksByGroup: nextTasksByGroup,
          episodesById: nextEpisodesById,
          organCodes: organs,
          priorityCodes: priorities,
          taskStatusByKey: nextTaskStatusByKey,
          allUsers: nextUsers,
        });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Could not load tasks.',
        }));
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [criteria.patientId, criteria.episodeId, criteria.colloqiumAgendaId, criteria.tplPhaseId, statusKeysToLoad, reloadToken]);

  return {
    ...state,
    reload,
  };
}
