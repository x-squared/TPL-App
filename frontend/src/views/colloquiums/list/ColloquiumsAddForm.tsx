import type { ColloqiumType } from '../../../api';
import ErrorBanner from '../../layout/ErrorBanner';
import PersonMultiSelect from '../../layout/PersonMultiSelect';
import type { ColloquiumCreateFormState } from './listTypes';

interface Props {
  form: ColloquiumCreateFormState;
  types: ColloqiumType[];
  creating: boolean;
  error: string;
  onChange: (next: ColloquiumCreateFormState) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ColloquiumsAddForm({
  form,
  types,
  creating,
  error,
  onChange,
  onSave,
  onCancel,
}: Props) {
  const canSave = !!form.colloqium_type_id && !!form.date && !creating;

  return (
    <div className="patients-add-form">
      <select
        className="filter-select"
        value={form.colloqium_type_id}
        onChange={(e) => {
          const value = e.target.value;
          const selectedType = types.find((type) => String(type.id) === value);
          onChange({
            ...form,
            colloqium_type_id: value,
            participant_ids: selectedType?.participant_ids ?? [],
            participants_people: selectedType?.participants_people ?? [],
          });
        }}
      >
        <option value="">Type *</option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={form.date}
        onChange={(e) => onChange({ ...form, date: e.target.value })}
      />
      <PersonMultiSelect
        selectedPeople={form.participants_people}
        onChange={(next) => onChange({
          ...form,
          participant_ids: next.map((person) => person.id),
          participants_people: next,
        })}
        disabled={creating}
      />
      <div className="patients-add-actions">
        <button className="patients-save-btn" onClick={onSave} disabled={!canSave}>
          {creating ? 'Saving...' : 'Save'}
        </button>
        <button className="patients-cancel-btn" onClick={onCancel} disabled={creating}>
          Cancel
        </button>
      </div>
      <ErrorBanner message={error} />
    </div>
  );
}

