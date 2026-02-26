import { useEffect, useMemo, useState } from 'react';
import { api, type ColloqiumAgenda, type ColloqiumType } from '../../api';
import { formatEpisodeFavoriteName, formatOrganNames } from '../layout/episodeDisplay';
import FavoriteButton from '../layout/FavoriteButton';
import { useFavoriteToggle } from '../layout/useFavoriteToggle';
import EpisodeDetailGrid from './episodes/EpisodeDetailGrid';
import EpisodeColloquiumSection from './episodes/EpisodeColloquiumSection';
import EpisodeMetaSection from './episodes/EpisodeMetaSection';
import EpisodeProcessTabs from './episodes/EpisodeProcessTabs';
import EpisodeTable from './episodes/EpisodeTable';
import { isDateField } from './episodes/episodeDetailUtils';
import type { EpisodeDetailForm, EpisodeDetailTab, EpisodesTabProps } from './episodes/types';
import './EpisodesTab.css';

export default function EpisodesTab(props: EpisodesTabProps) {
  const {
    patient,
    formatDate,
    refreshPatient,
    episodes,
    initialSelectedEpisodeId,
    onOpenColloqium,
  } = props;

  const episodeDetailTabs: readonly EpisodeDetailTab[] = [
    'Evaluation',
    'Listing',
    'Transplantation',
    'Follow-Up',
    'Closed',
  ];
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null);
  const [activeEpisodeTab, setActiveEpisodeTab] = useState<EpisodeDetailTab>('Evaluation');
  const [editingDetailTab, setEditingDetailTab] = useState<EpisodeDetailTab | null>(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailForm, setDetailForm] = useState<EpisodeDetailForm>({});
  const [detailSaveError, setDetailSaveError] = useState('');
  const [editingEpisodeMeta, setEditingEpisodeMeta] = useState(false);
  const [episodeMetaForm, setEpisodeMetaForm] = useState({ comment: '', cave: '' });
  const [episodeColloqiumAgendas, setEpisodeColloqiumAgendas] = useState<ColloqiumAgenda[]>([]);
  const [loadingEpisodeColloqiums, setLoadingEpisodeColloqiums] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningColloqium, setAssigningColloqium] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [organActionLoading, setOrganActionLoading] = useState(false);
  const [assignTypes, setAssignTypes] = useState<ColloqiumType[]>([]);
  const [assignTypeId, setAssignTypeId] = useState<number | null>(null);
  const [assignDate, setAssignDate] = useState(() => new Date().toISOString().slice(0, 10));

  const evalKeys = ['eval_start', 'eval_end', 'eval_assigned_to', 'eval_stat', 'eval_register_date', 'eval_excluded', 'eval_non_list_sent'] as const;
  const listKeys = ['list_start', 'list_end', 'list_rs_nr', 'list_reason_delist', 'list_expl_delist', 'list_delist_sent'] as const;
  const tplKeys = ['tpl_date'] as const;
  const followUpKeys = ['fup_recipient_card_done', 'fup_recipient_card_date'] as const;
  const closedKeys = ['closed', 'end'] as const;

  const sortedEpisodes = [...(patient.episodes ?? [])].sort((a, b) => (a.status?.pos ?? 999) - (b.status?.pos ?? 999));
  const selectedEpisode = sortedEpisodes.find((ep) => ep.id === selectedEpisodeId) ?? null;
  const episodeFavorite = useFavoriteToggle(selectedEpisode ? {
    favorite_type_key: 'EPISODE',
    episode_id: selectedEpisode.id,
    patient_id: patient.id,
    name: formatEpisodeFavoriteName({
      fullName: `${patient.first_name} ${patient.name}`.trim(),
      birthDate: patient.date_of_birth,
      pid: patient.pid,
      organName: formatOrganNames(selectedEpisode.organs, selectedEpisode.organ?.name_default ?? 'Episode'),
      startDate: selectedEpisode.start,
    }),
  } : null);
  const selectableColloqiumTypes = useMemo(() => {
    const selectedOrganIds = selectedEpisode
      ? (selectedEpisode.organ_ids?.length ? selectedEpisode.organ_ids : [selectedEpisode.organ_id]).filter((id): id is number => typeof id === 'number')
      : [];
    return [...assignTypes].sort((a, b) => {
      const aRelevant = selectedOrganIds.includes(a.organ_id) ? 0 : 1;
      const bRelevant = selectedOrganIds.includes(b.organ_id) ? 0 : 1;
      if (aRelevant !== bRelevant) return aRelevant - bRelevant;
      return a.name.localeCompare(b.name);
    });
  }, [assignTypes, selectedEpisode]);

  const evalEntries = selectedEpisode ? evalKeys.map((key) => [key, selectedEpisode[key] ?? null] as const) : [];
  const listEntries = selectedEpisode ? listKeys.map((key) => [key, selectedEpisode[key] ?? null] as const) : [];
  const tplEntries = selectedEpisode ? tplKeys.map((key) => [key, selectedEpisode[key] ?? null] as const) : [];
  const followUpEntries = selectedEpisode ? followUpKeys.map((key) => [key, selectedEpisode[key] ?? null] as const) : [];
  const closedEntries = selectedEpisode ? closedKeys.map((key) => [key, selectedEpisode[key] ?? null] as const) : [];

  const getEntriesForTab = (tab: EpisodeDetailTab) => {
    if (tab === 'Evaluation') return evalEntries;
    if (tab === 'Listing') return listEntries;
    if (tab === 'Transplantation') return tplEntries;
    if (tab === 'Follow-Up') return followUpEntries;
    return closedEntries;
  };

  const startEditingDetailTab = (tab: EpisodeDetailTab) => {
    const entries = getEntriesForTab(tab);
    const next: EpisodeDetailForm = {};
    entries.forEach(([key, value]) => {
      next[key] = value;
    });
    setDetailForm(next);
    setEditingDetailTab(tab);
  };

  const handleSaveDetailTab = async () => {
    if (!selectedEpisode) return;
    const payload: Record<string, string | boolean | null> = {};
    Object.entries(detailForm).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        payload[key] = value;
      } else if (isDateField(key)) {
        payload[key] = value || null;
      } else {
        payload[key] = value ?? '';
      }
    });
    setDetailSaving(true);
    setDetailSaveError('');
    try {
      await api.updateEpisode(patient.id, selectedEpisode.id, payload);
      await refreshPatient();
      setEditingDetailTab(null);
    } catch (err) {
      setDetailSaveError(err instanceof Error ? err.message : 'Could not save episode details.');
    } finally {
      setDetailSaving(false);
    }
  };

  const startEditingEpisodeMeta = () => {
    if (!selectedEpisode) return;
    setEpisodeMetaForm({
      comment: selectedEpisode.comment ?? '',
      cave: selectedEpisode.cave ?? '',
    });
    setDetailSaveError('');
    setEditingEpisodeMeta(true);
  };

  const handleSaveEpisodeMeta = async () => {
    if (!selectedEpisode) return;
    setDetailSaving(true);
    setDetailSaveError('');
    try {
      await api.updateEpisode(patient.id, selectedEpisode.id, {
        comment: episodeMetaForm.comment ?? '',
        cave: episodeMetaForm.cave ?? '',
      });
      await refreshPatient();
      setEditingEpisodeMeta(false);
    } catch (err) {
      setDetailSaveError(err instanceof Error ? err.message : 'Could not save episode details.');
    } finally {
      setDetailSaving(false);
    }
  };

  const handleAddOrReactivateOrgan = async (payload: {
    organ_id: number;
    date_added?: string | null;
    comment?: string;
    reason_activation_change?: string;
  }) => {
    if (!selectedEpisode) return;
    setOrganActionLoading(true);
    setDetailSaveError('');
    try {
      await api.addEpisodeOrgan(patient.id, selectedEpisode.id, payload);
      await refreshPatient();
    } catch (err) {
      setDetailSaveError(err instanceof Error ? err.message : 'Could not add or reactivate organ.');
    } finally {
      setOrganActionLoading(false);
    }
  };

  const handleUpdateOrgan = async (
    episodeOrganId: number,
    payload: {
      comment?: string;
      is_active?: boolean;
      date_inactivated?: string | null;
      reason_activation_change?: string;
    },
  ) => {
    if (!selectedEpisode) return;
    setOrganActionLoading(true);
    setDetailSaveError('');
    try {
      await api.updateEpisodeOrgan(patient.id, selectedEpisode.id, episodeOrganId, payload);
      await refreshPatient();
    } catch (err) {
      setDetailSaveError(err instanceof Error ? err.message : 'Could not update episode organ.');
    } finally {
      setOrganActionLoading(false);
    }
  };

  const reloadEpisodeColloqiums = async (episodeId: number) => {
    setLoadingEpisodeColloqiums(true);
    try {
      const rows = await api.listColloqiumAgendas({ episodeId });
      setEpisodeColloqiumAgendas(rows);
    } finally {
      setLoadingEpisodeColloqiums(false);
    }
  };

  useEffect(() => {
    if (initialSelectedEpisodeId == null) return;
    const exists = sortedEpisodes.some((ep) => ep.id === initialSelectedEpisodeId);
    setSelectedEpisodeId(exists ? initialSelectedEpisodeId : null);
    setActiveEpisodeTab('Evaluation');
    setEditingDetailTab(null);
  }, [initialSelectedEpisodeId, patient.id, sortedEpisodes]);

  useEffect(() => {
    if (!selectedEpisodeId) {
      setEpisodeColloqiumAgendas([]);
      return;
    }
    void reloadEpisodeColloqiums(selectedEpisodeId);
  }, [selectedEpisodeId]);

  const openAssignDialog = async () => {
    if (!selectedEpisode) return;
    setAssignError('');
    setAssignDialogOpen(true);
    const types = await api.listColloqiumTypes();
    setAssignTypes(types);
    const selectedOrganIds = selectedEpisode.organ_ids?.length ? selectedEpisode.organ_ids : [selectedEpisode.organ_id];
    const eligible = types.filter((type) => selectedOrganIds.includes(type.organ_id));
    setAssignTypeId(eligible.length === 1 ? eligible[0].id : null);
  };

  const handleAssignEpisodeToColloqium = async () => {
    if (!selectedEpisode || !assignTypeId || !assignDate) return;
    setAssignError('');
    setAssigningColloqium(true);
    try {
      const allColloqiums = await api.listColloqiums();
      const selectedType = assignTypes.find((type) => type.id === assignTypeId);
      let target = allColloqiums.find(
        (item) => item.colloqium_type_id === assignTypeId && item.date === assignDate,
      );
      if (!target) {
        target = await api.createColloqium({
          colloqium_type_id: assignTypeId,
          date: assignDate,
          participants: selectedType?.participants ?? '',
        });
      }
      await api.createColloqiumAgenda({
        colloqium_id: target.id,
        episode_id: selectedEpisode.id,
      });
      await reloadEpisodeColloqiums(selectedEpisode.id);
      setAssignDialogOpen(false);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Could not assign episode to colloquium.');
    } finally {
      setAssigningColloqium(false);
    }
  };

  return (
    <section className="detail-section" style={{ marginTop: '1.5rem' }}>
      <div className="detail-section-heading">
        <h2>Episodes</h2>
        {!episodes.addingEpisode && (
          <button className="ci-add-btn" onClick={() => episodes.setAddingEpisode(true)}>+ Add</button>
        )}
      </div>

      <EpisodeTable
        patientEpisodes={patient.episodes ?? []}
        sortedEpisodes={sortedEpisodes}
        addingEpisode={episodes.addingEpisode}
        setAddingEpisode={episodes.setAddingEpisode}
        editingEpId={episodes.editingEpId}
        epEditForm={episodes.epEditForm}
        setEpEditForm={episodes.setEpEditForm}
        epSaving={episodes.epSaving}
        handleSaveEp={episodes.handleSaveEp}
        cancelEditingEp={episodes.cancelEditingEp}
        startEditingEp={episodes.startEditingEp}
        confirmDeleteEpId={episodes.confirmDeleteEpId}
        setConfirmDeleteEpId={episodes.setConfirmDeleteEpId}
        handleDeleteEpisode={episodes.handleDeleteEpisode}
        organCodes={episodes.organCodes}
        tplStatusCodes={episodes.tplStatusCodes}
        epForm={episodes.epForm}
        setEpForm={episodes.setEpForm}
        handleAddEpisode={episodes.handleAddEpisode}
        formatDate={formatDate}
        selectedEpisodeId={selectedEpisodeId}
        onSelectEpisode={(id) => {
          setSelectedEpisodeId(id);
          setActiveEpisodeTab('Evaluation');
          setEditingDetailTab(null);
        }}
      />

      {selectedEpisode && (
        <section className="detail-section episode-detail-section">
          <EpisodeMetaSection
            selectedEpisode={selectedEpisode}
            editingEpisodeMeta={editingEpisodeMeta}
            episodeMetaForm={episodeMetaForm}
            setEpisodeMetaForm={setEpisodeMetaForm}
            detailSaving={detailSaving}
            startEditingEpisodeMeta={startEditingEpisodeMeta}
            handleSaveEpisodeMeta={handleSaveEpisodeMeta}
            setEditingEpisodeMeta={setEditingEpisodeMeta}
            formatDate={formatDate}
            organCodes={episodes.organCodes}
            organActionLoading={organActionLoading}
            onAddOrReactivateOrgan={handleAddOrReactivateOrgan}
            onUpdateOrgan={handleUpdateOrgan}
            favoriteControl={(
              <FavoriteButton
                active={episodeFavorite.isFavorite}
                disabled={episodeFavorite.loading || episodeFavorite.saving}
                onClick={() => void episodeFavorite.toggle()}
                title={episodeFavorite.isFavorite ? 'Remove episode from favorites' : 'Add episode to favorites'}
              />
            )}
          />

          <EpisodeProcessTabs
            episodeDetailTabs={episodeDetailTabs}
            activeEpisodeTab={activeEpisodeTab}
            setActiveEpisodeTab={setActiveEpisodeTab}
            editingDetailTab={editingDetailTab}
            detailSaving={detailSaving}
            handleSaveDetailTab={handleSaveDetailTab}
            setEditingDetailTab={setEditingDetailTab}
            startEditingDetailTab={startEditingDetailTab}
            setDetailSaveError={setDetailSaveError}
          />

          {detailSaveError && <p className="episode-detail-error">{detailSaveError}</p>}

          {activeEpisodeTab === 'Evaluation' && (
            <EpisodeDetailGrid
              entries={evalEntries}
              labelPrefix="eval_"
              editing={editingDetailTab === 'Evaluation'}
              detailForm={detailForm}
              setDetailForm={setDetailForm}
              formatDate={formatDate}
            />
          )}
          {activeEpisodeTab === 'Listing' && (
            <EpisodeDetailGrid
              entries={listEntries}
              labelPrefix="list_"
              editing={editingDetailTab === 'Listing'}
              detailForm={detailForm}
              setDetailForm={setDetailForm}
              formatDate={formatDate}
            />
          )}
          {activeEpisodeTab === 'Transplantation' && (
            <EpisodeDetailGrid
              entries={tplEntries}
              labelPrefix="tpl_"
              editing={editingDetailTab === 'Transplantation'}
              detailForm={detailForm}
              setDetailForm={setDetailForm}
              formatDate={formatDate}
            />
          )}
          {activeEpisodeTab === 'Follow-Up' && (
            <EpisodeDetailGrid
              entries={followUpEntries}
              editing={editingDetailTab === 'Follow-Up'}
              detailForm={detailForm}
              setDetailForm={setDetailForm}
              formatDate={formatDate}
            />
          )}
          {activeEpisodeTab === 'Closed' && (
            <EpisodeDetailGrid
              entries={closedEntries}
              editing={editingDetailTab === 'Closed'}
              detailForm={detailForm}
              setDetailForm={setDetailForm}
              formatDate={formatDate}
            />
          )}

          <EpisodeColloquiumSection
            loadingEpisodeColloqiums={loadingEpisodeColloqiums}
            episodeColloqiumAgendas={episodeColloqiumAgendas}
            onOpenColloqium={onOpenColloqium}
            onOpenAssignDialog={openAssignDialog}
            formatDate={formatDate}
            assignDialogOpen={assignDialogOpen}
            assigningColloqium={assigningColloqium}
            assignError={assignError}
            selectableColloqiumTypes={selectableColloqiumTypes}
            assignTypeId={assignTypeId}
            setAssignTypeId={setAssignTypeId}
            assignDate={assignDate}
            setAssignDate={setAssignDate}
            onAssign={handleAssignEpisodeToColloqium}
            onCloseAssignDialog={() => setAssignDialogOpen(false)}
          />
        </section>
      )}
    </section>
  );
}
