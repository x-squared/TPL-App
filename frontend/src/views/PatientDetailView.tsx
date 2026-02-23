import { useEffect, useState } from 'react';
import { api, type Code, type ContactInfoCreate, type Patient, type PatientUpdate } from '../api';
import './PatientDetailView.css';

function formatDate(iso: string | null): string {
  if (!iso) return '–';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

interface Props {
  patientId: number;
  onBack: () => void;
}

export default function PatientDetailView({ patientId, onBack }: Props) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState<Code[]>([]);
  const [contactTypes, setContactTypes] = useState<Code[]>([]);
  const [addingContact, setAddingContact] = useState(false);
  const [ciSaving, setCiSaving] = useState(false);
  const [ciForm, setCiForm] = useState<ContactInfoCreate>({ type_id: 0, data: '', comment: '', main: false });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [form, setForm] = useState({
    pid: '',
    first_name: '',
    name: '',
    date_of_birth: '',
    date_of_death: '',
    ahv_nr: '',
    lang: '',
    translate: false,
  });

  const refreshPatient = () => api.getPatient(patientId).then(setPatient);

  useEffect(() => {
    api.getPatient(patientId)
      .then(setPatient)
      .finally(() => setLoading(false));
    api.listCatalogues('LANGUAGE').then(setLanguages);
    api.listCodes('CONTACT').then((codes) => {
      setContactTypes(codes);
      if (codes.length > 0) setCiForm((f) => ({ ...f, type_id: codes[0].id }));
    });
  }, [patientId]);

  const startEditing = () => {
    if (!patient) return;
    setForm({
      pid: patient.pid ?? '',
      first_name: patient.first_name ?? '',
      name: patient.name ?? '',
      date_of_birth: patient.date_of_birth ?? '',
      date_of_death: patient.date_of_death ?? '',
      ahv_nr: patient.ahv_nr ?? '',
      lang: patient.lang ?? '',
      translate: patient.translate ?? false,
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    if (!patient) return;
    setSaving(true);
    try {
      const update: PatientUpdate = {
        pid: form.pid,
        first_name: form.first_name,
        name: form.name,
        date_of_birth: form.date_of_birth || null,
        date_of_death: form.date_of_death || null,
        ahv_nr: form.ahv_nr,
        lang: form.lang,
        translate: form.translate,
      };
      const updated = await api.updatePatient(patient.id, update);
      setPatient(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddContact = async () => {
    if (!patient || !ciForm.type_id || !ciForm.data.trim()) return;
    setCiSaving(true);
    try {
      await api.createContactInfo(patient.id, ciForm);
      await refreshPatient();
      setCiForm({ type_id: contactTypes[0]?.id ?? 0, data: '', comment: '', main: false });
      setAddingContact(false);
    } finally {
      setCiSaving(false);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!patient) return;
    await api.deleteContactInfo(patient.id, contactId);
    setConfirmDeleteId(null);
    await refreshPatient();
  };

  if (loading) {
    return <p className="status">Loading...</p>;
  }

  if (!patient) {
    return <p className="status">Patient not found.</p>;
  }

  return (
    <div className="patient-detail">
      <button className="back-btn" onClick={onBack}>&larr; Back to list</button>

      <div className="detail-heading">
        <h1>{patient.first_name} {patient.name}</h1>
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

      <section className="detail-section">
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
              <>
                <input
                  className="detail-input"
                  list="lang-options"
                  value={form.lang}
                  onChange={(e) => setField('lang', e.target.value)}
                  placeholder="Type or select..."
                />
                <datalist id="lang-options">
                  {languages.map((l) => (
                    <option key={l.id} value={l.name_default} />
                  ))}
                </datalist>
              </>
            ) : (
              <span className="detail-value">{patient.lang || '–'}</span>
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

      <section className="detail-section">
        <div className="detail-heading">
          <h2>Contact Information</h2>
          {!addingContact && (
            <button className="ci-add-btn" onClick={() => setAddingContact(true)}>+ Add</button>
          )}
        </div>
        {patient.contact_infos && patient.contact_infos.length > 0 ? (
          <table className="detail-contact-table">
            <tbody>
              {patient.contact_infos.map((ci) => (
                <tr key={ci.id}>
                  <td className="detail-ci-main">
                    {ci.main && <span className="main-badge">Main</span>}
                  </td>
                  <td className="detail-ci-type">{ci.type?.name_default ?? ci.type?.key ?? '–'}</td>
                  <td className="detail-ci-data">{ci.data}</td>
                  <td className="detail-ci-comment">{ci.comment || ''}</td>
                  <td className="detail-ci-actions">
                    {confirmDeleteId === ci.id ? (
                      <span className="ci-confirm">
                        <span className="ci-confirm-text">Delete?</span>
                        <button className="ci-confirm-yes" onClick={() => handleDeleteContact(ci.id)}>Yes</button>
                        <button className="ci-confirm-no" onClick={() => setConfirmDeleteId(null)}>No</button>
                      </span>
                    ) : (
                      <button className="ci-delete-btn" onClick={() => setConfirmDeleteId(ci.id)} title="Delete">×</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="detail-empty">No contact information.</p>
        )}

        {addingContact && (
          <div className="ci-add-form">
            <select
              className="detail-input"
              value={ciForm.type_id}
              onChange={(e) => setCiForm((f) => ({ ...f, type_id: Number(e.target.value) }))}
            >
              {contactTypes.map((c) => (
                <option key={c.id} value={c.id}>{c.name_default}</option>
              ))}
            </select>
            <input
              className="detail-input"
              placeholder="Data"
              value={ciForm.data}
              onChange={(e) => setCiForm((f) => ({ ...f, data: e.target.value }))}
            />
            <input
              className="detail-input"
              placeholder="Comment"
              value={ciForm.comment}
              onChange={(e) => setCiForm((f) => ({ ...f, comment: e.target.value }))}
            />
            <label className="detail-checkbox ci-main-check">
              <input
                type="checkbox"
                checked={ciForm.main}
                onChange={(e) => setCiForm((f) => ({ ...f, main: e.target.checked }))}
              />
              Main
            </label>
            <div className="ci-add-actions">
              <button className="save-btn" onClick={handleAddContact} disabled={ciSaving || !ciForm.data.trim()}>
                {ciSaving ? 'Saving...' : 'Save'}
              </button>
              <button className="cancel-btn" onClick={() => setAddingContact(false)} disabled={ciSaving}>Cancel</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
