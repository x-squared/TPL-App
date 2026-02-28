import CoordinationDetailTabs from './coordinations/detail/CoordinationDetailTabs';
import FavoriteButton from './layout/FavoriteButton';
import { useCoordinationDetailViewModel } from './coordinations/detail/useCoordinationDetailViewModel';
import { formatDateDdMmYyyy } from './layout/dateFormat';
import { useFavoriteToggle } from './layout/useFavoriteToggle';
import type { CoordinationDetailTab } from './coordinations/detail/useCoordinationDetailViewModel';
import './layout/PanelLayout.css';
import './PatientDetailView.css';
import './PatientsView.css';
import './CoordinationsView.css';

interface Props {
  coordinationId: number;
  onBack: () => void;
  onOpenPatientEpisode: (patientId: number, episodeId: number) => void;
  initialTab?: CoordinationDetailTab;
}

export default function CoordinationDetailView({
  coordinationId,
  onBack,
  onOpenPatientEpisode,
  initialTab = 'coordination',
}: Props) {
  const model = useCoordinationDetailViewModel(coordinationId, initialTab);
  const donorName = model.donor?.full_name?.trim() || '';
  const donorBirthDate = formatDateDdMmYyyy(model.donor?.birth_date);
  const coordinationTitle = model.coordination
    ? (
      donorName || donorBirthDate
        ? `${donorName || 'Unknown donor'}${donorBirthDate !== '–' ? ` (${donorBirthDate})` : ''}`
        : `Coordination #${model.coordination.id}`
    )
    : '';
  const coordinationFavorite = useFavoriteToggle(model.coordination ? {
    favorite_type_key: 'COORDINATION',
    coordination_id: model.coordination.id,
    name: coordinationTitle,
  } : null);
  const openDetachedProtocol = () => {
    const url = `${window.location.origin}${window.location.pathname}?coordination_protocol=${coordinationId}`;
    window.open(url, '_blank', 'popup=yes,width=1200,height=900');
  };

  if (model.loading) return <p className="status">Loading...</p>;
  if (model.error || !model.coordination) return <p className="status">{model.error || 'Coordination not found.'}</p>;

  return (
    <div className="patient-detail">
      <div className="ui-detail-heading">
        <button className="ui-back-btn" onClick={onBack} title="Back to list">
          &larr;
        </button>
        <div className="ui-heading-title-with-favorite">
          <h1>{coordinationTitle}</h1>
          <FavoriteButton
            active={coordinationFavorite.isFavorite}
            disabled={coordinationFavorite.loading || coordinationFavorite.saving}
            onClick={() => void coordinationFavorite.toggle()}
            title={coordinationFavorite.isFavorite ? 'Remove coordination from favorites' : 'Add coordination to favorites'}
          />
        </div>
        <div className="patients-add-actions">
          <button className="patients-cancel-btn" onClick={openDetachedProtocol}>
            Open detached protocol
          </button>
        </div>
      </div>
      <CoordinationDetailTabs
        tab={model.tab}
        setTab={model.setTab}
        coordination={model.coordination}
        donor={model.donor}
        origin={model.origin}
        coordinationEpisodes={model.coordinationEpisodes}
        patientsById={model.patientsById}
        organCodes={model.organCodes}
        deathKinds={model.deathKinds}
        sexCodes={model.sexCodes}
        bloodTypes={model.bloodTypes}
        diagnosisDonorOptions={model.diagnosisDonorOptions}
        hospitals={model.hospitals}
        running={Boolean(model.runningStart)}
        elapsedSec={model.elapsedSec}
        stopDraftOpen={model.stopDraftOpen}
        stopComment={model.stopComment}
        setStopComment={model.setStopComment}
        onStartClock={model.startClock}
        onRequestStopClock={model.requestStopClock}
        onCancelStopClock={model.cancelStopClock}
        onSaveStopClock={() => void model.saveStoppedClock()}
        timeLogs={model.sortedLogs.map((log) => ({
          id: log.id,
          user_id: log.user_id,
          user: log.user ? { id: log.user.id, name: log.user.name } : null,
          start: log.start,
          end: log.end,
          comment: log.comment,
        }))}
        users={model.users.map((u) => ({ id: u.id, name: u.name }))}
        addingLog={model.addingLog}
        editingLogId={model.editingLogId}
        logDraft={model.logDraft}
        setLogDraft={model.setLogDraft}
        logError={model.logError}
        onOpenAddLog={model.openAddLog}
        onOpenEditLog={(log) => {
          const full = model.sortedLogs.find((entry) => entry.id === log.id);
          if (full) model.openEditLog(full);
        }}
        onCloseLogEditor={model.closeLogEditor}
        onSaveLogDraft={() => void model.saveLogDraft()}
        onDeleteLog={(id) => void model.deleteLog(id)}
        onSaveCoordination={(patch) => model.saveCoordination(patch)}
        onSaveDonor={(patch) => model.saveDonor(patch)}
        onSaveOrigin={(patch) => model.saveOrigin(patch)}
        onRefresh={model.refresh}
        onOpenPatientEpisode={onOpenPatientEpisode}
      />
    </div>
  );
}
