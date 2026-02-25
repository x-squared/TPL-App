import type { Patient } from '../../../api';
import type { PatientCoreModel } from '../../patient-detail/PatientDetailTabs';

type BasicDataSectionProps = {
  patient: Patient;
} & Pick<
  PatientCoreModel,
  'editing' | 'startEditing' | 'saving' | 'handleSave' | 'cancelEditing' | 'form' | 'setForm' | 'bloodTypes'
>;

export default function BasicDataSection({
  patient,
  editing,
  startEditing,
  saving,
  handleSave,
  cancelEditing,
  form,
  setForm,
  bloodTypes,
}: BasicDataSectionProps) {
  return (
    <section className="detail-section" style={{ marginTop: '1.5rem' }}>
      <div className="detail-section-heading">
        <h2>Basic Data</h2>
        {!editing ? (
          <button className="edit-btn" onClick={startEditing}>Edit</button>
        ) : (
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="cancel-btn" onClick={cancelEditing} disabled={saving}>Cancel</button>
          </div>
        )}
      </div>
      <div className="detail-grid">
        <div className="detail-field">
          <span className="detail-label">Blood Type</span>
          {editing ? (
            <select
              className="detail-input"
              value={form.blood_type_id ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, blood_type_id: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">–</option>
              {bloodTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.name_default}</option>
              ))}
            </select>
          ) : (
            <span className="detail-value">{patient.blood_type?.name_default ?? '–'}</span>
          )}
        </div>
      </div>
    </section>
  );
}
