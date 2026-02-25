import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type Coordination, type CoordinationCreate, type CoordinationDonor } from '../../../api';

export interface CoordinationListRow {
  coordination: Coordination;
  donor: CoordinationDonor | null;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const emptyCreateForm: CoordinationCreate = {
  start: todayIsoDate(),
  end: null,
  donor_nr: '',
  swtpl_nr: '',
  national_coordinator: '',
  comment: '',
};

export function useCoordinationsListViewModel() {
  const [rows, setRows] = useState<CoordinationListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState<CoordinationCreate>(emptyCreateForm);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const coordinations = await api.listCoordinations();
      const donorEntries = await Promise.all(
        coordinations.map(async (coordination) => {
          try {
            const donor = await api.getCoordinationDonor(coordination.id);
            return { coordination, donor } as CoordinationListRow;
          } catch {
            return { coordination, donor: null } as CoordinationListRow;
          }
        }),
      );
      setRows(donorEntries);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load coordinations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const handleCreate = useCallback(async () => {
    try {
      setCreateError('');
      setCreating(true);
      await api.createCoordination({
        start: form.start ?? null,
        end: form.end ?? null,
        donor_nr: form.donor_nr?.trim() ?? '',
        swtpl_nr: form.swtpl_nr?.trim() ?? '',
        national_coordinator: form.national_coordinator?.trim() ?? '',
        comment: form.comment?.trim() ?? '',
      });
      setAdding(false);
      setForm(emptyCreateForm);
      await loadRows();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create coordination');
    } finally {
      setCreating(false);
    }
  }, [form, loadRows]);

  const setFormDate = (value: string) => {
    setForm((prev) => ({ ...prev, start: value || null }));
  };

  const setFormField = (
    key: 'donor_nr' | 'swtpl_nr' | 'national_coordinator' | 'comment',
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const startDateInput = form.start ? form.start.slice(0, 10) : '';
  const resetCreate = () => {
    setAdding(false);
    setCreateError('');
    setForm({ ...emptyCreateForm, start: todayIsoDate() });
  };

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const aDate = a.coordination.start ?? '';
        const bDate = b.coordination.start ?? '';
        return bDate.localeCompare(aDate);
      }),
    [rows],
  );

  return {
    loading,
    loadError,
    rows: sortedRows,
    adding,
    setAdding,
    creating,
    createError,
    handleCreate,
    startDateInput,
    form,
    setFormDate,
    setFormField,
    resetCreate,
  };
}
