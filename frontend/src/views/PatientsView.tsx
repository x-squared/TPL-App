import TaskBoard from './tasks/TaskBoard';
import PatientsAddForm from './patients/PatientsAddForm';
import PatientsFilters from './patients/PatientsFilters';
import PatientsTable from './patients/PatientsTable';
import { usePatientsViewModel } from './patients/usePatientsViewModel';
import './layout/PanelLayout.css';
import './PatientsView.css';

interface Props {
  onSelectPatient: (id: number) => void;
}

export default function PatientsView({ onSelectPatient }: Props) {
  const {
    patientDetails,
    loadingDetails,
    loading,
    filterPid,
    setFilterPid,
    filterFirstName,
    setFilterFirstName,
    filterName,
    setFilterName,
    filterDob,
    setFilterDob,
    filterAny,
    setFilterAny,
    filterOrgan,
    setFilterOrgan,
    filterOpenOnly,
    setFilterOpenOnly,
    organCodes,
    filterBloodType,
    setFilterBloodType,
    bloodTypeCatalogues,
    expandedContacts,
    expandedEpisodes,
    addingPatient,
    setAddingPatient,
    creatingPatient,
    createPatientError,
    setCreatePatientError,
    selectedTaskPatientId,
    setSelectedTaskPatientId,
    newPatient,
    setNewPatient,
    toggleContacts,
    toggleEpisodes,
    handleCreatePatient,
    filteredPatients,
  } = usePatientsViewModel();

  return (
    <>
      <header className="patients-header">
        <h1>Patients</h1>
        {!addingPatient && (
          <button className="patients-add-btn" onClick={() => setAddingPatient(true)}>+ Add Patient</button>
        )}
      </header>

      {addingPatient && (
        <PatientsAddForm
          newPatient={newPatient}
          setNewPatient={setNewPatient}
          creatingPatient={creatingPatient}
          createPatientError={createPatientError}
          setAddingPatient={setAddingPatient}
          setCreatePatientError={setCreatePatientError}
          handleCreatePatient={handleCreatePatient}
        />
      )}

      <PatientsFilters
        filterAny={filterAny}
        setFilterAny={setFilterAny}
        filterPid={filterPid}
        setFilterPid={setFilterPid}
        filterName={filterName}
        setFilterName={setFilterName}
        filterFirstName={filterFirstName}
        setFilterFirstName={setFilterFirstName}
        filterDob={filterDob}
        setFilterDob={setFilterDob}
        filterBloodType={filterBloodType}
        setFilterBloodType={setFilterBloodType}
        bloodTypeCatalogues={bloodTypeCatalogues}
        filterOrgan={filterOrgan}
        setFilterOrgan={setFilterOrgan}
        organCodes={organCodes}
        filterOpenOnly={filterOpenOnly}
        setFilterOpenOnly={setFilterOpenOnly}
      />

      {loading ? (
        <p className="status">Loading...</p>
      ) : filteredPatients.length === 0 ? (
        <p className="status">No patients match the filter.</p>
      ) : (
        <PatientsTable
          filteredPatients={filteredPatients}
          expandedContacts={expandedContacts}
          expandedEpisodes={expandedEpisodes}
          selectedTaskPatientId={selectedTaskPatientId}
          setSelectedTaskPatientId={setSelectedTaskPatientId}
          onSelectPatient={onSelectPatient}
          toggleEpisodes={toggleEpisodes}
          toggleContacts={toggleContacts}
          loadingDetails={loadingDetails}
          patientDetails={patientDetails}
        />
      )}

      <section className="patients-tasks-section ui-panel-section">
        <TaskBoard
          criteria={{
            patientId: selectedTaskPatientId ?? undefined,
          }}
          title="Tasks"
          maxTableHeight={360}
          onAddClick={() => undefined}
          headerMeta={(
            <>
              <p className="patients-tasks-selection-hint">
                ({selectedTaskPatientId !== null
                  ? `filtered to patient #${selectedTaskPatientId}`
                  : 'showing tasks for all patients'})
              </p>
              {selectedTaskPatientId !== null && (
                <button className="patients-clear-selection-btn" onClick={() => setSelectedTaskPatientId(null)}>
                  Clear patient selection
                </button>
              )}
            </>
          )}
        />
      </section>
    </>
  );
}
