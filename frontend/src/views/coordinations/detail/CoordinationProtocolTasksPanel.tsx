import { useEffect, useMemo, useState } from 'react';

import { api, type Task, type TaskGroup } from '../../../api';
import { toUserErrorMessage } from '../../../api/error';

interface CoordinationProtocolTasksPanelProps {
  coordinationId: number;
  organId: number;
}

export default function CoordinationProtocolTasksPanel({ coordinationId, organId }: CoordinationProtocolTasksPanelProps) {
  const [groupRows, setGroupRows] = useState<TaskGroup[]>([]);
  const [tasksByGroupId, setTasksByGroupId] = useState<Record<number, Task[]>>({});
  const [statusCodeByKey, setStatusCodeByKey] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const [groups, statusCodes] = await Promise.all([
        api.listTaskGroups({ coordination_id: coordinationId, organ_id: organId }),
        api.listCodes('TASK_STATUS'),
      ]);
      const sortedGroups = [...groups].sort((a, b) => a.id - b.id);
      setGroupRows(sortedGroups);
      const statusByKey = Object.fromEntries(statusCodes.map((entry) => [entry.key, entry.id]));
      setStatusCodeByKey(statusByKey);

      const tasksByGroupEntries = await Promise.all(
        sortedGroups.map(async (group) => [group.id, await api.listTasks({ task_group_id: group.id })] as const),
      );
      const grouped: Record<number, Task[]> = {};
      for (const [groupId, tasks] of tasksByGroupEntries) {
        grouped[groupId] = [...tasks].sort((a, b) => {
          return a.id - b.id;
        });
      }
      setTasksByGroupId(grouped);
    } catch (err) {
      setError(toUserErrorMessage(err, 'Failed to load protocol tasks.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [coordinationId, organId]);

  const allTasks = useMemo(
    () => groupRows.flatMap((group) => tasksByGroupId[group.id] ?? []),
    [groupRows, tasksByGroupId],
  );

  const closeTask = async (task: Task, mode: 'COMPLETE' | 'DROP') => {
    const statusKey = mode === 'COMPLETE' ? 'COMPLETED' : 'CANCELLED';
    const statusId = statusCodeByKey[statusKey];
    if (!statusId) return;
    const promptTitle = mode === 'COMPLETE'
      ? (task.kind_key === 'EVENT' ? 'Comment for event registration (optional):' : 'Comment for task completion (optional):')
      : 'Comment for dropped task (optional):';
    const commentInput = window.prompt(promptTitle, task.comment ?? '');
    if (commentInput === null) return;
    try {
      await api.updateTask(task.id, {
        status_id: statusId,
        comment: commentInput.trim(),
      });
      await reload();
    } catch (err) {
      setError(toUserErrorMessage(err, 'Failed to update protocol task.'));
    }
  };

  if (loading) {
    return (
      <section className="coord-protocol-pane">
        <p className="status">Loading protocol tasks...</p>
      </section>
    );
  }

  return (
    <section className="coord-protocol-pane">
      {error ? <p className="status">{error}</p> : null}
      {allTasks.length === 0 ? (
        <p className="detail-empty">No protocol tasks for this organ.</p>
      ) : (
        <div className="coord-protocol-task-groups">
          {groupRows.map((group) => (
            <div key={group.id} className="coord-protocol-task-group">
              <div className="coord-protocol-task-group-title">{group.name}</div>
              <ul className="coord-protocol-compact-list">
                {(tasksByGroupId[group.id] ?? []).map((task) => {
                  const isClosed = task.status?.key === 'COMPLETED' || task.status?.key === 'CANCELLED' || task.closed;
                  return (
                    <li key={task.id} className="coord-protocol-task-item">
                      <span className="coord-protocol-task-text">{task.description}</span>
                      <span className="coord-protocol-task-status">{task.status?.name_default ?? task.status?.key ?? 'Pending'}</span>
                      {!isClosed ? (
                        <span className="coord-protocol-task-actions">
                          <button
                            type="button"
                            className="save-btn"
                            onClick={() => { void closeTask(task, 'COMPLETE'); }}
                          >
                            {task.kind_key === 'EVENT' ? 'Register' : 'Complete'}
                          </button>
                          <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => { void closeTask(task, 'DROP'); }}
                          >
                            Drop
                          </button>
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
