import ColloquiumsAddForm from './colloquiums/list/ColloquiumsAddForm';
import ColloquiumsFilters from './colloquiums/list/ColloquiumsFilters';
import ColloquiumsTable from './colloquiums/list/ColloquiumsTable';
import { useColloquiumsListViewModel } from './colloquiums/list/useColloquiumsListViewModel';
import './layout/PanelLayout.css';
import './PatientsView.css';
import './ColloquiumsView.css';

interface Props {
  onOpenColloqium: (id: number) => void;
}

export default function ColloquiumsView({ onOpenColloqium }: Props) {
  const {
    loading,
    adding,
    setAdding,
    creating,
    createError,
    setCreateError,
    form,
    setForm,
    types,
    filters,
    setFilters,
    filtered,
    expandedAgendaColloqiumId,
    agendasByColloqium,
    loadingAgendasByColloqium,
    handleCreate,
    toggleAgenda,
  } = useColloquiumsListViewModel();

  return (
    <>
      <header className="patients-header">
        <h1>Colloquiums</h1>
        {!adding && (
          <button className="patients-add-btn" onClick={() => setAdding(true)}>
            + Add
          </button>
        )}
      </header>

      {adding && (
        <ColloquiumsAddForm
          form={form}
          types={types}
          creating={creating}
          error={createError}
          onChange={setForm}
          onSave={handleCreate}
          onCancel={() => {
            setAdding(false);
            setCreateError('');
          }}
        />
      )}

      <ColloquiumsFilters filters={filters} types={types} onChange={setFilters} />

      {loading ? (
        <p className="status">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="status">No colloquiums match the filter.</p>
      ) : (
        <ColloquiumsTable
          rows={filtered}
          expandedAgendaColloqiumId={expandedAgendaColloqiumId}
          agendasByColloqium={agendasByColloqium}
          loadingAgendasByColloqium={loadingAgendasByColloqium}
          onOpenColloqium={onOpenColloqium}
          onToggleAgenda={toggleAgenda}
        />
      )}
    </>
  );
}

