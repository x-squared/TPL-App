import { useEffect, useMemo, useState } from 'react';
import { api, type Colloqium } from '../../../../api';
import type { ColloquiumDetailTab } from '../colloquiumDetailViewModelTypes';

export function useColloquiumGeneralDetails(colloqiumId: number) {
  const [colloqium, setColloqium] = useState<Colloqium | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ColloquiumDetailTab>('colloquium');
  const [draftName, setDraftName] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftParticipants, setDraftParticipants] = useState('');
  const [generalEditing, setGeneralEditing] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalSaveError, setGeneralSaveError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const all = await api.listColloqiums();
        const selected = all.find((item) => item.id === colloqiumId) ?? null;
        setColloqium(selected);
        setDraftName(selected?.colloqium_type?.name ?? '');
        setDraftDate(selected?.date ?? '');
        setDraftParticipants(selected?.participants ?? '');
        setGeneralEditing(false);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [colloqiumId]);

  const isGeneralDirty = Boolean(
    colloqium
      && (
        draftName !== (colloqium.colloqium_type?.name ?? '')
        || draftParticipants !== (colloqium.participants ?? '')
        || (draftDate || '') !== (colloqium.date ?? '')
      ),
  );

  const saveGeneralDetails = async () => {
    if (!colloqium || savingGeneral || !isGeneralDirty) return;
    setSavingGeneral(true);
    setGeneralSaveError('');
    try {
      let nextColloqium = colloqium;
      if (colloqium.colloqium_type && draftName !== (colloqium.colloqium_type.name ?? '')) {
        const updatedType = await api.updateColloqiumType(colloqium.colloqium_type.id, { name: draftName });
        nextColloqium = {
          ...nextColloqium,
          colloqium_type: { ...(nextColloqium.colloqium_type ?? updatedType), ...updatedType },
        };
      }
      const colloqiumPayload: { date?: string; participants?: string } = {};
      if (draftParticipants !== (colloqium.participants ?? '')) {
        colloqiumPayload.participants = draftParticipants;
      }
      if ((draftDate || '') !== (colloqium.date ?? '')) {
        colloqiumPayload.date = draftDate;
      }
      if (Object.keys(colloqiumPayload).length > 0) {
        const updatedColloqium = await api.updateColloqium(colloqium.id, colloqiumPayload);
        nextColloqium = {
          ...nextColloqium,
          ...updatedColloqium,
          colloqium_type: nextColloqium.colloqium_type ?? updatedColloqium.colloqium_type,
        };
      }
      setColloqium(nextColloqium);
      setGeneralEditing(false);
    } catch (error) {
      setGeneralSaveError(error instanceof Error ? error.message : 'Could not save colloquium details.');
    } finally {
      setSavingGeneral(false);
    }
  };

  const startGeneralEditing = () => {
    setGeneralSaveError('');
    setGeneralEditing(true);
  };

  const cancelGeneralEditing = () => {
    if (!colloqium) return;
    setDraftName(colloqium.colloqium_type?.name ?? '');
    setDraftDate(colloqium.date ?? '');
    setDraftParticipants(colloqium.participants ?? '');
    setGeneralSaveError('');
    setGeneralEditing(false);
  };

  const syncDraftFromPayload = useMemo(() => ({
    setDraftName,
    setDraftDate,
    setDraftParticipants,
  }), []);

  return {
    colloqium,
    loading,
    tab,
    setTab,
    draftName,
    setDraftName,
    draftDate,
    setDraftDate,
    draftParticipants,
    setDraftParticipants,
    generalEditing,
    savingGeneral,
    generalSaveError,
    isGeneralDirty,
    saveGeneralDetails,
    startGeneralEditing,
    cancelGeneralEditing,
    syncDraftFromPayload,
  };
}
