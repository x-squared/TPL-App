import ReportsBuilder from '../features/reports/ReportsBuilder';
import { useReportsViewModel } from '../features/reports/useReportsViewModel';
import './layout/PanelLayout.css';
import '../features/reports/ReportsView.css';

export default function ReportsView() {
  const model = useReportsViewModel();

  return (
    <>
      <header className="patients-header">
        <h1>Reports</h1>
      </header>
      {model.error ? <p className="status">{model.error}</p> : null}
      {model.loading ? <p className="status">Loading report metadata...</p> : <ReportsBuilder model={model} />}
    </>
  );
}
