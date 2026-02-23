import { useEffect, useState } from 'react';
import { api, type Patient } from '../api';
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

  const [expandedPatient, setExpandedPatient] = useState<number | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await api.listPatients();
      setPatients(data);
    } finally {
      setLoading(false);
    }
  };

  const togglePatientExpand = (id: number) => {
    setExpandedPatient(expandedPatient === id ? null : id);
  };

  const filteredPatients = patients.filter((p) => {
    if (!matchesFilter(p.pid, filterPid)) return false;
    if (!matchesFilter(p.first_name, filterFirstName)) return false;
    if (!matchesFilter(p.name, filterName)) return false;
    if (filterDob) {
      const formatted = formatDate(p.date_of_birth);
      if (!matchesFilter(formatted, filterDob)) return false;
    }
    return true;
  });

  return (
    <>
      <header>
        <h1>Patients</h1>
      </header>

      <div className="filter-bar">
        <input type="text" placeholder="PID" value={filterPid} onChange={(e) => setFilterPid(e.target.value)} />
        <input type="text" placeholder="Name" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
        <input type="text" placeholder="First name" value={filterFirstName} onChange={(e) => setFilterFirstName(e.target.value)} />
        <input type="text" placeholder="Date of birth" value={filterDob} onChange={(e) => setFilterDob(e.target.value)} />
      </div>

      {loading ? (
        <p className="status">Loading...</p>
      ) : filteredPatients.length === 0 ? (
        <p className="status">No patients match the filter.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th className="open-col"></th>
              <th>PID</th>
              <th>Name</th>
              <th>First Name</th>
              <th>Date of Birth</th>
              <th>AHV Nr.</th>
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
                  className={expandedPatient === p.id ? 'row-expanded' : ''}
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
                  <td>{p.ahv_nr || '–'}</td>
                  <td>
                    <button
                      className="link-btn"
                      onClick={() => togglePatientExpand(p.id)}
                    >
                      {p.contact_infos?.length ?? 0} {expandedPatient === p.id ? '▲' : '▼'}
                    </button>
                  </td>
                  <td>{p.lang || '–'}</td>
                  <td>{p.translate ? 'Yes' : 'No'}</td>
                </tr>
                {expandedPatient === p.id && (
                  <tr key={`${p.id}-contacts`} className="contact-row">
                    <td colSpan={9}>
                      <div className="contact-section">
                        {p.contact_infos && p.contact_infos.length > 0 ? (
                          <table className="contact-table">
                            <tbody>
                              {p.contact_infos.map((ci) => (
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
              </>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
