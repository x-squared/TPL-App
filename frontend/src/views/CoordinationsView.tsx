import CoordinationsTable from './coordinations/list/CoordinationsTable';
import { useCoordinationsListViewModel } from './coordinations/list/useCoordinationsListViewModel';
import './layout/PanelLayout.css';
import './PatientsView.css';
import './CoordinationsView.css';

interface Props {
  onOpenCoordination: (id: number) => void;
}

export default function CoordinationsView({ onOpenCoordination }: Props) {
  const {
    loading,
    loadError,
    rows,
    adding,
    setAdding,
    creating,
    createError,
    handleCreate,
    startDateInput,
    form,
    setFormDate,
    setFormField,
    resetCreate,
  } = useCoordinationsListViewModel();

  return (
    <>
      <header className="patients-header">
        <h1>Coordinations</h1>
        <button className="patients-add-btn" onClick={() => setAdding(true)} disabled={adding}>
          + Add
        </button>
      </header>
      {loading ? (
        <p className="status">Loading...</p>
      ) : loadError ? (
        <p className="status">{loadError}</p>
      ) : (
        <CoordinationsTable
          rows={rows}
          onOpenCoordination={onOpenCoordination}
          adding={adding}
          creating={creating}
          createError={createError}
          startDateInput={startDateInput}
          donorNr={form.donor_nr ?? ''}
          swtplNr={form.swtpl_nr ?? ''}
          nationalCoordinator={form.national_coordinator ?? ''}
          comment={form.comment ?? ''}
          onDateChange={setFormDate}
          onFieldChange={setFormField}
          onSave={() => {
            void handleCreate();
          }}
          onCancel={resetCreate}
        />
      )}
    </>
  );
}
