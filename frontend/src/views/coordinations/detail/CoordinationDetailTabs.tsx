import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { Code, Coordination, CoordinationDonor, CoordinationEpisode, CoordinationOrigin, Patient } from '../../../api';
import { ApiError, toUserErrorMessage } from '../../../api/error';
import { formatDateDdMmYyyy } from '../../layout/dateFormat';
import CoordinationBasicDataSection from './CoordinationBasicDataSection';
import CoordinationDonorDataSection from './CoordinationDonorDataSection';
import CoordinationHospitalsSection from './CoordinationHospitalsSection';
import CoordinationProtocolOverviewSection from './CoordinationProtocolOverviewSection';
import CoordinationProtocolTab from './CoordinationProtocolTab';
import CoordinationTimeLogSection from './CoordinationTimeLogSection';
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
  onRefresh: () => Promise<void>;
  onOpenPatientEpisode: (patientId: number, episodeId: number) => void;
}

const formatElapsed = (sec: number): string => {
  const h = Math.floor(sec / 3600).toString().padStart(2, '0');
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const toInputDate = (value: string | null | undefined): string => (value ? value.slice(0, 10) : '');

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
  onRefresh,
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
  const protocolBackgroundOptions = [
    'transparent',
    '#fff8dc',
    '#eaf4ff',
    '#ecfdf3',
    '#f6efff',
    '#fff0f2',
  ];
  const [protocolBackground, setProtocolBackground] = useState<string>(protocolBackgroundOptions[0]);

  useEffect(() => {
    const mainContent = document.querySelector('.main-content') as HTMLElement | null;
    if (!mainContent) return;
    if (tab === 'protocol' && protocolBackground !== 'transparent') {
      mainContent.style.backgroundColor = protocolBackground;
    } else {
      mainContent.style.backgroundColor = '';
    }
    return () => {
      mainContent.style.backgroundColor = '';
    };
  }, [protocolBackground, tab]);

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
      const message = toUserErrorMessage(err, 'Failed to save basic data');
      if (err instanceof ApiError && err.status === 409) {
        await onRefresh();
        setCoreEditing(false);
      }
      setCoreError(message);
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
      const message = toUserErrorMessage(err, 'Failed to save donor data');
      if (err instanceof ApiError && err.status === 409) {
        await onRefresh();
        setDonorEditing(false);
      }
      setDonorError(message);
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
      const message = toUserErrorMessage(err, 'Failed to save hospitals');
      if (err instanceof ApiError && err.status === 409) {
        await onRefresh();
        setOriginEditing(false);
      }
      setOriginError(message);
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
          <CoordinationBasicDataSection
            coordination={coordination}
            coreDraft={coreDraft}
            setCoreDraft={setCoreDraft}
            coreEditing={coreEditing}
            coreSaving={coreSaving}
            coreDirty={coreDirty}
            coreError={coreError}
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

          <CoordinationDonorDataSection
            donor={donor}
            donorDraft={donorDraft}
            setDonorDraft={setDonorDraft}
            donorEditing={donorEditing}
            donorSaving={donorSaving}
            donorDirty={donorDirty}
            donorError={donorError}
            deathKinds={deathKinds}
            sexCodes={sexCodes}
            bloodTypes={bloodTypes}
            diagnosisDonorOptions={diagnosisDonorOptions}
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

          <CoordinationHospitalsSection
            origin={origin}
            originDraft={originDraft}
            setOriginDraft={setOriginDraft}
            originEditing={originEditing}
            originSaving={originSaving}
            originDirty={originDirty}
            originError={originError}
            hospitals={hospitals}
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

          <CoordinationProtocolOverviewSection
            groups={protocolEntriesByOrgan}
            onOpenPatientEpisode={onOpenPatientEpisode}
          />
        </>
      );
    }

    if (tab === 'protocol') {
      return (
        <CoordinationProtocolTab
          coordinationId={coordination.id}
          groups={protocolEntriesByOrgan}
          onOpenPatientEpisode={onOpenPatientEpisode}
        />
      );
    }

    return (
      <CoordinationTimeLogSection
        timeLogs={timeLogs}
        users={users}
        addingLog={addingLog}
        editingLogId={editingLogId}
        logDraft={logDraft}
        setLogDraft={setLogDraft}
        logError={logError}
        onOpenAddLog={onOpenAddLog}
        onOpenEditLog={onOpenEditLog}
        onCloseLogEditor={onCloseLogEditor}
        onSaveLogDraft={onSaveLogDraft}
        onDeleteLog={onDeleteLog}
        confirmDeleteLogId={confirmDeleteLogId}
        setConfirmDeleteLogId={setConfirmDeleteLogId}
        hasEditorOpen={hasEditorOpen || running}
        totalsByUser={totalsByUser}
        formatElapsed={formatElapsed}
      />
    );
  })();

  return (
    <div
      className={`coord-panel-wrap ${tab === 'protocol' ? 'coord-panel-wrap-protocol' : ''}`}
      style={tab === 'protocol' && protocolBackground !== 'transparent' ? { backgroundColor: protocolBackground } : undefined}
    >
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
      <div
        className="coord-panel-content"
      >
        <div className="coord-top-strip-row">
          {tab === 'protocol' && (
            <section className="coord-time-strip coord-protocol-color-box stopped">
              <div className="coord-time-strip-head">
                <strong>Protocol color</strong>
              </div>
              <div className="coord-protocol-color-options">
                {protocolBackgroundOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`coord-protocol-color-dot ${protocolBackground === color ? 'active' : ''}`}
                    style={{ backgroundColor: color === 'transparent' ? '#f5f5fa' : color }}
                    onClick={() => setProtocolBackground(color)}
                    title={color === 'transparent' ? 'Set normal background' : `Set protocol background ${color}`}
                    aria-label={color === 'transparent' ? 'Set normal background' : `Set protocol background ${color}`}
                  />
                ))}
              </div>
            </section>
          )}
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
        </div>
        {section}
      </div>
    </div>
  );
}
