import type { Patient } from '../../../api';
import type { PatientCoreModel } from '../../patient-detail/PatientDetailTabs';
import EditableSectionHeader from '../../layout/EditableSectionHeader';

type PatientDataSectionProps = {
  patient: Patient;
  formatDate: (iso: string | null) => string;
} & Pick<
  PatientCoreModel,
  | 'editing'
  | 'startEditing'
  | 'saving'
  | 'handleSave'
  | 'cancelEditing'
  | 'form'
  | 'setForm'
  | 'setField'
  | 'languages'
  | 'sexCodes'
  | 'coordUsers'
>;

export default function PatientDataSection({
  patient,
  editing,
  startEditing,
  saving,
  handleSave,
  cancelEditing,
  form,
  setForm,
  setField,
  formatDate,
  languages,
  sexCodes,
  coordUsers,
}: PatientDataSectionProps) {
  return (
    <section className="detail-section">
      <EditableSectionHeader
        title="Basic data"
        editing={editing}
        saving={saving}
        onEdit={startEditing}
        onSave={handleSave}
        onCancel={cancelEditing}
      />
      <div className="detail-grid">
        <div className="detail-field">
          <span className="detail-label">PID</span>
          {editing ? (
            <input className="detail-input" value={form.pid} onChange={(e) => setField('pid', e.target.value)} />
          ) : (
            <span className="detail-value">{patient.pid}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Name</span>
          {editing ? (
            <input className="detail-input" value={form.name} onChange={(e) => setField('name', e.target.value)} />
          ) : (
            <span className="detail-value">{patient.name}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">First Name</span>
          {editing ? (
            <input className="detail-input" value={form.first_name} onChange={(e) => setField('first_name', e.target.value)} />
          ) : (
            <span className="detail-value">{patient.first_name}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Date of Birth</span>
          {editing ? (
            <input className="detail-input" type="date" value={form.date_of_birth} onChange={(e) => setField('date_of_birth', e.target.value)} />
          ) : (
            <span className="detail-value">{formatDate(patient.date_of_birth)}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Date of Death</span>
          {editing ? (
            <input className="detail-input" type="date" value={form.date_of_death} onChange={(e) => setField('date_of_death', e.target.value)} />
          ) : (
            <span className="detail-value">{formatDate(patient.date_of_death)}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">AHV Nr.</span>
          {editing ? (
            <input className="detail-input" value={form.ahv_nr} onChange={(e) => setField('ahv_nr', e.target.value)} />
          ) : (
            <span className="detail-value">{patient.ahv_nr || '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Language</span>
          {editing ? (
            languages.length > 0 && !languages.some((l) => l.name_default === form.lang) && form.lang !== '' ? (
              <div className="lang-custom-row">
                <input
                  className="detail-input"
                  value={form.lang}
                  onChange={(e) => setField('lang', e.target.value)}
                  placeholder="Enter language..."
                />
                <button
                  type="button"
                  className="lang-switch-btn"
                  onClick={() => setField('lang', languages[0]?.name_default ?? '')}
                  title="Pick from list"
                >▼</button>
              </div>
            ) : (
              <div className="lang-custom-row">
                <select
                  className="detail-input"
                  value={form.lang}
                  onChange={(e) => {
                    if (e.target.value === '__other__') {
                      setField('lang', '');
                    } else {
                      setField('lang', e.target.value);
                    }
                  }}
                >
                  <option value="">–</option>
                  {languages.map((l: any) => (
                    <option key={l.id} value={l.name_default}>{l.name_default}</option>
                  ))}
                  <option value="__other__">Other...</option>
                </select>
              </div>
            )
          ) : (
            <span className="detail-value">{patient.lang || '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Sex</span>
          {editing ? (
            <select
              className="detail-input"
              value={form.sex_id ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, sex_id: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">–</option>
              {sexCodes.map((sex) => (
                <option key={sex.id} value={sex.id}>{sex.name_default}</option>
              ))}
            </select>
          ) : (
            <span className="detail-value">{patient.sex?.name_default ?? '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Responsible Coordinator</span>
          {editing ? (
            <select
              className="detail-input"
              value={form.resp_coord_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, resp_coord_id: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">–</option>
              {coordUsers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          ) : (
            <span className="detail-value">{patient.resp_coord?.name ?? '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Translate</span>
          {editing ? (
            <label className="detail-checkbox">
              <input type="checkbox" checked={form.translate} onChange={(e) => setField('translate', e.target.checked)} />
              Yes
            </label>
          ) : (
            <span className="detail-value">{patient.translate ? 'Yes' : 'No'}</span>
          )}
        </div>
      </div>
    </section>
  );
}
