import type { ColloqiumType } from '../../../api';
import type { ColloquiumsFilterState } from './listTypes';

interface Props {
  filters: ColloquiumsFilterState;
  types: ColloqiumType[];
  onChange: (next: ColloquiumsFilterState) => void;
}

export default function ColloquiumsFilters({ filters, types, onChange }: Props) {
  return (
    <div className="filter-bar colloquiums-filter-bar">
      <label className="colloquiums-filter-field">
        Type
        <select
          className="filter-select colloquiums-filter-control"
          value={filters.typeId}
          onChange={(e) => onChange({ ...filters, typeId: e.target.value })}
        >
          <option value="">All</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="colloquiums-filter-field">
        Anchor Date
        <input
          className="colloquiums-filter-control"
          type="date"
          value={filters.anchorDate}
          onChange={(e) => onChange({ ...filters, anchorDate: e.target.value })}
        />
      </label>
      <label className="colloquiums-filter-field">
        Range (days)
        <input
          className="colloquiums-filter-control"
          type="number"
          min={0}
          value={filters.rangeDays}
          onChange={(e) => onChange({ ...filters, rangeDays: Number(e.target.value || 0) })}
          placeholder="0"
        />
      </label>
    </div>
  );
}

