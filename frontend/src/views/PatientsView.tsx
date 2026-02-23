import { useEffect, useState } from 'react';
import { api, type Code, type Patient, type PatientCreate } from '../api';
import './PatientsView.css';

function formatDate(iso: string | null): string {
  if (!iso) return '–';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function matchesFilter(value: string, filter: string): boolean {
  if (!filter) return true;
  const f = filter.toLowerCase();
  const v = value.toLowerCase();
  if (!f.includes('*')) return v === f;
  const parts = f.split('*');
  let pos = 0;
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    const idx = v.indexOf(parts[i], pos);
    if (idx < 0) return false;
    if (i === 0 && idx !== 0) return false;
    pos = idx + parts[i].length;
  }
  if (parts[parts.length - 1] && pos !== v.length) return false;
  return true;
}

interface Props {
  onSelectPatient: (id: number) => void;
}

export default function PatientsView({ onSelectPatient }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterPid, setFilterPid] = useState('');
  const [filterFirstName, setFilterFirstName] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterDob, setFilterDob] = useState('');
  const [filterOrgan, setFilterOrgan] = useState('');
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [organCodes, setOrganCodes] = useState<Code[]>([]);
  const [filterBloodType, setFilterBloodType] = useState('');
  const [bloodTypeCatalogues, setBloodTypeCatalogues] = useState<Code[]>([]);

  const [expandedContacts, setExpandedContacts] = useState<number | null>(null);
  const [expandedEpisodes, setExpandedEpisodes] = useState<number | null>(null);
  const [addingPatient, setAddingPatient] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [createPatientError, setCreatePatientError] = useState('');
  const [newPatient, setNewPatient] = useState<PatientCreate>({
    pid: '',
    first_name: '',
    name: '',
    date_of_birth: '',
  });

  useEffect(() => {
    fetchPatients();
    api.listCodes('ORGAN').then(setOrganCodes);
    api.listCatalogues('BLOOD_TYPE').then(setBloodTypeCatalogues);
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await api.listPatients();
      setPatients(data);
    } finally {
      setLoading(false);
    }
  };

  const toggleContacts = (id: number) => {
    setExpandedContacts(expandedContacts === id ? null : id);
    setExpandedEpisodes(null);
  };

  const toggleEpisodes = (id: number) => {
    setExpandedEpisodes(expandedEpisodes === id ? null : id);
    setExpandedContacts(null);
  };

  const handleCreatePatient = async () => {
    if (!newPatient.pid?.trim() || !newPatient.first_name?.trim() || !newPatient.name?.trim() || !newPatient.date_of_birth) return;
    setCreatingPatient(true);
    setCreatePatientError('');
    try {
      await api.createPatient({
        pid: newPatient.pid.trim(),
        first_name: newPatient.first_name.trim(),
        name: newPatient.name.trim(),
        date_of_birth: newPatient.date_of_birth,
      });
      await fetchPatients();
      setNewPatient({ pid: '', first_name: '', name: '', date_of_birth: '' });
      setAddingPatient(false);
    } catch (err) {
      setCreatePatientError(err instanceof Error ? err.message : 'Could not create patient.');
    } finally {
      setCreatingPatient(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    if (!matchesFilter(p.pid, filterPid)) return false;
    if (!matchesFilter(p.first_name, filterFirstName)) return false;
    if (!matchesFilter(p.name, filterName)) return false;
    if (filterDob) {
      const formatted = formatDate(p.date_of_birth);
      if (!matchesFilter(formatted, filterDob)) return false;
    }
    if (filterBloodType && p.blood_type_id !== Number(filterBloodType)) return false;
    if (filterOrgan || filterOpenOnly) {
      const episodes = p.episodes ?? [];
      const relevant = episodes.filter((ep) => {
        if (filterOpenOnly && ep.closed) return false;
        if (filterOrgan && ep.organ_id !== Number(filterOrgan)) return false;
        return true;
      });
      if (relevant.length === 0) return false;
    }
    return true;
  });

  return (
    <>
      <header className="patients-header">
        <h1>Patients</h1>
        {!addingPatient && (
          <button className="patients-add-btn" onClick={() => setAddingPatient(true)}>+ Add Patient</button>
        )}
      </header>

      {addingPatient && (
        <div className="patients-add-form">
          <input
            type="text"
            placeholder="PID *"
            value={newPatient.pid}
            onChange={(e) => setNewPatient((p) => ({ ...p, pid: e.target.value }))}
          />
          <input
            type="text"
            placeholder="First name *"
            value={newPatient.first_name}
            onChange={(e) => setNewPatient((p) => ({ ...p, first_name: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Name *"
            value={newPatient.name}
            onChange={(e) => setNewPatient((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            type="date"
            value={newPatient.date_of_birth ?? ''}
            onChange={(e) => setNewPatient((p) => ({ ...p, date_of_birth: e.target.value }))}
          />
          <div className="patients-add-actions">
            <button
              className="patients-save-btn"
              onClick={handleCreatePatient}
              disabled={creatingPatient || !newPatient.pid?.trim() || !newPatient.first_name?.trim() || !newPatient.name?.trim() || !newPatient.date_of_birth}
            >
              {creatingPatient ? 'Saving...' : 'Save'}
            </button>
            <button
              className="patients-cancel-btn"
              onClick={() => { setAddingPatient(false); setCreatePatientError(''); }}
              disabled={creatingPatient}
            >
              Cancel
            </button>
          </div>
          {createPatientError && <p className="patients-add-error">{createPatientError}</p>}
        </div>
      )}

      <div className="filter-bar">
        <input type="text" placeholder="PID" value={filterPid} onChange={(e) => setFilterPid(e.target.value)} />
        <input type="text" placeholder="Name" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
        <input type="text" placeholder="First name" value={filterFirstName} onChange={(e) => setFilterFirstName(e.target.value)} />
        <input type="text" placeholder="Date of birth" value={filterDob} onChange={(e) => setFilterDob(e.target.value)} />
        <select className="filter-select" value={filterBloodType} onChange={(e) => setFilterBloodType(e.target.value)}>
          <option value="">Blood type...</option>
          {bloodTypeCatalogues.map((c) => <option key={c.id} value={c.id}>{c.name_default}</option>)}
        </select>
        <div className="filter-episode-filters">
          <select className="filter-select" value={filterOrgan} onChange={(e) => setFilterOrgan(e.target.value)}>
            <option value="">Organ...</option>
            {organCodes.map((c) => <option key={c.id} value={c.id}>{c.name_default}</option>)}
          </select>
          <select className="filter-select" value={filterOpenOnly ? 'open' : ''} onChange={(e) => setFilterOpenOnly(e.target.value === 'open')}>
            <option value="">All episodes</option>
            <option value="open">Open only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="status">Loading...</p>
      ) : filteredPatients.length === 0 ? (
        <p className="status">No patients match the filter.</p>
      ) : (
        <div className="patients-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th className="open-col"></th>
              <th>PID</th>
              <th>Name</th>
              <th>First Name</th>
              <th>Date of Birth</th>
              <th>Blood Type</th>
              <th>AHV Nr.</th>
              <th>Episodes</th>
              <th>Resp. Coord.</th>
              <th>Contacts</th>
              <th>Lang</th>
              <th>Translate</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p) => (
              <>
                <tr
                  key={p.id}
                  className={expandedContacts === p.id || expandedEpisodes === p.id ? 'row-expanded' : ''}
                  onDoubleClick={() => onSelectPatient(p.id)}
                >
                  <td className="open-col">
                    <button
                      className="open-btn"
                      onClick={() => onSelectPatient(p.id)}
                      title="Open patient"
                    >
                      &#x279C;
                    </button>
                  </td>
                  <td>{p.pid}</td>
                  <td>{p.name}</td>
                  <td>{p.first_name}</td>
                  <td>{formatDate(p.date_of_birth)}</td>
                  <td>{p.blood_type?.name_default || '–'}</td>
                  <td>{p.ahv_nr || '–'}</td>
                  <td>
                    {(() => {
                      const open = (p.episodes ?? []).filter((ep) => !ep.closed).sort((a, b) => (a.status?.pos ?? 999) - (b.status?.pos ?? 999));
                      return (
                        <>
                          {open.length > 0 && (
                            <span className="ep-open-indicators">
                              {open.map((ep) => ep.organ?.name_default?.substring(0, 2) ?? '??').join(' | ')}
                            </span>
                          )}
                          <button className="link-btn" onClick={() => toggleEpisodes(p.id)}>
                            {open.length} {expandedEpisodes === p.id ? '▲' : '▼'}
                          </button>
                        </>
                      );
                    })()}
                  </td>
                  <td>{p.resp_coord?.name || '–'}</td>
                  <td>
                    <button className="link-btn" onClick={() => toggleContacts(p.id)}>
                      {p.contact_infos?.length ?? 0} {expandedContacts === p.id ? '▲' : '▼'}
                    </button>
                  </td>
                  <td>{p.lang || '–'}</td>
                  <td>{p.translate ? 'Yes' : 'No'}</td>
                </tr>
                {expandedContacts === p.id && (
                  <tr key={`${p.id}-contacts`} className="contact-row">
                    <td colSpan={11}>
                      <div className="contact-section">
                        {p.contact_infos && p.contact_infos.length > 0 ? (
                          <table className="contact-table">
                            <tbody>
                              {[...p.contact_infos].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0)).map((ci) => (
                                <tr key={ci.id}>
                                  <td className="contact-main-cell">
                                    {ci.main && <span className="main-badge">Main</span>}
                                  </td>
                                  <td>{ci.type?.name_default ?? ci.type?.key ?? '–'}</td>
                                  <td>{ci.data}</td>
                                  <td>{ci.comment || '–'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="contact-empty">No contact information.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {expandedEpisodes === p.id && (
                  <tr key={`${p.id}-episodes`} className="contact-row">
                    <td colSpan={11}>
                      <div className="contact-section">
                        {p.episodes && p.episodes.length > 0 ? (
                          <table className="contact-table">
                            <thead>
                              <tr>
                                <th>Organ</th>
                                <th>Status</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Fall Nr</th>
                                <th>Closed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...p.episodes].sort((a, b) => (a.status?.pos ?? 999) - (b.status?.pos ?? 999)).map((ep) => (
                                <tr key={ep.id}>
                                  <td>{ep.organ?.name_default ?? '–'}</td>
                                  <td>{ep.status?.name_default ?? '–'}</td>
                                  <td>{formatDate(ep.start)}</td>
                                  <td>{formatDate(ep.end)}</td>
                                  <td>{ep.fall_nr || '–'}</td>
                                  <td>{ep.closed ? 'Yes' : 'No'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="contact-empty">No episodes.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </>
  );
}
