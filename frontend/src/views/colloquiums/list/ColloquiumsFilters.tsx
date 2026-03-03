import type { ColloqiumType } from '../../../api';
import { useI18n } from '../../../i18n/i18n';
import type { ColloquiumsFilterState } from './listTypes';

interface Props {
  filters: ColloquiumsFilterState;
  types: ColloqiumType[];
  onChange: (next: ColloquiumsFilterState) => void;
}

export default function ColloquiumsFilters({ filters, types, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div className="filter-bar colloquiums-filter-bar">
      <label className="colloquiums-filter-field">
        {t('colloquiums.filters.type', 'Type')}
        <select
          className="filter-select colloquiums-filter-control"
          value={filters.typeId}
          onChange={(e) => onChange({ ...filters, typeId: e.target.value })}
        >
          <option value="">{t('taskBoard.filters.all', 'All')}</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="colloquiums-filter-field">
        {t('colloquiums.filters.anchorDate', 'Anchor Date')}
        <input
          className="colloquiums-filter-control"
          type="date"
          value={filters.anchorDate}
          onChange={(e) => onChange({ ...filters, anchorDate: e.target.value })}
        />
      </label>
      <label className="colloquiums-filter-field">
        {t('colloquiums.filters.rangeDays', 'Range (days)')}
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

