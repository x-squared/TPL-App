import { useState } from 'react';
import type { ColloqiumAgenda, PatientListItem } from '../../../../api';
import { useI18n } from '../../../../i18n/i18n';
import { formatEpisodeDisplayName } from '../../../layout/episodeDisplay';
import InlineDeleteActions from '../../../layout/InlineDeleteActions';

function formatDate(iso: string | null): string {
  if (!iso) return '–';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

interface Props {
  agendas: ColloqiumAgenda[];
  editingAgendaId: number | null;
  savingAgenda: boolean;
  deletingAgendaId: number | null;
  editingForm: {
    episode_id: number | null;
    episode_ids: number[];
    presented_by: string;
    decision: string;
    comment: string;
  };
  selectedEpisodePreviews: Array<{
    episodeId: number;
    patientName: string;
    patientFirstName: string;
    patientPid: string;
    fallNr: string;
    organName: string;
    statusName: string;
    start: string | null;
    end: string | null;
  }>;
  patientsById: Record<number, PatientListItem>;
  onStartEdit: (agenda: ColloqiumAgenda) => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: (agendaId: number) => void;
  onOpenEpisode: (patientId: number, episodeId: number) => void;
  onPickEpisode: () => void;
  onEditFormChange: (patch: Partial<{
    episode_id: number | null;
    episode_ids: number[];
    presented_by: string;
    decision: string;
    comment: string;
  }>) => void;
  selectedEpisodeLabel: string;
}

export default function ColloquiumAgendaTable({
  agendas,
  editingAgendaId,
  savingAgenda,
  deletingAgendaId,
  editingForm,
  selectedEpisodePreviews,
  patientsById,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onOpenEpisode,
  onPickEpisode,
  onEditFormChange,
  selectedEpisodeLabel,
}: Props) {
  const { t } = useI18n();
  const [confirmDeleteAgendaId, setConfirmDeleteAgendaId] = useState<number | null>(null);
  const hasRows = agendas.length > 0;
  const hasEpisodeSelection = (editingForm.episode_ids?.length ?? 0) > 0 || Boolean(editingForm.episode_id);
  const selectedPreview = selectedEpisodePreviews.length === 1 ? selectedEpisodePreviews[0] : null;
  return (
    <div className="patients-table-wrap ui-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="open-col"></th>
            <th>{t('episodePicker.episode', 'Episode')}</th>
            <th>{t('patients.table.lastName', 'Last Name')}</th>
            <th>{t('patients.table.firstName', 'First Name')}</th>
            <th>{t('patients.filters.pid', 'PID')}</th>
            <th>{t('coordinations.table.organ', 'Organ')}</th>
            <th>{t('coordinations.table.status', 'Status')}</th>
            <th>{t('coordinations.table.start', 'Start')}</th>
            <th>{t('coordinations.table.end', 'End')}</th>
            <th>{t('colloquiums.protocol.presentedBy', 'Presented By')}</th>
            <th>{t('colloquiums.protocol.decision', 'Decision')}</th>
            <th>{t('taskBoard.columns.comment', 'Comment')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {!hasRows && editingAgendaId === null && (
            <tr>
              <td colSpan={13}>
                <p className="contact-empty">{t('colloquiums.agenda.empty', 'No agenda entries.')}</p>
              </td>
            </tr>
          )}
          {agendas.map((agenda) => {
            const isEditing = editingAgendaId === agenda.id;
            const patient = agenda.episode ? patientsById[agenda.episode.patient_id] : undefined;
            const canOpenEpisode = !isEditing && Boolean(agenda.episode?.id && agenda.episode?.patient_id);
            return (
              <tr
                key={agenda.id}
                className={isEditing ? 'ci-editing-row' : ''}
                onDoubleClick={() => {
                  if (!canOpenEpisode || !agenda.episode) return;
                  onOpenEpisode(agenda.episode.patient_id, agenda.episode.id);
                }}
              >
                <td className="open-col">
                  <button
                    className="open-btn"
                    onClick={() => {
                      if (!canOpenEpisode || !agenda.episode) return;
                      onOpenEpisode(agenda.episode.patient_id, agenda.episode.id);
                    }}
                    title={t('colloquiums.actions.openEpisode', 'Open episode')}
                    disabled={!canOpenEpisode}
                  >
                    &#x279C;
                  </button>
                </td>
                <td>
                  {isEditing ? (
                    <button className="link-btn" onClick={onPickEpisode}>
                      {selectedEpisodeLabel}
                    </button>
                  ) : (
                    formatEpisodeDisplayName({
                      patientName: `${patient?.first_name ?? ''} ${patient?.name ?? ''}`.trim(),
                      organName: agenda.episode?.organ?.name_default,
                      startDate: agenda.episode?.start ?? null,
                    })
                  )}
                </td>
                <td>{patient?.name ?? t('common.emptySymbol', '–')}</td>
                <td>{patient?.first_name ?? t('common.emptySymbol', '–')}</td>
                <td>{patient?.pid ?? t('common.emptySymbol', '–')}</td>
                <td>{isEditing ? (selectedPreview?.organName ?? (selectedEpisodePreviews.length > 1 ? t('colloquiums.protocol.multiple', 'Multiple') : t('common.emptySymbol', '–'))) : (agenda.episode?.organ?.name_default ?? t('common.emptySymbol', '–'))}</td>
                <td>{isEditing ? (selectedPreview?.statusName ?? (selectedEpisodePreviews.length > 1 ? t('colloquiums.protocol.multiple', 'Multiple') : t('common.emptySymbol', '–'))) : (agenda.episode?.status?.name_default ?? t('common.emptySymbol', '–'))}</td>
                <td>{isEditing ? formatDate(selectedPreview?.start ?? null) : formatDate(agenda.episode?.start ?? null)}</td>
                <td>{isEditing ? formatDate(selectedPreview?.end ?? null) : formatDate(agenda.episode?.end ?? null)}</td>
                <td>
                  {isEditing ? (
                    <input
                      className="ci-inline-input"
                      value={editingForm.presented_by}
                      onChange={(e) => onEditFormChange({ presented_by: e.target.value })}
                    />
                  ) : (
                    agenda.presented_by || t('common.emptySymbol', '–')
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="ci-inline-input"
                      value={editingForm.decision}
                      onChange={(e) => onEditFormChange({ decision: e.target.value })}
                    />
                  ) : (
                    agenda.decision || t('common.emptySymbol', '–')
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="ci-inline-input"
                      value={editingForm.comment}
                      onChange={(e) => onEditFormChange({ comment: e.target.value })}
                    />
                  ) : (
                    agenda.comment || t('common.emptySymbol', '–')
                  )}
                </td>
                <td className="detail-ci-actions">
                  {!isEditing ? (
                    <InlineDeleteActions
                      confirming={confirmDeleteAgendaId === agenda.id}
                      onEdit={() => onStartEdit(agenda)}
                      onRequestDelete={() => setConfirmDeleteAgendaId(agenda.id)}
                      onConfirmDelete={() => {
                        onDelete(agenda.id);
                        setConfirmDeleteAgendaId(null);
                      }}
                      onCancelDelete={() => setConfirmDeleteAgendaId(null)}
                      deleting={deletingAgendaId === agenda.id}
                    />
                  ) : (
                    <>
                      <button className="ci-save-inline" onClick={onSave} disabled={savingAgenda || !hasEpisodeSelection} title={t('actions.save', 'Save')} aria-label={t('actions.save', 'Save')}>✓</button>
                      <button className="ci-cancel-inline" onClick={onCancelEdit} disabled={savingAgenda} title={t('actions.cancel', 'Cancel')} aria-label={t('actions.cancel', 'Cancel')}>✕</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {editingAgendaId === 0 && (
            <tr className="ci-editing-row">
              <td className="open-col">
                <button className="open-btn" disabled title={t('colloquiums.actions.openEpisode', 'Open episode')}>
                  &#x279C;
                </button>
              </td>
              <td>
                <button className="link-btn" onClick={onPickEpisode}>
                  {selectedEpisodeLabel}
                </button>
              </td>
              <td>{selectedPreview?.patientName ?? (selectedEpisodePreviews.length > 1 ? t('colloquiums.protocol.multiple', 'Multiple') : t('common.emptySymbol', '–'))}</td>
              <td>{selectedPreview?.patientFirstName ?? (selectedEpisodePreviews.length > 1 ? t('colloquiums.protocol.multiple', 'Multiple') : t('common.emptySymbol', '–'))}</td>
              <td>{selectedPreview?.patientPid ?? (selectedEpisodePreviews.length > 1 ? t('colloquiums.protocol.multiple', 'Multiple') : t('common.emptySymbol', '–'))}</td>
              <td>{selectedPreview?.organName ?? (selectedEpisodePreviews.length > 1 ? t('colloquiums.protocol.multiple', 'Multiple') : t('common.emptySymbol', '–'))}</td>
              <td>{selectedPreview?.statusName ?? (selectedEpisodePreviews.length > 1 ? t('colloquiums.protocol.multiple', 'Multiple') : t('common.emptySymbol', '–'))}</td>
              <td>{formatDate(selectedPreview?.start ?? null)}</td>
              <td>{formatDate(selectedPreview?.end ?? null)}</td>
              <td>
                <input
                  className="ci-inline-input"
                  value={editingForm.presented_by}
                  onChange={(e) => onEditFormChange({ presented_by: e.target.value })}
                />
              </td>
              <td>
                <input
                  className="ci-inline-input"
                  value={editingForm.decision}
                  onChange={(e) => onEditFormChange({ decision: e.target.value })}
                />
              </td>
              <td>
                <input
                  className="ci-inline-input"
                  value={editingForm.comment}
                  onChange={(e) => onEditFormChange({ comment: e.target.value })}
                />
              </td>
              <td className="detail-ci-actions">
                <button className="ci-save-inline" onClick={onSave} disabled={savingAgenda || !hasEpisodeSelection} title={t('actions.save', 'Save')} aria-label={t('actions.save', 'Save')}>✓</button>
                <button className="ci-cancel-inline" onClick={onCancelEdit} disabled={savingAgenda} title={t('actions.cancel', 'Cancel')} aria-label={t('actions.cancel', 'Cancel')}>✕</button>
              </td>
            </tr>
          )}
          {editingAgendaId === 0 && selectedEpisodePreviews.length > 1 && (
            <tr className="contact-row">
              <td colSpan={13}>
                <div className="contact-section">
                  <p className="contact-empty">
                    {t('colloquiums.protocol.selectedEpisodes', 'Selected episodes:')}{' '}
                    {selectedEpisodePreviews.map((item) =>
                      `${item.fallNr} (${item.patientName}, ${item.patientFirstName}, ${item.patientPid})`,
                    ).join(' | ')}
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

