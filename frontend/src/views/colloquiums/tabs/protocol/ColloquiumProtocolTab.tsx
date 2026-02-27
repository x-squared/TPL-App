import { useMemo, useState } from 'react';
import { api, type ColloqiumAgenda, type PatientListItem, type Person, type Task } from '../../../../api';
import { exportProtocolPdf } from './exportProtocolPdf';
import TaskBoard from '../../../tasks/TaskBoard';
import PersonMultiSelect from '../../../layout/PersonMultiSelect';

interface Props {
  draftName: string;
  draftDate: string;
  draftParticipants: string;
  draftParticipantsPeople: Person[];
  agendas: ColloqiumAgenda[];
  agendaDrafts: Record<number, AgendaDraft>;
  loadingAgendas: boolean;
  patientsById: Record<number, PatientListItem>;
  onChangeAgendaDraft: (agendaId: number, patch: Partial<AgendaDraft>) => void;
  onChangeDraftParticipantsPeople: (next: Person[]) => void;
}

export interface AgendaDraft {
  presented_by: string;
  decision: string;
  comment: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '–';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function resolvePhase(agenda: ColloqiumAgenda): { label: string; from: string | null; to: string | null } {
  const episode = agenda.episode;
  if (!episode) return { label: 'Unknown', from: null, to: null };
  if (episode.closed) return { label: 'Closed', from: episode.start, to: episode.end };
  if (episode.fup_recipient_card_date) return { label: 'Follow-Up', from: episode.fup_recipient_card_date, to: null };
  if (episode.tpl_date) return { label: 'Transplantation', from: episode.tpl_date, to: null };
  if (episode.list_start || episode.list_end) return { label: 'Listing', from: episode.list_start, to: episode.list_end };
  if (episode.eval_start || episode.eval_end) return { label: 'Evaluation', from: episode.eval_start, to: episode.eval_end };
  return { label: 'Episode', from: episode.start, to: episode.end };
}

export default function ColloquiumProtocolTab({
  draftName,
  draftDate,
  draftParticipants,
  draftParticipantsPeople,
  agendas,
  agendaDrafts,
  loadingAgendas,
  patientsById,
  onChangeAgendaDraft,
  onChangeDraftParticipantsPeople,
}: Props) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [visibleTaskListsByAgendaId, setVisibleTaskListsByAgendaId] = useState<Record<number, boolean>>({});
  const [taskAutoCreateTokenByAgendaId, setTaskAutoCreateTokenByAgendaId] = useState<Record<number, number>>({});
  const sortedAgendas = useMemo(
    () => [...agendas].sort((a, b) => (a.episode?.start ?? '').localeCompare(b.episode?.start ?? '')),
    [agendas],
  );

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const tasksByAgendaId: Record<number, Task[]> = {};
      await Promise.all(sortedAgendas.map(async (agenda) => {
        const episode = agenda.episode;
        if (!episode) {
          tasksByAgendaId[agenda.id] = [];
          return;
        }
        const groupsInEpisode = await api.listTaskGroups({
          patient_id: episode.patient_id,
          episode_id: agenda.episode_id,
        });
        const exactGroups = groupsInEpisode.filter((group) => group.colloqium_agenda_id === agenda.id);
        const fallbackGroups = groupsInEpisode.filter((group) =>
          group.colloqium_agenda_id == null && group.task_group_template_id == null);
        const groupsForExport = exactGroups.length > 0 ? exactGroups : fallbackGroups;
        const groupedTasks = await Promise.all(
          groupsForExport.map((group) => api.listTasks({ task_group_id: group.id })),
        );
        tasksByAgendaId[agenda.id] = groupedTasks.flat().sort((a, b) => a.id - b.id);
      }));
      exportProtocolPdf({
        draftName,
        draftDate,
        draftParticipants,
        agendas: sortedAgendas,
        agendaDrafts,
        patientsById,
        tasksByAgendaId,
      });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <section className="colloquiums-protocol paper-layout">
      <header className="colloquiums-protocol-header">
        <h2>Protocol</h2>
        <button className="patients-save-btn" onClick={handleExportPdf} disabled={exportingPdf}>
          {exportingPdf ? 'Creating PDF...' : 'PDF'}
        </button>
      </header>

      <div>
        <section className="colloquiums-protocol-meta detail-section">
          <div className="detail-grid">
            <div className="detail-field">
              <span className="detail-label">Name</span>
              <span className="detail-value">{draftName || '–'}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(draftDate || null)}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Participants</span>
              <PersonMultiSelect
                selectedPeople={draftParticipantsPeople}
                onChange={onChangeDraftParticipantsPeople}
              />
              <span className="detail-value">{draftParticipants || '–'}</span>
            </div>
          </div>
        </section>

        {loadingAgendas ? (
          <p className="status">Loading agenda...</p>
        ) : sortedAgendas.length === 0 ? (
          <p className="status">No agenda entries.</p>
        ) : (
          <div className="colloquiums-protocol-agenda">
            {sortedAgendas.map((agenda, idx) => {
              const draft = agendaDrafts[agenda.id] ?? { presented_by: '', decision: '', comment: '' };
              const patient = agenda.episode ? patientsById[agenda.episode.patient_id] : undefined;
              const phase = resolvePhase(agenda);
              const tasksVisible = visibleTaskListsByAgendaId[agenda.id] ?? false;
              const canOpenTasks = Boolean(agenda.episode?.patient_id && agenda.episode_id);
              return (
                <section
                  key={agenda.id}
                  className={`colloquiums-protocol-episode ${idx > 0 ? 'with-divider' : ''}`}
                >
                  <div className="colloquiums-protocol-episode-head">
                    <strong>
                      {patient
                        ? `${patient.name}, ${patient.first_name} (${patient.pid})`
                        : `Unknown patient (Episode ${agenda.episode?.fall_nr || `#${agenda.episode_id}`})`}
                    </strong>
                  </div>
                  <div className="colloquiums-protocol-episode-meta">
                    <span>Episode: {agenda.episode?.fall_nr || `#${agenda.episode_id}`}</span>
                    <span>Status: {agenda.episode?.status?.name_default ?? '–'}</span>
                    <span>
                      Phase: {phase.label} ({formatDate(phase.from)} – {formatDate(phase.to)})
                    </span>
                  </div>

                  <div className="colloquiums-protocol-episode-fields">
                    <label>
                      Presented By
                      <input
                        type="text"
                        value={draft.presented_by}
                        onChange={(e) => onChangeAgendaDraft(agenda.id, { presented_by: e.target.value })}
                      />
                    </label>
                    <label>
                      Decision
                      <input
                        type="text"
                        value={draft.decision}
                        onChange={(e) => onChangeAgendaDraft(agenda.id, { decision: e.target.value })}
                      />
                    </label>
                    <label>
                      Comment
                      <textarea
                        rows={3}
                        value={draft.comment}
                        onChange={(e) => onChangeAgendaDraft(agenda.id, { comment: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="colloquiums-protocol-tasks-placeholder">
                    {!tasksVisible ? (
                      <>
                        <button
                          className="patients-cancel-btn"
                          disabled={!canOpenTasks}
                          onClick={() =>
                            setVisibleTaskListsByAgendaId((prev) => ({ ...prev, [agenda.id]: true }))
                          }
                        >
                          Show tasks
                        </button>
                        <button
                          className="patients-add-btn"
                          disabled={!canOpenTasks}
                          onClick={() => {
                            setVisibleTaskListsByAgendaId((prev) => ({ ...prev, [agenda.id]: true }));
                            setTaskAutoCreateTokenByAgendaId((prev) => ({
                              ...prev,
                              [agenda.id]: (prev[agenda.id] ?? 0) + 1,
                            }));
                          }}
                        >
                          + Add task
                        </button>
                      </>
                    ) : (
                      <button
                        className="patients-cancel-btn"
                        onClick={() =>
                          setVisibleTaskListsByAgendaId((prev) => ({ ...prev, [agenda.id]: false }))
                        }
                      >
                        Hide tasks
                      </button>
                    )}
                  </div>
                  {tasksVisible && canOpenTasks && (
                    <TaskBoard
                      title="Task list"
                      criteria={{
                        patientId: agenda.episode!.patient_id,
                        episodeId: agenda.episode_id,
                        colloqiumAgendaId: agenda.id,
                        colloqiumId: agenda.colloqium_id,
                      }}
                      hideFilters
                      showGroupHeadingsDefault={false}
                      includeClosedTasks
                      autoCreateToken={taskAutoCreateTokenByAgendaId[agenda.id]}
                      onAutoCreateDiscarded={() =>
                        setVisibleTaskListsByAgendaId((prev) => ({ ...prev, [agenda.id]: false }))
                      }
                      maxTableHeight={280}
                    />
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

