import { useEffect, useMemo, useState } from 'react';
import { api, type CoordinationEpisode, type CoordinationProcurementFlex, type CoordinationProcurementValue, type Person, type PersonTeam } from '../../../api';
import { toUserErrorMessage } from '../../../api/error';
import { getConfigFromMetadata } from '../../../utils/datatypeFramework';
import PersonMultiSelect from '../../layout/PersonMultiSelect';

interface CoordinationProtocolDataPanelProps {
  coordinationId: number;
  organId: number;
}

type DraftsByField = Record<number, string>;

export default function CoordinationProtocolDataPanel({ coordinationId, organId }: CoordinationProtocolDataPanelProps) {
  const [flex, setFlex] = useState<CoordinationProcurementFlex | null>(null);
  const [teams, setTeams] = useState<PersonTeam[]>([]);
  const [coordinationEpisodes, setCoordinationEpisodes] = useState<CoordinationEpisode[]>([]);
  const [drafts, setDrafts] = useState<DraftsByField>({});
  const [savingFieldId, setSavingFieldId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const [loadedFlex, loadedTeams, loadedEpisodes] = await Promise.all([
        api.getCoordinationProcurementFlex(coordinationId),
        api.listTeams(),
        api.listCoordinationEpisodes(coordinationId),
      ]);
      setFlex(loadedFlex);
      setTeams(loadedTeams);
      setCoordinationEpisodes(loadedEpisodes);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const field of loadedFlex.field_templates) {
          if (next[field.id] === undefined) {
            const value = resolveValueForField(loadedFlex, organId, field.id);
            next[field.id] = value?.value ?? '';
          }
        }
        return next;
      });
    } catch (err) {
      setError(toUserErrorMessage(err, 'Failed to load grouped procurement values.'));
    }
  };

  useEffect(() => {
    void load();
  }, [coordinationId, organId]);

  const activeOrgan = useMemo(
    () => flex?.organs.find((entry) => entry.organ_id === organId) ?? null,
    [flex, organId],
  );

  const groups = useMemo(() => {
    if (!flex) return [];
    const groupsById = new Map(flex.field_group_templates.map((group) => [group.id, group]));
    return [...flex.field_templates]
      .sort((a, b) => {
        const ga = a.group_template_id ? groupsById.get(a.group_template_id)?.pos ?? 999 : 999;
        const gb = b.group_template_id ? groupsById.get(b.group_template_id)?.pos ?? 999 : 999;
        return ga - gb || a.pos - b.pos || a.id - b.id;
      })
      .reduce<Array<{ key: string; name: string; fields: CoordinationProcurementFlex['field_templates'] }>>((acc, field) => {
        const groupId = field.group_template_id;
        const group = groupId ? groupsById.get(groupId) : null;
        const key = group?.key ?? 'UNGROUPED';
        const existing = acc.find((item) => item.key === key);
        if (existing) {
          existing.fields.push(field);
          return acc;
        }
        return [...acc, { key, name: group?.name_default ?? 'Other', fields: [field] }];
      }, []);
  }, [flex]);

  const saveValue = async (
    fieldId: number,
    payload: { value?: string; person_ids?: number[]; team_ids?: number[]; episode_id?: number | null },
  ) => {
    setSavingFieldId(fieldId);
    try {
      const slotKey = activeOrgan?.slots.find((slot) => slot.slot_key === 'MAIN')?.slot_key
        ?? activeOrgan?.slots[0]?.slot_key
        ?? 'MAIN';
      await api.upsertCoordinationProcurementValue(coordinationId, organId, slotKey, fieldId, payload);
      await load();
    } catch (err) {
      setError(toUserErrorMessage(err, 'Failed to save procurement value.'));
    } finally {
      setSavingFieldId((prev) => (prev === fieldId ? null : prev));
    }
  };

  return (
    <section className="coord-protocol-data-pane">
      {error ? <p className="status">{error}</p> : null}
      {groups.map((group) => (
        <section
          key={group.key}
          className={`coord-proc-group-card ${isGroupTouched(group.fields, flex, organId, drafts) ? 'done' : 'pending'}`}
        >
          <header className="coord-proc-group-header">
            <h4>{group.name}</h4>
          </header>
          <div className="coord-proc-group-grid">
            {group.fields.map((field) => {
              const valueRow = flex ? resolveValueForField(flex, organId, field.id) : null;
              if (field.value_mode === 'PERSON_SINGLE') {
                const selected = [...(valueRow?.persons ?? [])]
                  .sort((a, b) => a.pos - b.pos)
                  .map((entry) => entry.person)
                  .filter((entry): entry is Person => !!entry)
                  .slice(0, 1);
                return (
                  <div className="detail-field coord-proc-field-wide" key={field.id}>
                    <span className="detail-label">{field.name_default}</span>
                    <PersonMultiSelect
                      selectedPeople={selected}
                      onChange={(next) => {
                        const single = next.slice(0, 1);
                        void saveValue(field.id, { person_ids: single.map((person) => person.id), value: '' });
                      }}
                      disabled={savingFieldId === field.id}
                    />
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
                    <span className="detail-label">{field.name_default}</span>
                    <PersonMultiSelect
                      selectedPeople={selected}
                      onChange={(next) => {
                        void saveValue(field.id, { person_ids: next.map((person) => person.id), value: '' });
                      }}
                      disabled={savingFieldId === field.id}
                    />
                  </div>
                );
              }
              if (field.value_mode === 'TEAM_LIST') {
                const selectedTeams = [...(valueRow?.teams ?? [])]
                  .sort((a, b) => a.pos - b.pos)
                  .map((entry) => entry.team)
                  .filter((entry): entry is PersonTeam => !!entry);
                const selectedTeamIds = new Set(selectedTeams.map((team) => team.id));
                return (
                  <div className="detail-field coord-proc-field-wide" key={field.id}>
                    <span className="detail-label">{field.name_default}</span>
                    <div className="coord-proc-team-picker">
                      <div className="person-pill-list">
                        {selectedTeams.length === 0 ? (
                          <span className="detail-value">–</span>
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
                                title="Remove"
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
                        <option value="">Add team...</option>
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
              if (field.value_mode === 'TEAM_SINGLE') {
                const selectedTeams = [...(valueRow?.teams ?? [])]
                  .sort((a, b) => a.pos - b.pos)
                  .map((entry) => entry.team)
                  .filter((entry): entry is PersonTeam => !!entry)
                  .slice(0, 1);
                const selectedTeamIds = new Set(selectedTeams.map((team) => team.id));
                return (
                  <div className="detail-field coord-proc-field-wide" key={field.id}>
                    <span className="detail-label">{field.name_default}</span>
                    <div className="coord-proc-team-picker">
                      <div className="person-pill-list">
                        {selectedTeams.length === 0 ? (
                          <span className="detail-value">–</span>
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
                                title="Remove"
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
                        <option value="">Select team...</option>
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
                const availableEpisodes = coordinationEpisodes
                  .filter((entry) => entry.organ_id === organId)
                  .map((entry) => entry.episode)
                  .filter((entry): entry is NonNullable<CoordinationEpisode['episode']> => !!entry);
                const selectedEpisodeId = valueRow?.episode_ref?.episode_id ?? 0;
                return (
                  <div className="detail-field coord-proc-field-wide" key={field.id}>
                    <span className="detail-label">{field.name_default}</span>
                    <select
                      className="detail-input"
                      value={selectedEpisodeId}
                      onChange={(event) => {
                        const nextEpisodeId = Number(event.target.value) || null;
                        void saveValue(field.id, { episode_id: nextEpisodeId, value: '', person_ids: [], team_ids: [] });
                      }}
                      disabled={savingFieldId === field.id}
                    >
                      <option value={0}>Select recipient episode...</option>
                      {availableEpisodes.map((episode) => (
                        <option key={episode.id} value={episode.id}>
                          {episode.fall_nr || `Episode ${episode.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              const cfg = getConfigFromMetadata(null, field.datatype_definition);
              const draftValue = drafts[field.id] ?? valueRow?.value ?? '';
              const inputType = cfg.inputType === 'number'
                ? 'number'
                : cfg.inputType === 'date'
                  ? 'date'
                  : cfg.inputType === 'datetime'
                    ? 'datetime-local'
                    : 'text';
              const committed = (valueRow?.value ?? '').trim().length > 0;
              const stateClass = committed ? 'committed' : draftValue.trim().length === 0 ? 'pending' : 'editing';
              return (
                <div className="detail-field" key={field.id}>
                  <span className="detail-label">{field.name_default}</span>
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

function isGroupTouched(
  fields: CoordinationProcurementFlex['field_templates'],
  flex: CoordinationProcurementFlex | null,
  organId: number,
  drafts: DraftsByField,
): boolean {
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
