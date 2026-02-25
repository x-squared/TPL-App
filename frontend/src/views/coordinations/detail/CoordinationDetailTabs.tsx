import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { Code, Coordination, CoordinationDonor, CoordinationEpisode, CoordinationOrigin, Patient } from '../../../api';
import EditableSectionHeader from '../../layout/EditableSectionHeader';
import InlineDeleteActions from '../../layout/InlineDeleteActions';
import { formatDateDdMmYyyy, formatDateTimeDdMmYyyy } from '../../layout/dateFormat';
import type { CoordinationDetailTab } from './useCoordinationDetailViewModel';

interface UserOption {
  id: number;
  name: string;
}

interface TimeLogRow {
  id: number;
  user_id: number;
  user: { id: number; name: string } | null;
  start: string | null;
  end: string | null;
  comment: string;
}

interface TimeLogDraft {
  user_id: number;
  start: string;
  end: string;
  comment: string;
}

interface Props {
  tab: CoordinationDetailTab;
  setTab: (tab: CoordinationDetailTab) => void;
  coordination: Coordination;
  donor: CoordinationDonor | null;
  origin: CoordinationOrigin | null;
  coordinationEpisodes: CoordinationEpisode[];
  patientsById: Record<number, Patient>;
  organCodes: Code[];
  deathKinds: Code[];
  sexCodes: Code[];
  bloodTypes: Code[];
  diagnosisDonorOptions: Code[];
  hospitals: Code[];
  running: boolean;
  elapsedSec: number;
  stopDraftOpen: boolean;
  stopComment: string;
  setStopComment: (value: string) => void;
  onStartClock: () => void;
  onRequestStopClock: () => void;
  onCancelStopClock: () => void;
  onSaveStopClock: () => void;
  timeLogs: TimeLogRow[];
  users: UserOption[];
  addingLog: boolean;
  editingLogId: number | null;
  logDraft: TimeLogDraft;
  setLogDraft: React.Dispatch<React.SetStateAction<TimeLogDraft>>;
  logError: string;
  onOpenAddLog: () => void;
  onOpenEditLog: (log: TimeLogRow) => void;
  onCloseLogEditor: () => void;
  onSaveLogDraft: () => void;
  onDeleteLog: (id: number) => void;
  onSaveCoordination: (patch: Partial<Coordination>) => Promise<void>;
  onSaveDonor: (patch: Partial<CoordinationDonor>) => Promise<void>;
  onSaveOrigin: (patch: Partial<CoordinationOrigin>) => Promise<void>;
  onOpenPatientEpisode: (patientId: number, episodeId: number) => void;
}

const formatElapsed = (sec: number): string => {
  const h = Math.floor(sec / 3600).toString().padStart(2, '0');
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const toInputDate = (value: string | null | undefined): string => (value ? value.slice(0, 10) : '');

const fmtDateTime = (value: string | null): string => {
  return formatDateTimeDdMmYyyy(value);
};

export default function CoordinationDetailTabs({
  tab,
  setTab,
  coordination,
  donor,
  origin,
  coordinationEpisodes,
  patientsById,
  organCodes,
  deathKinds,
  sexCodes,
  bloodTypes,
  diagnosisDonorOptions,
  hospitals,
  running,
  elapsedSec,
  stopDraftOpen,
  stopComment,
  setStopComment,
  onStartClock,
  onRequestStopClock,
  onCancelStopClock,
  onSaveStopClock,
  timeLogs,
  users,
  addingLog,
  editingLogId,
  logDraft,
  setLogDraft,
  logError,
  onOpenAddLog,
  onOpenEditLog,
  onCloseLogEditor,
  onSaveLogDraft,
  onDeleteLog,
  onSaveCoordination,
  onSaveDonor,
  onSaveOrigin,
  onOpenPatientEpisode,
}: Props) {
  const initialCoreDraft = useMemo(
    () => ({
      start: toInputDate(coordination.start),
      end: toInputDate(coordination.end),
      swtpl_nr: coordination.swtpl_nr ?? '',
      national_coordinator: coordination.national_coordinator ?? '',
      comment: coordination.comment ?? '',
    }),
    [coordination.comment, coordination.end, coordination.national_coordinator, coordination.start, coordination.swtpl_nr],
  );
  const [coreDraft, setCoreDraft] = useState({
    start: toInputDate(coordination.start),
    end: toInputDate(coordination.end),
    swtpl_nr: coordination.swtpl_nr ?? '',
    national_coordinator: coordination.national_coordinator ?? '',
    comment: coordination.comment ?? '',
  });
  const [coreEditing, setCoreEditing] = useState(false);
  const [coreSaving, setCoreSaving] = useState(false);
  const [coreError, setCoreError] = useState('');

  const initialDonorDraft = useMemo(
    () => ({
      full_name: donor?.full_name ?? '',
      birth_date: toInputDate(donor?.birth_date),
      sex_id: donor?.sex_id ?? null,
      blood_type_id: donor?.blood_type_id ?? null,
      height: donor?.height ?? null,
      weight: donor?.weight ?? null,
      organ_fo: donor?.organ_fo ?? '',
      diagnosis_id: donor?.diagnosis_id ?? null,
      death_kind_id: donor?.death_kind_id ?? 0,
    }),
    [
      donor?.birth_date,
      donor?.blood_type_id,
      donor?.death_kind_id,
      donor?.diagnosis_id,
      donor?.full_name,
      donor?.height,
      donor?.organ_fo,
      donor?.sex_id,
      donor?.weight,
    ],
  );
  const [donorDraft, setDonorDraft] = useState({
    full_name: donor?.full_name ?? '',
    birth_date: toInputDate(donor?.birth_date),
    sex_id: donor?.sex_id ?? null as number | null,
    blood_type_id: donor?.blood_type_id ?? null as number | null,
    height: donor?.height ?? null as number | null,
    weight: donor?.weight ?? null as number | null,
    organ_fo: donor?.organ_fo ?? '',
    diagnosis_id: donor?.diagnosis_id ?? null as number | null,
    death_kind_id: donor?.death_kind_id ?? 0,
  });
  const [donorEditing, setDonorEditing] = useState(false);
  const [donorSaving, setDonorSaving] = useState(false);
  const [donorError, setDonorError] = useState('');

  const initialOriginDraft = useMemo(
    () => ({
      detection_hospital_id: origin?.detection_hospital_id ?? 0,
      procurement_hospital_id: origin?.procurement_hospital_id ?? 0,
    }),
    [origin?.detection_hospital_id, origin?.procurement_hospital_id],
  );
  const [originDraft, setOriginDraft] = useState({
    detection_hospital_id: origin?.detection_hospital_id ?? 0,
    procurement_hospital_id: origin?.procurement_hospital_id ?? 0,
  });
  const [originEditing, setOriginEditing] = useState(false);
  const [originSaving, setOriginSaving] = useState(false);
  const [originError, setOriginError] = useState('');
  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState<number | null>(null);

  useEffect(() => {
    if (!coreEditing) setCoreDraft(initialCoreDraft);
  }, [coreEditing, initialCoreDraft]);

  useEffect(() => {
    if (!donorEditing) setDonorDraft(initialDonorDraft);
  }, [donorEditing, initialDonorDraft]);

  useEffect(() => {
    if (!originEditing) setOriginDraft(initialOriginDraft);
  }, [initialOriginDraft, originEditing]);

  const coreDirty =
    coreDraft.start !== initialCoreDraft.start
    || coreDraft.end !== initialCoreDraft.end
    || coreDraft.swtpl_nr !== initialCoreDraft.swtpl_nr
    || coreDraft.national_coordinator !== initialCoreDraft.national_coordinator
    || coreDraft.comment !== initialCoreDraft.comment;
  const donorDirty =
    donorDraft.full_name !== initialDonorDraft.full_name
    || donorDraft.birth_date !== initialDonorDraft.birth_date
    || donorDraft.sex_id !== initialDonorDraft.sex_id
    || donorDraft.blood_type_id !== initialDonorDraft.blood_type_id
    || donorDraft.height !== initialDonorDraft.height
    || donorDraft.weight !== initialDonorDraft.weight
    || donorDraft.organ_fo !== initialDonorDraft.organ_fo
    || donorDraft.diagnosis_id !== initialDonorDraft.diagnosis_id
    || donorDraft.death_kind_id !== initialDonorDraft.death_kind_id;
  const originDirty =
    originDraft.detection_hospital_id !== initialOriginDraft.detection_hospital_id
    || originDraft.procurement_hospital_id !== initialOriginDraft.procurement_hospital_id;

  const handleSaveCore = async () => {
    try {
      setCoreSaving(true);
      setCoreError('');
      await onSaveCoordination({
        start: coreDraft.start ? `${coreDraft.start}T00:00:00.000Z` : null,
        end: coreDraft.end ? `${coreDraft.end}T00:00:00.000Z` : null,
        swtpl_nr: coreDraft.swtpl_nr,
        national_coordinator: coreDraft.national_coordinator,
        comment: coreDraft.comment,
      });
      setCoreEditing(false);
    } catch (err) {
      setCoreError(err instanceof Error ? err.message : 'Failed to save basic data');
    } finally {
      setCoreSaving(false);
    }
  };

  const handleSaveDonor = async () => {
    try {
      setDonorSaving(true);
      setDonorError('');
      await onSaveDonor({
        full_name: donorDraft.full_name,
        birth_date: donorDraft.birth_date ? `${donorDraft.birth_date}` : null,
        sex_id: donorDraft.sex_id,
        blood_type_id: donorDraft.blood_type_id,
        height: donorDraft.height,
        weight: donorDraft.weight,
        organ_fo: donorDraft.organ_fo,
        diagnosis_id: donorDraft.diagnosis_id,
        death_kind_id: donorDraft.death_kind_id || null,
      });
      setDonorEditing(false);
    } catch (err) {
      setDonorError(err instanceof Error ? err.message : 'Failed to save donor data');
    } finally {
      setDonorSaving(false);
    }
  };

  const handleSaveOrigin = async () => {
    try {
      setOriginSaving(true);
      setOriginError('');
      await onSaveOrigin({
        detection_hospital_id: originDraft.detection_hospital_id || null,
        procurement_hospital_id: originDraft.procurement_hospital_id || null,
      });
      setOriginEditing(false);
    } catch (err) {
      setOriginError(err instanceof Error ? err.message : 'Failed to save hospitals');
    } finally {
      setOriginSaving(false);
    }
  };

  const hasEditorOpen = addingLog || editingLogId !== null;
  const totalsByUser = useMemo(() => {
    const totals = new Map<string, number>();
    for (const log of timeLogs) {
      if (!log.start || !log.end) continue;
      const start = new Date(log.start).getTime();
      const end = new Date(log.end).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue;
      const key = log.user?.name ?? `#${log.user_id}`;
      totals.set(key, (totals.get(key) ?? 0) + Math.floor((end - start) / 1000));
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [timeLogs]);

  const protocolEntriesByOrgan = useMemo(() => {
    const sortedOrgans = [...organCodes].sort((a, b) => a.pos - b.pos || a.name_default.localeCompare(b.name_default));
    return sortedOrgans.map((organ) => {
      const entries = coordinationEpisodes
        .filter((item) => item.organ_id === organ.id)
        .map((item) => {
          const patientId = item.episode?.patient_id;
          const patient = typeof patientId === 'number' ? patientsById[patientId] : undefined;
          const recipientName = patient
            ? `${patient.first_name ?? ''} ${patient.name ?? ''}`.trim() || '–'
            : '–';
          const mainDiagnosis = patient?.diagnoses?.[0]?.catalogue?.name_default ?? '–';
          return {
            id: item.id,
            patientId: item.episode?.patient_id ?? null,
            episodeId: item.episode_id,
            recipientName,
            fallNr: item.episode?.fall_nr || '–',
            birthDate: formatDateDdMmYyyy(patient?.date_of_birth),
            mainDiagnosis,
            rsNr: item.episode?.list_rs_nr || '–',
            tplDate: formatDateDdMmYyyy(item.tpl_date ?? item.episode?.tpl_date),
            procurementTeam: item.procurement_team || '–',
            perfusionDone: item.exvivo_perfusion_done,
            perfusionApplied: item.exvivo_perfusion_done ? 'Yes' : 'No',
          };
        });
      return { organ, entries };
    });
  }, [coordinationEpisodes, organCodes, patientsById]);

  const section = (() => {
    if (tab === 'coordination') {
      return (
        <>
          <section className="detail-section ui-panel-section">
            <EditableSectionHeader
              title="Basic data"
              editing={coreEditing}
              saving={coreSaving}
              dirty={coreDirty}
              onEdit={() => {
                setCoreError('');
                setCoreEditing(true);
              }}
              onSave={() => {
                void handleSaveCore();
              }}
              onCancel={() => {
                setCoreEditing(false);
                setCoreError('');
                setCoreDraft(initialCoreDraft);
              }}
            />
            <div className="detail-grid">
              <div className="detail-field">
                <span className="detail-label">Status</span>
                <span className="detail-value">{coordination.status?.name_default ?? '–'}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Start</span>
                {coreEditing ? (
                  <input
                    className="detail-input"
                    type="date"
                    value={coreDraft.start}
                    onChange={(e) => setCoreDraft((prev) => ({ ...prev, start: e.target.value }))}
                  />
                ) : (
                  <span className="detail-value">{formatDateDdMmYyyy(coordination.start)}</span>
                )}
              </div>
              <div className="detail-field">
                <span className="detail-label">End</span>
                {coreEditing ? (
                  <input
                    className="detail-input"
                    type="date"
                    value={coreDraft.end}
                    onChange={(e) => setCoreDraft((prev) => ({ ...prev, end: e.target.value }))}
                  />
                ) : (
                  <span className="detail-value">{formatDateDdMmYyyy(coordination.end)}</span>
                )}
              </div>
              <div className="detail-field">
                <span className="detail-label">SWTPL Nr</span>
                {coreEditing ? (
                  <input
                    className="detail-input"
                    value={coreDraft.swtpl_nr}
                    onChange={(e) => setCoreDraft((prev) => ({ ...prev, swtpl_nr: e.target.value }))}
                  />
                ) : (
                  <span className="detail-value">{coordination.swtpl_nr || '–'}</span>
                )}
              </div>
              <div className="detail-field">
                <span className="detail-label">National coordinator</span>
                {coreEditing ? (
                  <input
                    className="detail-input"
                    value={coreDraft.national_coordinator}
                    onChange={(e) => setCoreDraft((prev) => ({ ...prev, national_coordinator: e.target.value }))}
                  />
                ) : (
                  <span className="detail-value">{coordination.national_coordinator || '–'}</span>
                )}
              </div>
            </div>
            <div className="detail-field coord-comment-field">
              <span className="detail-label">Comment</span>
              {coreEditing ? (
                <textarea
                  className="detail-input coord-comment-input"
                  value={coreDraft.comment}
                  onChange={(e) => setCoreDraft((prev) => ({ ...prev, comment: e.target.value }))}
                />
              ) : (
                <div className="detail-value coord-comment-value">{coordination.comment || '–'}</div>
              )}
            </div>
            {coreError && <p className="status">{coreError}</p>}
          </section>

          <section className="detail-section ui-panel-section">
            <EditableSectionHeader
              title="Donor data"
              editing={donorEditing}
              saving={donorSaving}
              dirty={donorDirty}
              onEdit={() => {
                setDonorError('');
                setDonorEditing(true);
              }}
              onSave={() => {
                void handleSaveDonor();
              }}
              onCancel={() => {
                setDonorEditing(false);
                setDonorError('');
                setDonorDraft(initialDonorDraft);
              }}
            />
            <div className="detail-grid">
              <div className="detail-field">
                <span className="detail-label">Full name</span>
                {donorEditing ? (
                  <input
                    className="detail-input"
                    value={donorDraft.full_name}
                    onChange={(e) => setDonorDraft((prev) => ({ ...prev, full_name: e.target.value }))}
                  />
                ) : (
                  <span className="detail-value">{donor?.full_name || '–'}</span>
                )}
              </div>
              <div className="detail-field">
                <span className="detail-label">Date of birth</span>
                {donorEditing ? (
                  <input
                    className="detail-input"
                    type="date"
                    value={donorDraft.birth_date}
                    onChange={(e) => setDonorDraft((prev) => ({ ...prev, birth_date: e.target.value }))}
                  />
                ) : (
                  <span className="detail-value">{formatDateDdMmYyyy(donor?.birth_date)}</span>
                )}
              </div>
              <div className="detail-field">
                <span className="detail-label">Reason of death</span>
                {donorEditing ? (
                  <select
                    className="detail-input"
                    value={donorDraft.death_kind_id || ''}
                    onChange={(e) =>
                      setDonorDraft((prev) => ({ ...prev, death_kind_id: e.target.value ? Number(e.target.value) : 0 }))
                    }
                  >
                    <option value="">–</option>
                    {deathKinds.map((kind) => (
                      <option key={kind.id} value={kind.id}>
                        {kind.name_default}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="detail-value">{donor?.death_kind?.name_default ?? '–'}</span>
                )}
              </div>
              <div className="detail-field">
                <span className="detail-label">Sex</span>
                {donorEditing ? (
                  <select
                    className="detail-input"
                    value={donorDraft.sex_id ?? ''}
                    onChange={(e) =>
                      setDonorDraft((prev) => ({ ...prev, sex_id: e.target.value ? Number(e.target.value) : null }))
                    }
                  >
                    <option value="">–</option>
                    {sexCodes.map((sex) => (
                      <option key={sex.id} value={sex.id}>
                        {sex.name_default}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="detail-value">{sexCodes.find((s) => s.id === donor?.sex_id)?.name_default ?? '–'}</span>
                )}
              </div>
              <div className="detail-field">
                <span className="detail-label">Blood type</span>
                {donorEditing ? (
                  <select
                    className="detail-input"
                    value={donorDraft.blood_type_id ?? ''}
                    onChange={(e) =>
                      setDonorDraft((prev) => ({ ...prev, blood_type_id: e.target.value ? Number(e.target.value) : null }))
                    }
                  >
                    <option value="">–</option>
                    {bloodTypes.map((bt) => (
                      <option key={bt.id} value={bt.id}>
                        {bt.name_default}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="detail-value">{bloodTypes.find((bt) => bt.id === donor?.blood_type_id)?.name_default ?? '–'}</span>
                )}
              </div>
              <div className="detail-field">
                <span className="detail-label">Height (cm)</span>
                {donorEditing ? (
                  <input
                    className="detail-input"
                    type="number"
                    value={donorDraft.height ?? ''}
                    onChange={(e) =>
                      setDonorDraft((prev) => ({ ...prev, height: e.target.value ? Number(e.target.value) : null }))
                    }
                  />
                ) : (
                  <span className="detail-value">{donor?.height ?? '–'}</span>
                )}
              </div>
              <div className="detail-field">
                <span className="detail-label">Weight (kg)</span>
                {donorEditing ? (
                  <input
                    className="detail-input"
                    type="number"
                    value={donorDraft.weight ?? ''}
                    onChange={(e) =>
                      setDonorDraft((prev) => ({ ...prev, weight: e.target.value ? Number(e.target.value) : null }))
                    }
                  />
                ) : (
                  <span className="detail-value">{donor?.weight ?? '–'}</span>
                )}
              </div>
              <div className="detail-field">
                <span className="detail-label">Organ FO</span>
                {donorEditing ? (
                  <input
                    className="detail-input"
                    value={donorDraft.organ_fo}
                    onChange={(e) => setDonorDraft((prev) => ({ ...prev, organ_fo: e.target.value }))}
                  />
                ) : (
                  <span className="detail-value">{donor?.organ_fo || '–'}</span>
                )}
              </div>
              <div className="detail-field">
                <span className="detail-label">Diagnosis</span>
                {donorEditing ? (
                  <select
                    className="detail-input"
                    value={donorDraft.diagnosis_id ?? ''}
                    onChange={(e) =>
                      setDonorDraft((prev) => ({ ...prev, diagnosis_id: e.target.value ? Number(e.target.value) : null }))
                    }
                  >
                    <option value="">–</option>
                    {diagnosisDonorOptions.map((diag) => (
                      <option key={diag.id} value={diag.id}>
                        {diag.name_default}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="detail-value">
                    {diagnosisDonorOptions.find((diag) => diag.id === donor?.diagnosis_id)?.name_default ?? '–'}
                  </span>
                )}
              </div>
            </div>
            {donorError && <p className="status">{donorError}</p>}
          </section>

          <section className="detail-section ui-panel-section">
            <EditableSectionHeader
              title="Hospitals"
              editing={originEditing}
              saving={originSaving}
              dirty={originDirty}
              onEdit={() => {
                setOriginError('');
                setOriginEditing(true);
              }}
              onSave={() => {
                void handleSaveOrigin();
              }}
              onCancel={() => {
                setOriginEditing(false);
                setOriginError('');
                setOriginDraft(initialOriginDraft);
              }}
            />
            <div className="detail-grid">
              <div className="detail-field">
                <span className="detail-label">Detection hospital</span>
                {originEditing ? (
                  <select
                    className="detail-input"
                    value={originDraft.detection_hospital_id || ''}
                    onChange={(e) =>
                      setOriginDraft((prev) => ({
                        ...prev,
                        detection_hospital_id: e.target.value ? Number(e.target.value) : 0,
                      }))
                    }
                  >
                    <option value="">–</option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name_default}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="detail-value">{origin?.detection_hospital?.name_default ?? '–'}</span>
                )}
              </div>
              <div className="detail-field">
                <span className="detail-label">Procurement hospital</span>
                {originEditing ? (
                  <select
                    className="detail-input"
                    value={originDraft.procurement_hospital_id || ''}
                    onChange={(e) =>
                      setOriginDraft((prev) => ({
                        ...prev,
                        procurement_hospital_id: e.target.value ? Number(e.target.value) : 0,
                      }))
                    }
                  >
                    <option value="">–</option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name_default}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="detail-value">{origin?.procurement_hospital?.name_default ?? '–'}</span>
                )}
              </div>
            </div>
            {originError && <p className="status">{originError}</p>}
          </section>

          <section className="detail-section ui-panel-section">
            <div className="detail-section-heading">
              <h2>Protocol Overview</h2>
            </div>
            <div className="coord-protocol-overview">
              {protocolEntriesByOrgan.length === 0 ? (
                <p className="detail-empty">No organs found.</p>
              ) : (
                protocolEntriesByOrgan.map(({ organ, entries }) => (
                  <fieldset key={organ.id} className="coord-protocol-organ-box">
                    <legend>{organ.name_default}</legend>
                    {entries.length === 0 ? (
                      <p className="detail-empty">No protocol data for this organ.</p>
                    ) : (
                      entries.map((entry) => (
                        <div key={entry.id} className="coord-protocol-entry">
                          <div className="coord-protocol-entry-actions">
                            <button
                              className="coord-protocol-open-btn"
                              onClick={() => {
                                if (entry.patientId != null && entry.episodeId != null) {
                                  onOpenPatientEpisode(entry.patientId, entry.episodeId);
                                }
                              }}
                              disabled={entry.patientId == null || entry.episodeId == null}
                              title="Open linked episode"
                            >
                              Open
                            </button>
                          </div>
                          <div className="coord-protocol-entry-grid">
                            <div className="detail-field">
                              <span className="detail-label">Recipient full name</span>
                              <span className="detail-value">{entry.recipientName}</span>
                            </div>
                            <div className="detail-field">
                              <span className="detail-label">Fallnummer</span>
                              <span className="detail-value">{entry.fallNr}</span>
                            </div>
                            <div className="detail-field">
                              <span className="detail-label">Date of birth</span>
                              <span className="detail-value">{entry.birthDate}</span>
                            </div>
                            <div className="detail-field">
                              <span className="detail-label">Diagnosis (main)</span>
                              <span className="detail-value">{entry.mainDiagnosis}</span>
                            </div>
                            <div className="detail-field">
                              <span className="detail-label">RS-nr</span>
                              <span className="detail-value">{entry.rsNr}</span>
                            </div>
                            <div className="detail-field">
                              <span className="detail-label">TPL date</span>
                              <span className="detail-value">{entry.tplDate}</span>
                            </div>
                            <div className="detail-field">
                              <span className="detail-label">Procurement team</span>
                              <span className="detail-value">{entry.procurementTeam}</span>
                            </div>
                            <div className="detail-field">
                              <span className="detail-label">Perfusion applied</span>
                              <span className="detail-value">
                                {entry.perfusionApplied}
                                {entry.perfusionDone ? (
                                  <span className="coord-protocol-badge" title="Perfusion applied">
                                    Perfusion
                                  </span>
                                ) : null}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </fieldset>
                ))
              )}
            </div>
          </section>
        </>
      );
    }

    if (tab === 'protocol') {
      return (
        <section className="detail-section ui-panel-section">
          <div className="detail-section-heading">
            <h2>Protocol</h2>
          </div>
          <p className="status">Protocol content will be added in next step.</p>
        </section>
      );
    }

    return (
      <section className="detail-section ui-panel-section">
        <div className="detail-section-heading">
          <h2>Time log</h2>
          {!hasEditorOpen && !running && (
            <button className="ci-add-btn" onClick={onOpenAddLog}>
              + Add
            </button>
          )}
        </div>
        <div className="coord-time-totals">
          <span className="detail-label">Total time per user</span>
          {totalsByUser.length === 0 ? (
            <p className="detail-empty">No completed time intervals yet.</p>
          ) : (
            <div className="coord-time-total-list">
              {totalsByUser.map(([userName, seconds]) => (
                <div key={userName} className="coord-time-total-row">
                  <span>{userName}</span>
                  <strong>{formatElapsed(seconds)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="ui-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Start</th>
                <th>End</th>
                <th>Comment</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {addingLog && (
                <tr className="ci-editing-row">
                  <td>
                    <select
                      className="detail-input ci-inline-input coord-time-user-input"
                      value={logDraft.user_id || ''}
                      onChange={(e) => setLogDraft((prev) => ({ ...prev, user_id: Number(e.target.value) }))}
                    >
                      <option value="">Select user</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="detail-input ci-inline-input coord-time-datetime-input"
                      type="datetime-local"
                      step={1}
                      value={logDraft.start}
                      onChange={(e) => setLogDraft((prev) => ({ ...prev, start: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      className="detail-input ci-inline-input coord-time-datetime-input"
                      type="datetime-local"
                      step={1}
                      value={logDraft.end}
                      onChange={(e) => setLogDraft((prev) => ({ ...prev, end: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      className="detail-input ci-inline-input"
                      value={logDraft.comment}
                      placeholder="Comment"
                      onChange={(e) => setLogDraft((prev) => ({ ...prev, comment: e.target.value }))}
                    />
                  </td>
                  <td className="coord-time-actions">
                    <button className="ci-save-inline" onClick={onSaveLogDraft} title="Save" aria-label="Save">
                      ✓
                    </button>
                    <button className="ci-cancel-inline" onClick={onCloseLogEditor} title="Cancel" aria-label="Cancel">
                      ✕
                    </button>
                  </td>
                </tr>
              )}
              {timeLogs.length === 0 && !addingLog ? (
                <tr>
                  <td colSpan={5} className="status">No time logs found.</td>
                </tr>
              ) : null}
              {timeLogs.map((log) => (
                editingLogId === log.id ? (
                  <tr key={log.id} className="ci-editing-row">
                    <td>
                      <select
                        className="detail-input ci-inline-input coord-time-user-input"
                        value={logDraft.user_id || ''}
                        onChange={(e) => setLogDraft((prev) => ({ ...prev, user_id: Number(e.target.value) }))}
                      >
                        <option value="">Select user</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="detail-input ci-inline-input coord-time-datetime-input"
                        type="datetime-local"
                        step={1}
                        value={logDraft.start}
                        onChange={(e) => setLogDraft((prev) => ({ ...prev, start: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        className="detail-input ci-inline-input coord-time-datetime-input"
                        type="datetime-local"
                        step={1}
                        value={logDraft.end}
                        onChange={(e) => setLogDraft((prev) => ({ ...prev, end: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        className="detail-input ci-inline-input"
                        value={logDraft.comment}
                        placeholder="Comment"
                        onChange={(e) => setLogDraft((prev) => ({ ...prev, comment: e.target.value }))}
                      />
                    </td>
                    <td className="coord-time-actions">
                      <button className="ci-save-inline" onClick={onSaveLogDraft} title="Save" aria-label="Save">
                        ✓
                      </button>
                      <button className="ci-cancel-inline" onClick={onCloseLogEditor} title="Cancel" aria-label="Cancel">
                        ✕
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={log.id}>
                    <td>{log.user?.name ?? `#${log.user_id}`}</td>
                    <td>{fmtDateTime(log.start)}</td>
                    <td>{fmtDateTime(log.end)}</td>
                    <td>{log.comment || '–'}</td>
                    <td className="coord-time-actions">
                      <InlineDeleteActions
                        confirming={confirmDeleteLogId === log.id}
                        onEdit={() => onOpenEditLog(log)}
                        onRequestDelete={() => setConfirmDeleteLogId(log.id)}
                        onConfirmDelete={() => {
                          onDeleteLog(log.id);
                          setConfirmDeleteLogId(null);
                        }}
                        onCancelDelete={() => setConfirmDeleteLogId(null)}
                      />
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
        {logError && <p className="patients-add-error">{logError}</p>}
      </section>
    );
  })();

  return (
    <>
      <nav className="detail-tabs">
        <button className={`detail-tab ${tab === 'coordination' ? 'active' : ''}`} onClick={() => setTab('coordination')}>
          Coordination
        </button>
        <button className={`detail-tab ${tab === 'protocol' ? 'active' : ''}`} onClick={() => setTab('protocol')}>
          Protocol
        </button>
        <button className={`detail-tab ${tab === 'time-log' ? 'active' : ''}`} onClick={() => setTab('time-log')}>
          Time Log
        </button>
      </nav>

      <section className={`coord-time-strip ${running ? 'running' : 'stopped'}`}>
        <div className="coord-time-strip-head">
          <strong>Time Log</strong>
          <div className="coord-time-clock">{formatElapsed(elapsedSec)}</div>
          <div className="coord-time-controls">
            <button
              className={`${running ? 'cancel-btn' : 'save-btn'} coord-time-btn`}
              onClick={onStartClock}
              disabled={running}
            >
              Start
            </button>
            <button
              className={`${running ? 'save-btn' : 'cancel-btn'} coord-time-btn`}
              onClick={onRequestStopClock}
              disabled={!running}
            >
              Stop
            </button>
          </div>
        </div>
        {stopDraftOpen && (
          <div className="coord-time-stop-editor">
            <textarea
              className="detail-input coord-time-comment"
              value={stopComment}
              placeholder="Comment"
              onChange={(e) => setStopComment(e.target.value)}
            />
            <div className="edit-actions">
              <button className="save-btn" onClick={onSaveStopClock}>
                Save Time Log
              </button>
              <button className="cancel-btn" onClick={onCancelStopClock}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {section}
    </>
  );
}
