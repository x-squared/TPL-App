import { useState } from 'react';
import { api } from '../../api';
import EpisodeDetailGrid from './episodes/EpisodeDetailGrid';
import EpisodeMetaSection from './episodes/EpisodeMetaSection';
import EpisodeProcessTabs from './episodes/EpisodeProcessTabs';
import EpisodeTable from './episodes/EpisodeTable';
import { isDateField } from './episodes/episodeDetailUtils';
import type { EpisodeDetailForm, EpisodeDetailTab, EpisodesTabProps } from './episodes/types';
import './EpisodesTab.css';

export default function EpisodesTab(props: EpisodesTabProps) {
  const {
    patient,
    addingEpisode,
    setAddingEpisode,
    editingEpId,
    epEditForm,
    setEpEditForm,
    epSaving,
    handleSaveEp,
    cancelEditingEp,
    startEditingEp,
    confirmDeleteEpId,
    setConfirmDeleteEpId,
    handleDeleteEpisode,
    organCodes,
    tplStatusCodes,
    epForm,
    setEpForm,
    handleAddEpisode,
    formatDate,
    refreshPatient,
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

  const evalKeys = ['eval_start', 'eval_end', 'eval_assigned_to', 'eval_stat', 'eval_register_date', 'eval_excluded', 'eval_non_list_sent'] as const;
  const listKeys = ['list_start', 'list_end', 'list_rs_nr', 'list_reason_delist', 'list_expl_delist', 'list_delist_sent'] as const;
  const tplKeys = ['tpl_date'] as const;
  const followUpKeys = ['fup_recipient_card_done', 'fup_recipient_card_date'] as const;
  const closedKeys = ['closed', 'end'] as const;

  const sortedEpisodes = [...(patient.episodes ?? [])].sort((a, b) => (a.status?.pos ?? 999) - (b.status?.pos ?? 999));
  const selectedEpisode = sortedEpisodes.find((ep) => ep.id === selectedEpisodeId) ?? null;

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

  return (
    <section className="detail-section" style={{ marginTop: '1.5rem' }}>
      <div className="detail-section-heading">
        <h2>Episodes</h2>
        {!addingEpisode && (
          <button className="ci-add-btn" onClick={() => setAddingEpisode(true)}>+ Add</button>
        )}
      </div>

      <EpisodeTable
        patientEpisodes={patient.episodes ?? []}
        sortedEpisodes={sortedEpisodes}
        addingEpisode={addingEpisode}
        setAddingEpisode={setAddingEpisode}
        editingEpId={editingEpId}
        epEditForm={epEditForm}
        setEpEditForm={setEpEditForm}
        epSaving={epSaving}
        handleSaveEp={handleSaveEp}
        cancelEditingEp={cancelEditingEp}
        startEditingEp={startEditingEp}
        confirmDeleteEpId={confirmDeleteEpId}
        setConfirmDeleteEpId={setConfirmDeleteEpId}
        handleDeleteEpisode={handleDeleteEpisode}
        organCodes={organCodes}
        tplStatusCodes={tplStatusCodes}
        epForm={epForm}
        setEpForm={setEpForm}
        handleAddEpisode={handleAddEpisode}
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
        </section>
      )}
    </section>
  );
}
