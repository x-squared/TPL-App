import { useEffect, useMemo, useState } from 'react';
import {
  api,
  type CoordinationEpisodeLinkedEpisode,
  type CoordinationProcurementFlex,
  type CoordinationProcurementValue,
  type MedicalValue,
  type PatientListItem,
  type Person,
  type PersonTeam,
  type ProcurementGroupDisplayLane,
  type ProcurementSlotKey,
} from '../../../api';
import { toUserErrorMessage } from '../../../api/error';
import { translateCodeLabel } from '../../../i18n/codeTranslations';
import { useI18n } from '../../../i18n/i18n';
import { formatDefaultEpisodeReference } from '../../layout/episodeDisplay';
import { withPreservedMainContentScroll } from '../../layout/scrollPreservation';
import { getConfigFromMetadata } from '../../../utils/datatypeFramework';
import PersonMultiSelect from '../../layout/PersonMultiSelect';
import CoordinationEpisodePickerDialog from './CoordinationEpisodePickerDialog';
import { useCoordinationProtocolState } from './CoordinationProtocolStateContext';
import { useCoordinationEpisodePickerModel } from './useCoordinationEpisodePickerModel';

interface CoordinationProtocolDataPanelProps {
  coordinationId: number;
  organId: number;
  organKey?: string;
  groupLanes?: ProcurementGroupDisplayLane[];
  gridLayout?: 'single' | 'two-column';
  hideWhenEmpty?: boolean;
  onPendingDataChange?: (hasPendingData: boolean) => void;
  onAssignmentsChanged?: () => Promise<void>;
}

type DraftsByField = Record<number, string>;
const FORCED_DATETIME_FIELD_KEYS = new Set([
  'COLD_PERFUSION',
  'COLD_PERFUSION_ABDOMINAL',
]);
const FORCED_BOOLEAN_FIELD_KEYS = new Set([
  'NMP_USED',
  'EVLP_USED',
  'HOPE_USED',
  'LIFEPORT_USED',
]);
const DUAL_RECIPIENT_ORGAN_KEYS = new Set(['KIDNEY', 'LUNG']);

export default function CoordinationProtocolDataPanel({
  coordinationId,
  organId,
  organKey,
  groupLanes,
  gridLayout = 'single',
  hideWhenEmpty = false,
  onPendingDataChange,
  onAssignmentsChanged,
}: CoordinationProtocolDataPanelProps) {
  const { t } = useI18n();
  const { state: protocolState, refresh: refreshProtocolState } = useCoordinationProtocolState();
  const [flex, setFlex] = useState<CoordinationProcurementFlex | null>(null);
  const [teams, setTeams] = useState<PersonTeam[]>([]);
  const [recipientSelectableEpisodes, setRecipientSelectableEpisodes] = useState<CoordinationEpisodeLinkedEpisode[]>([]);
  const [drafts, setDrafts] = useState<DraftsByField>({});
  const [savingFieldId, setSavingFieldId] = useState<number | null>(null);
  const [savingOrganRejection, setSavingOrganRejection] = useState(false);
  const [clearingOrganWorkflow, setClearingOrganWorkflow] = useState(false);
  const [workflowClearedByOrganId, setWorkflowClearedByOrganId] = useState<Record<number, boolean>>({});
  const [selectingEpisode, setSelectingEpisode] = useState<{ fieldId: number; slotKey: ProcurementSlotKey } | null>(null);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [patientById, setPatientById] = useState<Map<number, PatientListItem>>(new Map());
  const [medicalValuesByPatientId, setMedicalValuesByPatientId] = useState<Map<number, MedicalValue[]>>(new Map());
  const [organRejectionCommentDraft, setOrganRejectionCommentDraft] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const [loadedFlex, loadedTeams, loadedRecipientSelectableEpisodes, patients] = await Promise.all([
        api.getCoordinationProcurementFlex(coordinationId),
        api.listTeams(),
        api.listCoordinationRecipientSelectableEpisodes(coordinationId, organId),
        api.listPatients(),
      ]);
      setFlex(loadedFlex);
      setTeams(loadedTeams);
      setRecipientSelectableEpisodes(loadedRecipientSelectableEpisodes);
      const candidatePatientIds = new Set(
        loadedRecipientSelectableEpisodes
          .map((episode) => episode.patient_id)
          .filter((id) => id > 0),
      );
      const mappedPatients = new Map<number, PatientListItem>();
      for (const patient of patients) {
        if (candidatePatientIds.has(patient.id)) {
          mappedPatients.set(patient.id, patient);
        }
      }
      setPatientById(mappedPatients);
      setDrafts(() => {
        const next: DraftsByField = {};
        for (const field of loadedFlex.field_templates) {
          const value = resolveValueForField(loadedFlex, organId, field.id);
          next[field.id] = value?.value ?? '';
        }
        return next;
      });
    } catch (err) {
      setError(toUserErrorMessage(err, t('coordinations.protocolData.errors.load', 'Failed to load grouped procurement values.')));
    }
  };

  useEffect(() => {
    void load();
  }, [coordinationId, organId]);

  const activeOrgan = useMemo(
    () => flex?.organs.find((entry) => entry.organ_id === organId) ?? null,
    [flex, organId],
  );
  const activeProtocolOrgan = useMemo(
    () => protocolState?.organs.find((entry) => entry.organ_id === organId) ?? null,
    [protocolState?.organs, organId],
  );
  const organWorkflowCleared = Boolean(workflowClearedByOrganId[organId]);
  useEffect(() => {
    setOrganRejectionCommentDraft(activeOrgan?.organ_rejection_comment ?? '');
  }, [activeOrgan?.organ_rejection_comment, activeOrgan?.organ_id]);
  useEffect(() => {
    if (!activeOrgan?.organ_rejected) {
      setWorkflowClearedByOrganId((prev) => ({ ...prev, [organId]: false }));
    }
  }, [activeOrgan?.organ_rejected, organId]);

  const groups = useMemo(() => {
    if (!flex) return [];
    const groupsById = new Map(flex.field_group_templates.map((group) => [group.id, group]));
    return [...flex.field_templates]
      .sort((a, b) => {
        const ga = a.group_template_id ? groupsById.get(a.group_template_id)?.pos ?? 999 : 999;
        const gb = b.group_template_id ? groupsById.get(b.group_template_id)?.pos ?? 999 : 999;
        return ga - gb || a.pos - b.pos || a.id - b.id;
      })
      .reduce<Array<{ key: string; name: string; lane: ProcurementGroupDisplayLane; fields: CoordinationProcurementFlex['field_templates'] }>>((acc, field) => {
        const groupId = field.group_template_id;
        const group = groupId ? groupsById.get(groupId) : null;
        const key = group?.key ?? 'UNGROUPED';
        const lane = (group?.display_lane ?? 'PRIMARY') as ProcurementGroupDisplayLane;
        const existing = acc.find((item) => item.key === key);
        if (existing) {
          existing.fields.push(field);
          return acc;
        }
        return [
          ...acc,
          {
            key,
            name: group
              ? t(`coordinations.protocolData.groupsByKey.${group.key}`, group.name_default)
              : t('coordinations.protocolData.groups.other', 'Other'),
            lane,
            fields: [field],
          },
        ];
      }, [])
      .filter((group) => !groupLanes || groupLanes.includes(group.lane));
  }, [flex, groupLanes, t]);
  const hasPendingData = useMemo(
    () => groups.some((group) => !isGroupTouched(
      group.fields,
      flex,
      organId,
      drafts,
      Boolean(activeOrgan?.organ_rejected && organWorkflowCleared),
    )),
    [activeOrgan?.organ_rejected, drafts, flex, groups, organId, organWorkflowCleared],
  );
  useEffect(() => {
    onPendingDataChange?.(hasPendingData);
  }, [hasPendingData, onPendingDataChange]);

  const availableRecipientEpisodes = useMemo(() => {
    const episodeById = new Map<number, CoordinationEpisodeLinkedEpisode>();
    const stats = {
      totalLinks: recipientSelectableEpisodes.length,
      withEpisode: 0,
      uniqueEpisodes: 0,
      openStatus: 0,
      withOrgans: 0,
      organMatch: 0,
      finalOptions: 0,
    };
    for (const episode of recipientSelectableEpisodes) {
      stats.withEpisode += 1;
      if (!episodeById.has(episode.id)) {
        episodeById.set(episode.id, episode);
      }
    }
    stats.uniqueEpisodes = episodeById.size;
    const rows = [...episodeById.values()]
      .map((episode) => {
        const statusKey = (episode.status?.key ?? '').trim().toUpperCase();
        if (statusKey) {
          stats.openStatus += 1;
        }
        const episodeOrgans = episode.organs ?? [];
        if (episodeOrgans.length > 0) {
          stats.withOrgans += 1;
        }
        if (episodeOrgans.some((entry) => entry.id === organId)) {
          stats.organMatch += 1;
        }
        return episode;
      })
      .sort((a, b) => (a.fall_nr || '').localeCompare(b.fall_nr || ''));
    stats.finalOptions = rows.length;
    return { rows, stats };
  }, [recipientSelectableEpisodes, organId]);

  const getOrganLabel = (key: string, fallback: string): string => {
    return translateCodeLabel(t, { type: 'ORGAN', key, name_default: fallback });
  };

  const selectedFieldTemplateId = selectingEpisode?.fieldId ?? null;
  const selectedFieldCurrentEpisodeId = selectedFieldTemplateId && selectingEpisode && flex
    ? (resolveValueForFieldInSlot(flex, organId, selectingEpisode.slotKey, selectedFieldTemplateId)?.episode_ref?.episode_id ?? null)
    : null;
  const activeOrganLabel = activeOrgan?.organ
    ? getOrganLabel(activeOrgan.organ.key ?? '', t('server.entities.organ', 'Organ'))
    : t('server.entities.organ', 'Organ');

  const loadPickerData = async () => {
    const candidatePatientIds = [...new Set(availableRecipientEpisodes.rows.map((row) => row.patient_id).filter((id) => id > 0))];
    if (candidatePatientIds.length === 0) {
      setPatientById(new Map());
      setMedicalValuesByPatientId(new Map());
      return;
    }
    setPickerLoading(true);
    try {
      const patients = await api.listPatients();
      const candidateSet = new Set(candidatePatientIds);
      const patientMap = new Map<number, PatientListItem>();
      for (const patient of patients) {
        if (candidateSet.has(patient.id)) {
          patientMap.set(patient.id, patient);
        }
      }
      const medicalResponses = await Promise.all(
        [...patientMap.keys()].map(async (patientId) => {
          const values = await api.listMedicalValues(patientId);
          return [patientId, values] as const;
        }),
      );
      const medicalMap = new Map<number, MedicalValue[]>();
      for (const [patientId, values] of medicalResponses) {
        medicalMap.set(patientId, values);
      }
      setPatientById(patientMap);
      setMedicalValuesByPatientId(medicalMap);
    } catch (err) {
      setError(toUserErrorMessage(err, t('coordinations.protocolData.episodePicker.errors.load', 'Failed to load recipient picker data.')));
    } finally {
      setPickerLoading(false);
    }
  };

  const episodePickerModel = useCoordinationEpisodePickerModel({
    episodes: availableRecipientEpisodes.rows,
    patientById,
    medicalValuesByPatientId,
    getOrganLabel,
  });

  const saveValue = async (
    fieldId: number,
    payload: { value?: string; person_ids?: number[]; team_ids?: number[]; episode_id?: number | null },
    slotKeyOverride?: ProcurementSlotKey,
    refreshAssignments?: boolean,
  ) => {
    setSavingFieldId(fieldId);
    try {
      const slotKey = activeOrgan?.slots.find((slot) => slot.slot_key === 'MAIN')?.slot_key
        ?? activeOrgan?.slots[0]?.slot_key
        ?? 'MAIN';
      await withPreservedMainContentScroll(async () => {
        await api.upsertCoordinationProcurementValue(coordinationId, organId, slotKeyOverride ?? slotKey, fieldId, payload);
        await Promise.all([load(), refreshProtocolState()]);
      });
      if (refreshAssignments && onAssignmentsChanged) {
        await onAssignmentsChanged();
      }
    } catch (err) {
      setError(toUserErrorMessage(err, t('coordinations.protocolData.errors.save', 'Failed to save procurement value.')));
    } finally {
      setSavingFieldId((prev) => (prev === fieldId ? null : prev));
    }
  };

  const saveOrganRejection = async (rejected: boolean, comment: string) => {
    setSavingOrganRejection(true);
    try {
      await withPreservedMainContentScroll(async () => {
        await api.upsertCoordinationProcurementOrgan(coordinationId, organId, {
          procurement_surgeon: activeOrgan?.procurement_surgeon ?? '',
          organ_rejected: rejected,
          organ_rejection_comment: comment,
        });
        await Promise.all([load(), refreshProtocolState()]);
      });
      if (!rejected) {
        setWorkflowClearedByOrganId((prev) => ({ ...prev, [organId]: false }));
      }
      if (onAssignmentsChanged) {
        await onAssignmentsChanged();
      }
    } catch (err) {
      setError(toUserErrorMessage(err, t('coordinations.protocolData.errors.save', 'Failed to save procurement value.')));
    } finally {
      setSavingOrganRejection(false);
    }
  };

  const saveOrganRejectionCommentIfChanged = () => {
    const persistedComment = (activeOrgan?.organ_rejection_comment ?? '').trim();
    const nextComment = organRejectionCommentDraft.trim();
    const organRejected = Boolean(activeOrgan?.organ_rejected);
    if (persistedComment === nextComment) {
      return;
    }
    void saveOrganRejection(organRejected, nextComment);
  };
  const clearRejectedOrganWorkflow = async () => {
    const confirmed = window.confirm(
      t(
        'coordinations.protocolData.organRejection.clearWorkflowConfirm',
        'Discard all remaining tasks and mark all open protocol fields as done for this rejected organ?',
      ),
    );
    if (!confirmed) {
      return;
    }
    setClearingOrganWorkflow(true);
    try {
      await withPreservedMainContentScroll(async () => {
        const statuses = await api.listCodes('TASK_STATUS');
        const cancelledStatus = statuses.find((entry) => (entry.key ?? '').toUpperCase() === 'CANCELLED');
        if (!cancelledStatus) {
          throw new Error(t('coordinations.protocolData.organRejection.cancelledStatusMissing', 'Task status CANCELLED is missing.'));
        }
        const taskGroups = await api.listTaskGroups({ coordination_id: coordinationId, organ_id: organId });
        const pendingTasksByGroup = await Promise.all(
          taskGroups.map((group) =>
            api.listTasks({
              task_group_id: group.id,
              status_key: ['PENDING'],
            }),
          ),
        );
        const pendingTasks = pendingTasksByGroup.flat();
        await Promise.all(
          pendingTasks.map((task) =>
            api.updateTask(task.id, { status_id: cancelledStatus.id }),
          ),
        );
        await api.upsertCoordinationProcurementOrgan(coordinationId, organId, {
          procurement_surgeon: activeOrgan?.procurement_surgeon ?? '',
          organ_rejected: true,
          organ_rejection_comment: organRejectionCommentDraft.trim(),
        });
        await Promise.all([load(), refreshProtocolState()]);
      });
      setWorkflowClearedByOrganId((prev) => ({ ...prev, [organId]: true }));
      if (onAssignmentsChanged) {
        await onAssignmentsChanged();
      }
    } catch (err) {
      setError(toUserErrorMessage(err, t('coordinations.protocolData.organRejection.clearWorkflowError', 'Failed to clear rejected organ workflow.')));
    } finally {
      setClearingOrganWorkflow(false);
    }
  };

  if (hideWhenEmpty && groups.length === 0 && !error) {
    return null;
  }

  return (
    <section className={`coord-protocol-data-pane ${gridLayout === 'two-column' ? 'two-column' : ''}`}>
      {error ? <p className="status">{error}</p> : null}
      {groups.map((group) => (
        <section
          key={group.key}
          className={`coord-proc-group-card ${isGroupTouched(group.fields, flex, organId, drafts, Boolean(activeOrgan?.organ_rejected && organWorkflowCleared)) ? 'done' : 'pending'}`}
        >
          <header className="coord-proc-group-header detail-section-heading">
            <h3>{group.name}</h3>
          </header>
          <div className="coord-proc-group-grid">
            {group.fields.map((field) => {
              const valueRow = flex ? resolveValueForField(flex, organId, field.id) : null;
              const stateClass = getFieldStateClass(
                field,
                valueRow,
                drafts,
                Boolean(activeOrgan?.organ_rejected && organWorkflowCleared),
              );
              const isImplantTeamField = field.key === 'IMPLANT_TEAM';
              if (field.value_mode === 'PERSON_SINGLE') {
                const selected = [...(valueRow?.persons ?? [])]
                  .sort((a, b) => a.pos - b.pos)
                  .map((entry) => entry.person)
                  .filter((entry): entry is Person => !!entry)
                  .slice(0, 1);
                return (
                  <div className="detail-field coord-proc-field-wide" key={field.id}>
                    <span className="detail-label">{t(`coordinations.protocolData.fieldsByKey.${field.key}`, field.name_default)}</span>
                    <div className={`coord-protocol-data-control ${stateClass}`}>
                      <PersonMultiSelect
                        selectedPeople={selected}
                        onChange={(next) => {
                          const single = next.slice(0, 1);
                          void saveValue(field.id, { person_ids: single.map((person) => person.id), value: '' });
                        }}
                        disabled={savingFieldId === field.id}
                        disableAdd={selected.length > 0}
                      />
                    </div>
                  </div>
                );
              }
              if (field.value_mode === 'PERSON_LIST') {
                const selected = [...(valueRow?.persons ?? [])]
                  .sort((a, b) => a.pos - b.pos)
                  .map((entry) => entry.person)
                  .filter((entry): entry is Person => !!entry);
                return (
                  <div className="detail-field coord-proc-field-wide" key={field.id}>
                    <span className="detail-label">{t(`coordinations.protocolData.fieldsByKey.${field.key}`, field.name_default)}</span>
                    <div className={`coord-protocol-data-control ${stateClass}`}>
                      <PersonMultiSelect
                        selectedPeople={selected}
                        onChange={(next) => {
                          void saveValue(field.id, { person_ids: next.map((person) => person.id), value: '' });
                        }}
                        disabled={savingFieldId === field.id}
                      />
                    </div>
                  </div>
                );
              }
              if (field.value_mode === 'TEAM_LIST' && !isImplantTeamField) {
                const selectedTeams = [...(valueRow?.teams ?? [])]
                  .sort((a, b) => a.pos - b.pos)
                  .map((entry) => entry.team)
                  .filter((entry): entry is PersonTeam => !!entry);
                const selectedTeamIds = new Set(selectedTeams.map((team) => team.id));
                return (
                  <div className="detail-field coord-proc-field-wide" key={field.id}>
                    <span className="detail-label">{t(`coordinations.protocolData.fieldsByKey.${field.key}`, field.name_default)}</span>
                    <div className={`coord-proc-team-picker coord-protocol-data-control ${stateClass}`}>
                      <div className="person-pill-list">
                        {selectedTeams.length === 0 ? (
                          <span className="detail-value">{t('common.emptySymbol', '–')}</span>
                        ) : (
                          selectedTeams.map((team) => (
                            <span key={team.id} className="person-pill">
                              {team.name}
                              <button
                                type="button"
                                className="person-pill-remove"
                                onClick={() => {
                                  const nextIds = selectedTeams.filter((entry) => entry.id !== team.id).map((entry) => entry.id);
                                  void saveValue(field.id, { team_ids: nextIds, value: '' });
                                }}
                                disabled={savingFieldId === field.id}
                                title={t('actions.remove', 'Remove')}
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                      <select
                        className="detail-input"
                        defaultValue=""
                        onChange={(event) => {
                          const nextId = Number(event.target.value);
                          if (!nextId || selectedTeamIds.has(nextId)) return;
                          const nextIds = [...selectedTeams.map((team) => team.id), nextId];
                          void saveValue(field.id, { team_ids: nextIds, value: '' });
                          event.currentTarget.value = '';
                        }}
                        disabled={savingFieldId === field.id}
                      >
                        <option value="">{t('coordinations.protocolData.team.addTeam', 'Add team...')}</option>
                        {teams
                          .filter((team) => !selectedTeamIds.has(team.id))
                          .map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                );
              }
              if (field.value_mode === 'TEAM_SINGLE' || isImplantTeamField) {
                const selectedTeams = [...(valueRow?.teams ?? [])]
                  .sort((a, b) => a.pos - b.pos)
                  .map((entry) => entry.team)
                  .filter((entry): entry is PersonTeam => !!entry)
                  .slice(0, 1);
                const selectedTeamIds = new Set(selectedTeams.map((team) => team.id));
                return (
                  <div className="detail-field coord-proc-field-wide" key={field.id}>
                    <span className="detail-label">{t(`coordinations.protocolData.fieldsByKey.${field.key}`, field.name_default)}</span>
                    <div className={`coord-proc-team-picker coord-protocol-data-control ${stateClass}`}>
                      <div className="person-pill-list">
                        {selectedTeams.length === 0 ? (
                          <span className="detail-value">{t('common.emptySymbol', '–')}</span>
                        ) : (
                          selectedTeams.map((team) => (
                            <span key={team.id} className="person-pill">
                              {team.name}
                              <button
                                type="button"
                                className="person-pill-remove"
                                onClick={() => {
                                  void saveValue(field.id, { team_ids: [], value: '' });
                                }}
                                disabled={savingFieldId === field.id}
                                title={t('actions.remove', 'Remove')}
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                      <select
                        className="detail-input"
                        value=""
                        onChange={(event) => {
                          const nextId = Number(event.target.value);
                          if (!nextId) return;
                          void saveValue(field.id, { team_ids: [nextId], value: '' });
                        }}
                        disabled={savingFieldId === field.id}
                      >
                        <option value="">{t('coordinations.protocolData.team.selectTeam', 'Select team...')}</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id} disabled={selectedTeamIds.has(team.id)}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              }
              if (field.value_mode === 'EPISODE') {
                const normalizedOrganKey = ((organKey ?? activeOrgan?.organ?.key ?? '') || '').trim().toUpperCase();
                const organRejected = activeProtocolOrgan?.organ_rejected ?? Boolean(activeOrgan?.organ_rejected);
                const slotOptions: ProcurementSlotKey[] = DUAL_RECIPIENT_ORGAN_KEYS.has(normalizedOrganKey)
                  ? ['MAIN', 'LEFT', 'RIGHT']
                  : ['MAIN'];
                const linkedAssignmentsForOrgan = activeProtocolOrgan?.slots ?? [];
                const labelBySlot: Record<ProcurementSlotKey, string> = {
                  MAIN: t('admin.procurementConfig.slot.main', 'MAIN'),
                  LEFT: t('admin.procurementConfig.slot.left', 'LEFT'),
                  RIGHT: t('admin.procurementConfig.slot.right', 'RIGHT'),
                };
                const slotEntries = slotOptions.map((slotKey, index) => {
                  const slotValue = resolveValueForFieldInSlot(flex, organId, slotKey, field.id);
                  const linkedEpisode = linkedAssignmentsForOrgan[index] ?? null;
                  const selectedEpisodeId = slotValue?.episode_ref?.episode_id ?? linkedEpisode?.episode_id ?? 0;
                  const selectedEpisode = availableRecipientEpisodes.rows.find((episode) => episode.id === selectedEpisodeId)
                    ?? (linkedEpisode ? {
                      id: linkedEpisode.episode_id ?? 0,
                      patient_id: linkedEpisode.patient_id ?? 0,
                      fall_nr: linkedEpisode.episode_fall_nr ?? '',
                      tpl_date: null,
                      list_rs_nr: '',
                    } : null)
                    ?? null;
                  const selectedEpisodeFromValue = slotValue?.episode_ref?.episode ?? null;
                  const selectedEpisodeRow = episodePickerModel.rows.find((entry) => entry.episodeId === selectedEpisodeId) ?? null;
                  const selectedPatient = (selectedEpisode?.patient_id != null ? patientById.get(selectedEpisode.patient_id) : null)
                    ?? (selectedEpisodeFromValue?.patient_id != null ? patientById.get(selectedEpisodeFromValue.patient_id) : null)
                    ?? (linkedEpisode?.patient_id != null ? patientById.get(linkedEpisode.patient_id) : null)
                    ?? null;
                  const selectedPatientName = selectedEpisodeRow?.patientName
                    || linkedEpisode?.recipient_name
                    || (selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.name}`.trim() : '');
                  const selectedEpisodeLabel = selectedEpisodeId > 0
                    ? formatDefaultEpisodeReference({
                      episodeId: selectedEpisodeId,
                      episodeCaseNumber: selectedEpisode?.fall_nr ?? linkedEpisode?.episode_fall_nr ?? selectedEpisodeFromValue?.fall_nr ?? null,
                      patientFullName: selectedPatientName,
                      patientBirthDate: selectedEpisodeRow?.patientDateOfBirth ?? linkedEpisode?.patient_birth_date ?? selectedPatient?.date_of_birth ?? null,
                      patientPid: selectedEpisodeRow?.patientPid ?? linkedEpisode?.patient_pid ?? selectedPatient?.pid ?? null,
                      emptySymbol: t('common.emptySymbol', '–'),
                    })
                    : t('coordinations.protocolData.episode.noneSelected', 'No recipient episode selected');
                  return { slotKey, selectedEpisodeId, selectedEpisodeLabel };
                });
                const selectedCount = slotEntries.filter((entry) => entry.selectedEpisodeId > 0).length;
                const recipientStateClass = organRejected
                  ? 'committed'
                  : selectedCount > 0
                    ? 'committed'
                    : 'pending';
                return (
                  <div className="detail-field coord-proc-field-wide" key={field.id}>
                    <span className="detail-label">{t(`coordinations.protocolData.fieldsByKey.${field.key}`, field.name_default)}</span>
                    <div className={`coord-protocol-episode-control ${recipientStateClass}`}>
                      <div className="coord-organ-rejection-box">
                        <label className="coord-organ-rejection-toggle">
                          <input
                            type="checkbox"
                            checked={organRejected}
                            disabled={savingOrganRejection}
                            onChange={(event) => {
                              const nextRejected = event.target.checked;
                              void saveOrganRejection(nextRejected, organRejectionCommentDraft.trim());
                            }}
                          />
                          <span>{t('coordinations.protocolData.organRejection.toggle', 'Organ rejected')}</span>
                        </label>
                        <div className="coord-organ-rejection-comment-row">
                          <input
                            type="text"
                            className="detail-input"
                            value={organRejectionCommentDraft}
                            placeholder={t('coordinations.protocolData.organRejection.commentPlaceholder', 'Reason for rejection')}
                            disabled={savingOrganRejection}
                            onChange={(event) => setOrganRejectionCommentDraft(event.target.value)}
                            onBlur={saveOrganRejectionCommentIfChanged}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                saveOrganRejectionCommentIfChanged();
                              }
                            }}
                          />
                        </div>
                        {organRejected ? (
                          <div className="coord-organ-rejection-clear-row">
                            <button
                              type="button"
                              className="patients-cancel-btn coord-organ-clear-workflow-btn"
                              disabled={clearingOrganWorkflow || savingOrganRejection}
                              onClick={() => {
                                void clearRejectedOrganWorkflow();
                              }}
                              title={t(
                                'coordinations.protocolData.organRejection.clearWorkflowTitle',
                                'Discard remaining tasks and force all open protocol fields to done for this rejected organ.',
                              )}
                            >
                              {clearingOrganWorkflow
                                ? t('coordinations.protocolData.organRejection.clearingWorkflow', 'Clearing...')
                                : organWorkflowCleared
                                  ? t('coordinations.protocolData.organRejection.workflowCleared', 'Workflow cleared')
                                  : t('coordinations.protocolData.organRejection.clearWorkflowButton', 'Clear organ workflow')}
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {slotEntries.map((entry) => (
                        <div className="coord-episode-select-row" key={entry.slotKey}>
                          <div className="person-pill-list">
                            {entry.selectedEpisodeId > 0 ? (
                              <span className="person-pill coord-protocol-recipient-pill">{`${labelBySlot[entry.slotKey]}: ${entry.selectedEpisodeLabel}`}</span>
                            ) : (
                              <span className="detail-value">{`${labelBySlot[entry.slotKey]}: ${entry.selectedEpisodeLabel}`}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="patients-save-btn coord-episode-select-open-btn"
                            onClick={() => {
                              setSelectingEpisode({ fieldId: field.id, slotKey: entry.slotKey });
                              void loadPickerData();
                            }}
                            disabled={organRejected || savingFieldId === field.id || (entry.selectedEpisodeId <= 0 && selectedCount >= 2 && DUAL_RECIPIENT_ORGAN_KEYS.has(normalizedOrganKey))}
                          >
                            {t('coordinations.protocolData.episode.openPicker', 'Open picker')}
                          </button>
                          {entry.selectedEpisodeId > 0 ? (
                            <button
                              type="button"
                              className="patients-cancel-btn"
                              onClick={() => {
                                  void saveValue(field.id, { episode_id: null, value: '', person_ids: [], team_ids: [] }, entry.slotKey, true);
                              }}
                              disabled={organRejected || savingFieldId === field.id}
                            >
                              {t('coordinations.protocolData.episode.clearSelection', 'Clear')}
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              const cfg = getConfigFromMetadata(null, field.datatype_definition);
              const isTimestampField = field.key.endsWith('_TIME') || FORCED_DATETIME_FIELD_KEYS.has(field.key);
              const draftValue = drafts[field.id] ?? valueRow?.value ?? '';
              const isBooleanField = !isTimestampField && (cfg.inputType === 'boolean' || FORCED_BOOLEAN_FIELD_KEYS.has(field.key));
              if (isBooleanField) {
                return (
                  <div className="detail-field" key={field.id}>
                    <span className="detail-label">{t(`coordinations.protocolData.fieldsByKey.${field.key}`, field.name_default)}</span>
                    <div className={`coord-protocol-data-control coord-protocol-boolean-control ${stateClass}`}>
                      <select
                        className="detail-input"
                        value={draftValue}
                        disabled={savingFieldId === field.id}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setDrafts((prev) => ({ ...prev, [field.id]: nextValue }));
                          if ((valueRow?.value ?? '') === nextValue) return;
                          void saveValue(field.id, { value: nextValue, person_ids: [], team_ids: [] });
                        }}
                      >
                        <option value="">{t('common.notSet', 'Not set')}</option>
                        <option value="true">{t('common.yes', 'Yes')}</option>
                        <option value="false">{t('common.no', 'No')}</option>
                      </select>
                    </div>
                  </div>
                );
              }
              const inputType = isTimestampField
                ? 'datetime-local'
                : cfg.inputType === 'number'
                ? 'number'
                : cfg.inputType === 'date'
                  ? 'date'
                  : cfg.inputType === 'datetime'
                    ? 'datetime-local'
                    : 'text';
              return (
                <div className="detail-field" key={field.id}>
                  <span className="detail-label">{t(`coordinations.protocolData.fieldsByKey.${field.key}`, field.name_default)}</span>
                  <input
                    type={inputType}
                    className={`detail-input coord-protocol-data-input ${stateClass}`}
                    value={draftValue}
                    step={cfg.step}
                    placeholder={cfg.placeholder}
                    onChange={(event) => setDrafts((prev) => ({ ...prev, [field.id]: event.target.value }))}
                    onBlur={() => {
                      if ((valueRow?.value ?? '') === draftValue) return;
                      void saveValue(field.id, { value: draftValue, person_ids: [], team_ids: [] });
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <div className="coord-protocol-data-separator" aria-hidden="true" />
      <CoordinationEpisodePickerDialog
        open={selectingEpisode !== null}
        loading={pickerLoading}
        organLabel={activeOrganLabel}
        rows={episodePickerModel.rows}
        basicColumns={episodePickerModel.basicColumns}
        detailColumns={episodePickerModel.detailColumns}
        selectedEpisodeId={selectedFieldCurrentEpisodeId}
        onClose={() => setSelectingEpisode(null)}
        onSelect={(episodeId) => {
          if (!selectingEpisode) return;
          setSelectingEpisode(null);
          void saveValue(
            selectingEpisode.fieldId,
            { episode_id: episodeId, value: '', person_ids: [], team_ids: [] },
            selectingEpisode.slotKey,
            true,
          );
        }}
      />
    </section>
  );
}

function resolveValueForField(
  flex: CoordinationProcurementFlex,
  organId: number,
  fieldTemplateId: number,
): CoordinationProcurementValue | null {
  const organ = flex.organs.find((entry) => entry.organ_id === organId);
  if (!organ) return null;
  for (const slot of organ.slots) {
    const found = slot.values.find((value) => value.field_template_id === fieldTemplateId);
    if (found) return found;
  }
  return null;
}

function resolveValueForFieldInSlot(
  flex: CoordinationProcurementFlex | null,
  organId: number,
  slotKey: ProcurementSlotKey,
  fieldTemplateId: number,
): CoordinationProcurementValue | null {
  if (!flex) return null;
  const organ = flex.organs.find((entry) => entry.organ_id === organId);
  if (!organ) return null;
  const slot = organ.slots.find((entry) => entry.slot_key === slotKey);
  if (!slot) return null;
  return slot.values.find((value) => value.field_template_id === fieldTemplateId) ?? null;
}

function getFieldStateClass(
  field: CoordinationProcurementFlex['field_templates'][number],
  valueRow: CoordinationProcurementValue | null,
  drafts: DraftsByField,
  forceCommitted: boolean,
): 'pending' | 'committed' | 'editing' {
  if (forceCommitted) {
    return 'committed';
  }
  if (field.value_mode === 'PERSON_SINGLE' || field.value_mode === 'PERSON_LIST') {
    return (valueRow?.persons?.length ?? 0) > 0 ? 'committed' : 'pending';
  }
  if (field.value_mode === 'TEAM_SINGLE' || field.value_mode === 'TEAM_LIST') {
    return (valueRow?.teams?.length ?? 0) > 0 ? 'committed' : 'pending';
  }
  if (field.value_mode === 'EPISODE') {
    return valueRow?.episode_ref?.episode_id ? 'committed' : 'pending';
  }
  const draftValue = drafts[field.id] ?? valueRow?.value ?? '';
  const committed = (valueRow?.value ?? '').trim().length > 0;
  return committed ? 'committed' : draftValue.trim().length === 0 ? 'pending' : 'editing';
}

function isGroupTouched(
  fields: CoordinationProcurementFlex['field_templates'],
  flex: CoordinationProcurementFlex | null,
  organId: number,
  drafts: DraftsByField,
  forceCommitted: boolean,
): boolean {
  if (forceCommitted) {
    return true;
  }
  if (!flex) return false;
  return fields.every((field) => {
    const valueRow = resolveValueForField(flex, organId, field.id);
    if (field.value_mode === 'PERSON_SINGLE') {
      return (valueRow?.persons?.length ?? 0) > 0;
    }
    if (field.value_mode === 'PERSON_LIST') {
      return (valueRow?.persons?.length ?? 0) > 0;
    }
    if (field.value_mode === 'TEAM_LIST') {
      return (valueRow?.teams?.length ?? 0) > 0;
    }
    if (field.value_mode === 'TEAM_SINGLE') {
      return (valueRow?.teams?.length ?? 0) > 0;
    }
    if (field.value_mode === 'EPISODE') {
      return !!valueRow?.episode_ref?.episode_id;
    }
    const draftValue = drafts[field.id] ?? valueRow?.value ?? '';
    return draftValue.trim().length > 0;
  });
}
