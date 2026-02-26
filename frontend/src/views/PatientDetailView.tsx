import type { PatientDetailTab } from './patient-detail/PatientDetailTabs';
import PatientDetailTabs from './patient-detail/PatientDetailTabs';
import { formatPatientFavoriteName } from './layout/episodeDisplay';
import FavoriteButton from './layout/FavoriteButton';
import { useFavoriteToggle } from './layout/useFavoriteToggle';
import { usePatientDetailViewModel } from './patient-detail/usePatientDetailViewModel';
import './layout/PanelLayout.css';
import './PatientDetailView.css';

interface Props {
  patientId: number;
  onBack: () => void;
  initialTab?: PatientDetailTab;
  initialEpisodeId?: number | null;
  onOpenColloqium: (colloqiumId: number) => void;
}

export default function PatientDetailView({
  patientId,
  onBack,
  initialTab,
  initialEpisodeId,
  onOpenColloqium,
}: Props) {
  const model = usePatientDetailViewModel(patientId, initialTab, initialEpisodeId ?? null, onOpenColloqium);
  const patientFavorite = useFavoriteToggle(model.patient ? {
    favorite_type_key: 'PATIENT',
    patient_id: model.patient.id,
    name: formatPatientFavoriteName({
      fullName: `${model.patient.first_name} ${model.patient.name}`.trim(),
      birthDate: model.patient.date_of_birth,
      pid: model.patient.pid,
    }),
  } : null);

  if (model.loading) {
    return <p className="status">Loading...</p>;
  }

  if (!model.patient || !model.tabsProps) {
    return <p className="status">Patient not found.</p>;
  }

  return (
    <div className="patient-detail">
      <div className="ui-detail-heading">
        <button className="ui-back-btn" onClick={onBack} title="Back to list">&larr;</button>
        <div className="ui-heading-title-with-favorite">
          <h1>{model.patient.first_name} {model.patient.name}</h1>
          <FavoriteButton
            active={patientFavorite.isFavorite}
            disabled={patientFavorite.loading || patientFavorite.saving}
            onClick={() => void patientFavorite.toggle()}
            title={patientFavorite.isFavorite ? 'Remove patient from favorites' : 'Add patient to favorites'}
          />
        </div>
      </div>
      <PatientDetailTabs {...model.tabsProps} />
    </div>
  );
}
