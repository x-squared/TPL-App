import React from 'react';
import type { Patient, PatientListItem } from '../../api';
import { formatDate } from './patientsViewUtils';
import { formatOrganNames } from '../layout/episodeDisplay';
import { useI18n } from '../../i18n/i18n';

interface Props {
  filteredPatients: PatientListItem[];
  expandedContacts: number | null;
  expandedEpisodes: number | null;
  expandedMedical: number | null;
  selectedTaskPatientId: number | null;
  setSelectedTaskPatientId: React.Dispatch<React.SetStateAction<number | null>>;
  onSelectPatient: (id: number) => void;
  toggleEpisodes: (id: number) => void;
  toggleContacts: (id: number) => void;
  toggleMedical: (id: number) => void;
  loadingDetails: Record<number, boolean>;
  patientDetails: Record<number, Patient>;
}

export default function PatientsTable({
  filteredPatients,
  expandedContacts,
  expandedEpisodes,
  expandedMedical,
  selectedTaskPatientId,
  setSelectedTaskPatientId,
  onSelectPatient,
  toggleEpisodes,
  toggleContacts,
  toggleMedical,
  loadingDetails,
  patientDetails,
}: Props) {
  const { t } = useI18n();
  const medicalSummary = (p: PatientListItem) => {
    const entries = p.static_medical_values ?? [];
    if (!entries.length) return t('common.emptySymbol', '–');
    return entries[0].value || t('common.emptySymbol', '–');
  };

  return (
    <div className="patients-table-wrap ui-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="open-col"></th>
            <th>{t('patients.table.pid', 'PID')}</th>
            <th>{t('patients.table.name', 'Name')}</th>
            <th>{t('patients.table.firstName', 'First Name')}</th>
            <th>{t('patients.table.dateOfBirth', 'Date of Birth')}</th>
            <th>{t('patients.table.ahvNr', 'AHV Nr.')}</th>
            <th>{t('patients.table.medical', 'Medical')}</th>
            <th>{t('patients.table.episodes', 'Episodes')}</th>
            <th>{t('patients.table.respCoord', 'Resp. Coord.')}</th>
            <th>{t('patients.table.contacts', 'Contacts')}</th>
            <th>{t('patients.table.language', 'Lang')}</th>
            <th>{t('patients.table.translate', 'Translate')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredPatients.map((p) => (
            <React.Fragment key={p.id}>
              <tr
                className={`${expandedContacts === p.id || expandedEpisodes === p.id || expandedMedical === p.id ? 'row-expanded' : ''} ${selectedTaskPatientId === p.id ? 'row-selected-for-tasks' : ''}`}
                onDoubleClick={() => onSelectPatient(p.id)}
                onClick={() => setSelectedTaskPatientId((prev) => (prev === p.id ? null : p.id))}
              >
                <td className="open-col">
                  <button
                    className="open-btn"
                    onClick={() => onSelectPatient(p.id)}
                    title={t('patients.actions.openPatient', 'Open patient')}
                  >
                    &#x279C;
                  </button>
                </td>
                <td>{p.pid}</td>
                <td>{p.name}</td>
                <td>{p.first_name}</td>
                <td>{formatDate(p.date_of_birth)}</td>
                <td>{p.ahv_nr || t('common.emptySymbol', '–')}</td>
                <td className="patients-static-medical-cell">
                  {(p.static_medical_values?.length ?? 0) > 0 ? (
                    <button className="link-btn" onClick={() => toggleMedical(p.id)}>
                      {medicalSummary(p)} {expandedMedical === p.id ? '▲' : '▼'}
                    </button>
                  ) : (
                    t('common.emptySymbol', '–')
                  )}
                </td>
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
                <td>{p.resp_coord?.name || t('common.emptySymbol', '–')}</td>
                <td>
                  <button className="link-btn" onClick={() => toggleContacts(p.id)}>
                    {p.contact_info_count ?? 0} {expandedContacts === p.id ? '▲' : '▼'}
                  </button>
                </td>
                <td>{p.lang || t('common.emptySymbol', '–')}</td>
                <td>{p.translate ? t('common.yes', 'Yes') : t('common.no', 'No')}</td>
              </tr>
              {expandedContacts === p.id && (
                <tr className="contact-row">
                  <td colSpan={12}>
                    <div className="contact-section">
                      {loadingDetails[p.id] ? (
                        <p className="contact-empty">{t('patients.contact.loading', 'Loading contact information...')}</p>
                      ) : patientDetails[p.id]?.contact_infos && patientDetails[p.id].contact_infos.length > 0 ? (
                        <table className="contact-table">
                          <tbody>
                            {[...patientDetails[p.id].contact_infos].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0)).map((ci) => (
                              <tr key={ci.id}>
                                <td className="contact-main-cell">
                                  {ci.main && <span className="main-badge">{t('patients.contact.main', 'Main')}</span>}
                                </td>
                                <td>{ci.type?.name_default ?? ci.type?.key ?? t('common.emptySymbol', '–')}</td>
                                <td>{ci.data}</td>
                                <td>{ci.comment || t('common.emptySymbol', '–')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="contact-empty">{t('patients.contact.empty', 'No contact information.')}</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {expandedMedical === p.id && (
                <tr className="contact-row">
                  <td colSpan={12}>
                    <div className="contact-section">
                      {p.static_medical_values?.length ? (
                        <table className="contact-table">
                          <thead>
                            <tr>
                              <th>{t('patients.medicalTable.name', 'Name')}</th>
                              <th>{t('patients.medicalTable.value', 'Value')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.static_medical_values.map((entry, idx) => (
                              <tr key={`${p.id}-mv-${idx}`}>
                                <td>{entry.name}</td>
                                <td>{entry.value || t('common.emptySymbol', '–')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="contact-empty">{t('patients.medicalTable.empty', 'No medical values.')}</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {expandedEpisodes === p.id && (
                <tr className="contact-row">
                  <td colSpan={12}>
                    <div className="contact-section">
                      {loadingDetails[p.id] ? (
                        <p className="contact-empty">{t('patients.episodes.loading', 'Loading episodes...')}</p>
                      ) : patientDetails[p.id]?.episodes && patientDetails[p.id].episodes.length > 0 ? (
                        <table className="contact-table">
                          <thead>
                            <tr>
                              <th>{t('patients.episodes.organ', 'Organ')}</th>
                              <th>{t('patients.episodes.status', 'Status')}</th>
                              <th>{t('patients.episodes.start', 'Start')}</th>
                              <th>{t('patients.episodes.end', 'End')}</th>
                              <th>{t('patients.episodes.fallNr', 'Fall Nr')}</th>
                              <th>{t('patients.episodes.closed', 'Closed')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...patientDetails[p.id].episodes].sort((a, b) => (a.status?.pos ?? 999) - (b.status?.pos ?? 999)).map((ep) => (
                              <tr key={ep.id}>
                                <td>{formatOrganNames(ep.organs, ep.organ?.name_default ?? null)}</td>
                                <td>{ep.status?.name_default ?? t('common.emptySymbol', '–')}</td>
                                <td>{formatDate(ep.start)}</td>
                                <td>{formatDate(ep.end)}</td>
                                <td>{ep.fall_nr || t('common.emptySymbol', '–')}</td>
                                <td>{ep.closed ? t('common.yes', 'Yes') : t('common.no', 'No')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="contact-empty">{t('patients.episodes.empty', 'No episodes.')}</p>
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
