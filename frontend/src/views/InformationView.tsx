import InformationRowsSection from './information/InformationRowsSection';
import { useInformationViewModel } from './information/useInformationViewModel';
import './layout/PanelLayout.css';
import './InformationView.css';

export default function InformationView() {
  const model = useInformationViewModel();

  return (
    <>
      <header className="patients-header">
        <h1>Information</h1>
      </header>
      <InformationRowsSection model={model} />
    </>
  );
}
