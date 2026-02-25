import { useEffect, useMemo, useState } from 'react';
import { api, type ColloqiumAgenda, type Patient, type PatientListItem } from '../../../../api';
import { formatEpisodeDisplayName } from '../../../layout/episodeDisplay';
import type { AgendaDraft } from '../../tabs/protocol/ColloquiumProtocolTab';
import type { AgendaEditForm, EpisodeChoice, EpisodePreview, PickerRow } from '../colloquiumDetailViewModelTypes';

export function useColloquiumAgendaManager(colloqiumId: number, organId: number | null | undefined) {
  const [agendas, setAgendas] = useState<ColloqiumAgenda[]>([]);
  const [loadingAgendas, setLoadingAgendas] = useState(true);
  const [agendaDrafts, setAgendaDrafts] = useState<Record<number, AgendaDraft>>({});
  const [editingAgendaId, setEditingAgendaId] = useState<number | null>(null);
  const [agendaSaving, setAgendaSaving] = useState(false);
  const [agendaDeletingId, setAgendaDeletingId] = useState<number | null>(null);
  const [agendaForm, setAgendaForm] = useState<AgendaEditForm>({
    episode_id: null,
    episode_ids: [],
    presented_by: '',
    decision: '',
    comment: '',
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerRows, setPickerRows] = useState<PickerRow[]>([]);
  const [patientsById, setPatientsById] = useState<Record<number, PatientListItem>>({});

  useEffect(() => {
    let isActive = true;
    const loadPatients = async () => {
      const items = await api.listPatients();
      if (!isActive) return;
      const next: Record<number, PatientListItem> = {};
      items.forEach((item) => {
        next[item.id] = item;
      });
      setPatientsById(next);
    };
    void loadPatients();
    return () => {
      isActive = false;
    };
  }, [colloqiumId]);

  useEffect(() => {
    const loadAgendas = async () => {
      setLoadingAgendas(true);
      try {
        const items = await api.listColloqiumAgendas({ colloqiumId });
        setAgendas(items);
      } finally {
        setLoadingAgendas(false);
      }
    };
    void loadAgendas();
  }, [colloqiumId]);

  const reloadAgendas = async () => {
    setLoadingAgendas(true);
    try {
      const items = await api.listColloqiumAgendas({ colloqiumId });
      setAgendas(items);
    } finally {
      setLoadingAgendas(false);
    }
  };

  useEffect(() => {
    const next: Record<number, AgendaDraft> = {};
    agendas.forEach((agenda) => {
      next[agenda.id] = {
        presented_by: agenda.presented_by ?? '',
        decision: agenda.decision ?? '',
        comment: agenda.comment ?? '',
      };
    });
    setAgendaDrafts((prev) => ({ ...next, ...prev }));
  }, [agendas]);

  useEffect(() => {
    if (agendas.length === 0) return;
    const timeoutId = window.setTimeout(async () => {
      try {
        for (const agenda of agendas) {
          const draft = agendaDrafts[agenda.id];
          if (!draft) continue;
          const payload: Partial<AgendaDraft> = {};
          if (draft.presented_by !== (agenda.presented_by ?? '')) payload.presented_by = draft.presented_by;
          if (draft.decision !== (agenda.decision ?? '')) payload.decision = draft.decision;
          if (draft.comment !== (agenda.comment ?? '')) payload.comment = draft.comment;
          if (Object.keys(payload).length === 0) continue;
          const updated = await api.updateColloqiumAgenda(agenda.id, payload);
          setAgendas((prev) => prev.map((item) => (item.id === agenda.id ? { ...item, ...updated } : item)));
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('API 404')) {
          await reloadAgendas();
        }
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [agendas, agendaDrafts]);

  const episodePreviewById = useMemo(() => {
    const map: Record<number, EpisodePreview> = {};
    agendas.forEach((agenda) => {
      const episode = agenda.episode;
      if (!episode) return;
      const patient = patientsById[episode.patient_id];
      map[episode.id] = {
        episodeId: episode.id,
        patientName: patient?.name ?? '–',
        patientFirstName: patient?.first_name ?? '–',
        patientPid: patient?.pid ?? '–',
        fallNr: episode.fall_nr || `#${episode.id}`,
        organName: episode.organ?.name_default ?? '–',
        statusName: episode.status?.name_default ?? '–',
        start: episode.start,
        end: episode.end,
      };
    });
    pickerRows.forEach((row) => {
      row.episodes.forEach((episode) => {
        map[episode.episodeId] = {
          episodeId: episode.episodeId,
          patientName: episode.patientName,
          patientFirstName: episode.patientFirstName,
          patientPid: episode.patientPid,
          fallNr: episode.fallNr || `#${episode.episodeId}`,
          organName: episode.organName,
          statusName: episode.statusName,
          start: episode.start,
          end: episode.end,
        };
      });
    });
    return map;
  }, [agendas, patientsById, pickerRows]);

  const selectedEpisodePreviews = useMemo(() => {
    const ids = agendaForm.episode_ids.length > 0
      ? agendaForm.episode_ids
      : (agendaForm.episode_id ? [agendaForm.episode_id] : []);
    return ids
      .map((id) => episodePreviewById[id])
      .filter((item): item is EpisodePreview => Boolean(item));
  }, [agendaForm.episode_id, agendaForm.episode_ids, episodePreviewById]);

  const selectedEpisodeLabel = (() => {
    if (agendaForm.episode_ids.length > 1) return `${agendaForm.episode_ids.length} episodes selected`;
    if (!agendaForm.episode_id) return 'Select episode';
    const preview = episodePreviewById[agendaForm.episode_id];
    if (!preview) return `Episode #${agendaForm.episode_id}`;
    return formatEpisodeDisplayName({
      patientName: `${preview.patientFirstName} ${preview.patientName}`.trim(),
      organName: preview.organName,
      startDate: preview.start,
    });
  })();

  const pickerNonSelectableEpisodeIds = useMemo(() => {
    const currentEditedAgenda = editingAgendaId && editingAgendaId > 0
      ? agendas.find((agenda) => agenda.id === editingAgendaId)
      : null;
    const currentEditedEpisodeId = currentEditedAgenda?.episode_id ?? null;
    return agendas
      .map((agenda) => agenda.episode_id)
      .filter((episodeId) => episodeId !== currentEditedEpisodeId);
  }, [agendas, editingAgendaId]);

  const startAddAgenda = () => {
    setEditingAgendaId(0);
    setAgendaForm({ episode_id: null, episode_ids: [], presented_by: '', decision: '', comment: '' });
  };

  const startEditAgenda = (agenda: ColloqiumAgenda) => {
    setEditingAgendaId(agenda.id);
    setAgendaForm({
      episode_id: agenda.episode_id,
      episode_ids: [agenda.episode_id],
      presented_by: agenda.presented_by ?? '',
      decision: agenda.decision ?? '',
      comment: agenda.comment ?? '',
    });
  };

  const cancelEditAgenda = () => {
    setEditingAgendaId(null);
    setAgendaForm({ episode_id: null, episode_ids: [], presented_by: '', decision: '', comment: '' });
    setPickerOpen(false);
  };

  const saveAgenda = async () => {
    if (editingAgendaId === null) return;
    const existingEpisodeIds = new Set(
      agendas
        .filter((agenda) => editingAgendaId === 0 || agenda.id !== editingAgendaId)
        .map((agenda) => agenda.episode_id),
    );
    const selectedEpisodeIds = agendaForm.episode_ids.length > 0
      ? [...new Set(agendaForm.episode_ids)]
      : (agendaForm.episode_id ? [agendaForm.episode_id] : []);
    const nonDuplicateEpisodeIds = selectedEpisodeIds.filter((episodeId) => !existingEpisodeIds.has(episodeId));
    if (nonDuplicateEpisodeIds.length === 0) return;
    setAgendaSaving(true);
    try {
      if (editingAgendaId === 0) {
        for (const episodeId of nonDuplicateEpisodeIds) {
          await api.createColloqiumAgenda({
            colloqium_id: colloqiumId,
            episode_id: episodeId,
            presented_by: agendaForm.presented_by,
            decision: agendaForm.decision,
            comment: agendaForm.comment,
          });
        }
      } else {
        await api.updateColloqiumAgenda(editingAgendaId, {
          episode_id: nonDuplicateEpisodeIds[0],
          presented_by: agendaForm.presented_by,
          decision: agendaForm.decision,
          comment: agendaForm.comment,
        });
      }
      await reloadAgendas();
      cancelEditAgenda();
    } finally {
      setAgendaSaving(false);
    }
  };

  const deleteAgenda = async (agendaId: number) => {
    setAgendaDeletingId(agendaId);
    try {
      await api.deleteColloqiumAgenda(agendaId);
      await reloadAgendas();
    } finally {
      setAgendaDeletingId(null);
    }
  };

  const openEpisodePicker = async () => {
    if (!organId) return;
    setPickerOpen(true);
    setPickerLoading(true);
    try {
      const patients = await api.listPatients();
      const matchingPatients = patients.filter((p) =>
        p.open_episode_organ_ids.includes(organId),
      );

      const details: Patient[] = await Promise.all(
        matchingPatients.map((patient) => api.getPatient(patient.id)),
      );

      const rows: PickerRow[] = matchingPatients.map((patient) => {
        const detail = details.find((entry) => entry.id === patient.id);
        const episodes: EpisodeChoice[] = (detail?.episodes ?? [])
          .filter((ep) => !ep.closed && ep.organ_id === organId)
          .map((ep) => ({
            episodeId: ep.id,
            patientId: patient.id,
            patientName: patient.name,
            patientFirstName: patient.first_name,
            patientPid: patient.pid,
            fallNr: ep.fall_nr,
            organName: ep.organ?.name_default ?? '–',
            statusName: ep.status?.name_default ?? '–',
            start: ep.start,
            end: ep.end,
          }));
        return { patient, episodes };
      }).filter((row) => row.episodes.length > 0);
      setPickerRows(rows);
    } finally {
      setPickerLoading(false);
    }
  };

  return {
    agendas,
    setAgendas,
    loadingAgendas,
    agendaDrafts,
    setAgendaDrafts,
    editingAgendaId,
    agendaSaving,
    agendaDeletingId,
    agendaForm,
    setAgendaForm,
    pickerOpen,
    setPickerOpen,
    pickerLoading,
    pickerRows,
    patientsById,
    selectedEpisodeLabel,
    selectedEpisodePreviews,
    pickerNonSelectableEpisodeIds,
    startAddAgenda,
    startEditAgenda,
    cancelEditAgenda,
    saveAgenda,
    deleteAgenda,
    openEpisodePicker,
  };
}
