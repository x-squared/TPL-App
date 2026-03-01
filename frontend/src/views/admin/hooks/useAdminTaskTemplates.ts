import { useEffect, useState } from 'react';

import { api, type Code, type TaskGroupTemplate, type TaskTemplate, type TaskTemplateCreate, type TaskTemplateUpdate } from '../../../api';
import { toUserErrorMessage } from '../../../api/error';

interface TaskTemplateOffsetParts {
  days: number;
  hours: number;
  minutes: number;
}

export function splitOffsetMinutes(totalMinutes: number | null | undefined): TaskTemplateOffsetParts {
  const safeTotal = Number.isFinite(totalMinutes ?? NaN) ? Number(totalMinutes) : 0;
  const sign = safeTotal < 0 ? -1 : 1;
  const abs = Math.abs(safeTotal);
  const days = Math.floor(abs / 1440);
  const hours = Math.floor((abs % 1440) / 60);
  const minutes = abs % 60;
  return {
    days: sign * days,
    hours: sign * hours,
    minutes: sign * minutes,
  };
}

export function combineOffsetMinutes(parts: TaskTemplateOffsetParts): number {
  return (parts.days * 1440) + (parts.hours * 60) + parts.minutes;
}

export function useAdminTaskTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [groupTemplates, setGroupTemplates] = useState<TaskGroupTemplate[]>([]);
  const [priorityCodes, setPriorityCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [templateRows, groupTemplateRows, priorityRows] = await Promise.all([
        api.listTaskTemplates(),
        api.listTaskGroupTemplates(),
        api.listCodes('PRIORITY'),
      ]);
      setTemplates(templateRows);
      setGroupTemplates(groupTemplateRows);
      setPriorityCodes(priorityRows);
    } catch (err) {
      setError(toUserErrorMessage(err, 'Could not load task templates.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createTemplate = async (payload: TaskTemplateCreate) => {
    setSaving(true);
    setError('');
    try {
      await api.createTaskTemplate(payload);
      await load();
    } catch (err) {
      setError(toUserErrorMessage(err, 'Could not create task template.'));
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = async (taskTemplateId: number, payload: TaskTemplateUpdate) => {
    setSaving(true);
    setError('');
    try {
      await api.updateTaskTemplate(taskTemplateId, payload);
      await load();
    } catch (err) {
      setError(toUserErrorMessage(err, 'Could not update task template.'));
    } finally {
      setSaving(false);
    }
  };

  return {
    templates,
    groupTemplates,
    priorityCodes,
    loading,
    saving,
    error,
    createTemplate,
    updateTemplate,
    refresh: load,
  };
}
