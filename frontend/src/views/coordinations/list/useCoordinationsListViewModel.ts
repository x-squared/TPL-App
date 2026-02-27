import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type Code, type Coordination, type CoordinationCreate, type CoordinationDonor } from '../../../api';
import { toUserErrorMessage } from '../../../api/error';

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

type CoordinationCreateForm = CoordinationCreate & {
  donor_full_name?: string;
  donor_birth_date?: string | null;
  donor_death_kind_id?: number | null;
};

const emptyCreateFormWithDonor: CoordinationCreateForm = {
  ...emptyCreateForm,
  donor_full_name: '',
  donor_birth_date: null,
  donor_death_kind_id: null,
};

export function useCoordinationsListViewModel() {
  const [rows, setRows] = useState<CoordinationListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState<CoordinationCreateForm>(emptyCreateFormWithDonor);
  const [deathKindCodes, setDeathKindCodes] = useState<Code[]>([]);

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
      setLoadError(toUserErrorMessage(err, 'Failed to load coordinations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
    api.listCodes('DEATH_KIND').then(setDeathKindCodes);
  }, [loadRows]);

  const handleCreate = useCallback(async (): Promise<number | null> => {
    const donorFullName = form.donor_full_name?.trim() ?? '';
    if (!donorFullName) {
      setCreateError('Donor name is required.');
      return null;
    }
    try {
      setCreateError('');
      setCreating(true);
      const created = await api.createCoordination({
        start: form.start ?? null,
        end: form.end ?? null,
        donor_nr: form.donor_nr?.trim() ?? '',
        swtpl_nr: form.swtpl_nr?.trim() ?? '',
        national_coordinator: form.national_coordinator?.trim() ?? '',
        comment: form.comment?.trim() ?? '',
      });
      await api.upsertCoordinationDonor(created.id, {
        full_name: donorFullName,
        birth_date: form.donor_birth_date || null,
        death_kind_id: form.donor_death_kind_id ?? null,
      });
      setAdding(false);
      setForm(emptyCreateFormWithDonor);
      await loadRows();
      return created.id;
    } catch (err) {
      setCreateError(toUserErrorMessage(err, 'Failed to create coordination'));
      return null;
    } finally {
      setCreating(false);
    }
  }, [form, loadRows]);

  const setFormDate = (value: string) => {
    setForm((prev) => ({ ...prev, start: value || null }));
  };

  const setDonorBirthDate = (value: string) => {
    setForm((prev) => ({ ...prev, donor_birth_date: value || null }));
  };

  const setDonorDeathKind = (value: string) => {
    setForm((prev) => ({ ...prev, donor_death_kind_id: value ? Number(value) : null }));
  };

  const setDonorFullName = (value: string) => {
    setForm((prev) => ({ ...prev, donor_full_name: value }));
  };

  const setFormField = (
    key: 'donor_nr' | 'swtpl_nr' | 'national_coordinator' | 'comment',
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const startDateInput = form.start ? form.start.slice(0, 10) : '';
  const donorBirthDateInput = form.donor_birth_date ? form.donor_birth_date.slice(0, 10) : '';
  const resetCreate = () => {
    setAdding(false);
    setCreateError('');
    setForm({ ...emptyCreateFormWithDonor, start: todayIsoDate() });
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
    deathKindCodes,
    startDateInput,
    donorFullName: form.donor_full_name ?? '',
    donorBirthDateInput,
    form,
    setFormDate,
    setDonorFullName,
    setDonorBirthDate,
    setDonorDeathKind,
    setFormField,
    resetCreate,
  };
}
