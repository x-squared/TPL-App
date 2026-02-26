import type { Code } from '../../../api';

export interface ProtocolOverviewEntry {
  id: number;
  patientId: number | null;
  episodeId: number | null;
  recipientName: string;
  fallNr: string;
  birthDate: string;
  mainDiagnosis: string;
  rsNr: string;
  tplDate: string;
  procurementTeam: string;
  perfusionDone: boolean;
  perfusionApplied: string;
}

interface ProtocolOverviewGroup {
  organ: Code;
  entries: ProtocolOverviewEntry[];
}

interface Props {
  groups: ProtocolOverviewGroup[];
  onOpenPatientEpisode: (patientId: number, episodeId: number) => void;
}

export default function CoordinationProtocolOverviewSection({ groups, onOpenPatientEpisode }: Props) {
  return (
    <section className="detail-section ui-panel-section">
      <div className="detail-section-heading">
        <h2>Protocol Overview</h2>
      </div>
      <div className="coord-protocol-overview">
        {groups.length === 0 ? (
          <p className="detail-empty">No organs found.</p>
        ) : (
          groups.map(({ organ, entries }) => (
            <fieldset key={organ.id} className="coord-protocol-organ-box">
              <legend>{organ.name_default}</legend>
              {entries.length === 0 ? (
                <p className="detail-empty">No protocol data for this organ.</p>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="coord-protocol-entry">
                    <div className="coord-protocol-entry-actions">
                      <button
                        className="coord-protocol-open-btn"
                        onClick={() => {
                          if (entry.patientId != null && entry.episodeId != null) {
                            onOpenPatientEpisode(entry.patientId, entry.episodeId);
                          }
                        }}
                        disabled={entry.patientId == null || entry.episodeId == null}
                        title="Open linked episode"
                      >
                        Open
                      </button>
                    </div>
                    <div className="coord-protocol-entry-grid">
                      <div className="detail-field">
                        <span className="detail-label">Recipient full name</span>
                        <span className="detail-value">{entry.recipientName}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Fallnummer</span>
                        <span className="detail-value">{entry.fallNr}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Date of birth</span>
                        <span className="detail-value">{entry.birthDate}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Diagnosis (main)</span>
                        <span className="detail-value">{entry.mainDiagnosis}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">RS-nr</span>
                        <span className="detail-value">{entry.rsNr}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">TPL date</span>
                        <span className="detail-value">{entry.tplDate}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Procurement team</span>
                        <span className="detail-value">{entry.procurementTeam}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">Perfusion applied</span>
                        <span className="detail-value">
                          {entry.perfusionApplied}
                          {entry.perfusionDone ? (
                            <span className="coord-protocol-badge" title="Perfusion applied">
                              Perfusion
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </fieldset>
          ))
        )}
      </div>
    </section>
  );
}
