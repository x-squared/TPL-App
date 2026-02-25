import type { ColloqiumType } from '../../../api';
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
        onChange={(e) => onChange({ ...form, colloqium_type_id: e.target.value })}
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
      <input
        type="text"
        placeholder="Participants"
        value={form.participants}
        onChange={(e) => onChange({ ...form, participants: e.target.value })}
      />
      <div className="patients-add-actions">
        <button className="patients-save-btn" onClick={onSave} disabled={!canSave}>
          {creating ? 'Saving...' : 'Save'}
        </button>
        <button className="patients-cancel-btn" onClick={onCancel} disabled={creating}>
          Cancel
        </button>
      </div>
      {error && <p className="patients-add-error">{error}</p>}
    </div>
  );
}

