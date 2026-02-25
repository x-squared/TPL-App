import PatientDetailTabs from './patient-detail/PatientDetailTabs';
import { usePatientDetailViewModel } from './patient-detail/usePatientDetailViewModel';
import './layout/PanelLayout.css';
import './PatientDetailView.css';

interface Props {
  patientId: number;
  onBack: () => void;
}

export default function PatientDetailView({ patientId, onBack }: Props) {
  const model = usePatientDetailViewModel(patientId);

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
        <h1>{model.patient.first_name} {model.patient.name}</h1>
      </div>
      <PatientDetailTabs {...model.tabsProps} />
    </div>
  );
}
