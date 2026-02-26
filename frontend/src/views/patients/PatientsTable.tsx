import React from 'react';
import type { Patient, PatientListItem } from '../../api';
import { formatDate } from './patientsViewUtils';
import { formatOrganNames } from '../layout/episodeDisplay';

interface Props {
  filteredPatients: PatientListItem[];
  expandedContacts: number | null;
  expandedEpisodes: number | null;
  selectedTaskPatientId: number | null;
  setSelectedTaskPatientId: React.Dispatch<React.SetStateAction<number | null>>;
  onSelectPatient: (id: number) => void;
  toggleEpisodes: (id: number) => void;
  toggleContacts: (id: number) => void;
  loadingDetails: Record<number, boolean>;
  patientDetails: Record<number, Patient>;
}

export default function PatientsTable({
  filteredPatients,
  expandedContacts,
  expandedEpisodes,
  selectedTaskPatientId,
  setSelectedTaskPatientId,
  onSelectPatient,
  toggleEpisodes,
  toggleContacts,
  loadingDetails,
  patientDetails,
}: Props) {
  return (
    <div className="patients-table-wrap ui-table-wrap">
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
            <React.Fragment key={p.id}>
              <tr
                className={`${expandedContacts === p.id || expandedEpisodes === p.id ? 'row-expanded' : ''} ${selectedTaskPatientId === p.id ? 'row-selected-for-tasks' : ''}`}
                onDoubleClick={() => onSelectPatient(p.id)}
                onClick={() => setSelectedTaskPatientId((prev) => (prev === p.id ? null : p.id))}
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
                  <>
                    {p.open_episode_count > 0 && (
                      <span className="ep-open-indicators">
                        {p.open_episode_indicators.join(' | ')}
                      </span>
                    )}
                    <button className="link-btn" onClick={() => toggleEpisodes(p.id)}>
                      {p.open_episode_count} {expandedEpisodes === p.id ? '▲' : '▼'}
                    </button>
                  </>
                </td>
                <td>{p.resp_coord?.name || '–'}</td>
                <td>
                  <button className="link-btn" onClick={() => toggleContacts(p.id)}>
                    {p.contact_info_count ?? 0} {expandedContacts === p.id ? '▲' : '▼'}
                  </button>
                </td>
                <td>{p.lang || '–'}</td>
                <td>{p.translate ? 'Yes' : 'No'}</td>
              </tr>
              {expandedContacts === p.id && (
                <tr className="contact-row">
                  <td colSpan={11}>
                    <div className="contact-section">
                      {loadingDetails[p.id] ? (
                        <p className="contact-empty">Loading contact information...</p>
                      ) : patientDetails[p.id]?.contact_infos && patientDetails[p.id].contact_infos.length > 0 ? (
                        <table className="contact-table">
                          <tbody>
                            {[...patientDetails[p.id].contact_infos].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0)).map((ci) => (
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
                <tr className="contact-row">
                  <td colSpan={11}>
                    <div className="contact-section">
                      {loadingDetails[p.id] ? (
                        <p className="contact-empty">Loading episodes...</p>
                      ) : patientDetails[p.id]?.episodes && patientDetails[p.id].episodes.length > 0 ? (
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
                            {[...patientDetails[p.id].episodes].sort((a, b) => (a.status?.pos ?? 999) - (b.status?.pos ?? 999)).map((ep) => (
                              <tr key={ep.id}>
                                <td>{formatOrganNames(ep.organs, ep.organ?.name_default ?? null)}</td>
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
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
