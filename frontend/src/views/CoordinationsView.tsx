import { useEffect, useState } from 'react';
import CoordinationsTable from './coordinations/list/CoordinationsTable';
import { useCoordinationsListViewModel } from './coordinations/list/useCoordinationsListViewModel';
import './layout/PanelLayout.css';
import './PatientsView.css';
import './CoordinationsView.css';

interface Props {
  onOpenCoordination: (id: number) => void;
  quickCreateToken?: number;
}

export default function CoordinationsView({ onOpenCoordination, quickCreateToken = 0 }: Props) {
  const {
    loading,
    loadError,
    rows,
    adding,
    setAdding,
    creating,
    createError,
    handleCreate,
    deathKindCodes,
    startDateInput,
    donorFullName,
    donorBirthDateInput,
    form,
    setFormDate,
    setDonorFullName,
    setDonorBirthDate,
    setDonorDeathKind,
    setFormField,
    resetCreate,
  } = useCoordinationsListViewModel();
  const [donorFocusToken, setDonorFocusToken] = useState(0);

  useEffect(() => {
    if (quickCreateToken <= 0) {
      return;
    }
    setAdding(true);
    setDonorFocusToken((prev) => prev + 1);
  }, [quickCreateToken, setAdding]);

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
          deathKindCodes={deathKindCodes}
          startDateInput={startDateInput}
          donorFullName={donorFullName}
          donorBirthDateInput={donorBirthDateInput}
          donorDeathKindId={form.donor_death_kind_id ?? null}
          donorNr={form.donor_nr ?? ''}
          swtplNr={form.swtpl_nr ?? ''}
          nationalCoordinator={form.national_coordinator ?? ''}
          comment={form.comment ?? ''}
          onDateChange={setFormDate}
          onDonorFullNameChange={setDonorFullName}
          onDonorBirthDateChange={setDonorBirthDate}
          onDonorDeathKindChange={setDonorDeathKind}
          onFieldChange={setFormField}
          donorFocusToken={donorFocusToken}
          onSave={() => {
            void (async () => {
              const createdId = await handleCreate();
              if (typeof createdId === 'number') {
                onOpenCoordination(createdId);
              }
            })();
          }}
          onCancel={resetCreate}
        />
      )}
    </>
  );
}
