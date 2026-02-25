import { Fragment } from 'react';
import type { Colloqium, ColloqiumAgenda } from '../../../api';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

interface Props {
  rows: Colloqium[];
  expandedAgendaColloqiumId: number | null;
  agendasByColloqium: Record<number, ColloqiumAgenda[]>;
  loadingAgendasByColloqium: Record<number, boolean>;
  onOpenColloqium: (colloqiumId: number) => void;
  onToggleAgenda: (colloqiumId: number) => void;
}

function agendaEpisodeSummary(agendas: ColloqiumAgenda[]): string {
  if (agendas.length === 0) return 'No agenda entries.';
  return agendas
    .map((agenda) => agenda.episode?.fall_nr || `#${agenda.episode_id}`)
    .join(', ');
}

export default function ColloquiumsTable({
  rows,
  expandedAgendaColloqiumId,
  agendasByColloqium,
  loadingAgendasByColloqium,
  onOpenColloqium,
  onToggleAgenda,
}: Props) {
  return (
    <div className="patients-table-wrap ui-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="open-col"></th>
            <th>Type</th>
            <th>Name</th>
            <th>Date</th>
            <th>agenda</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const isAgendaExpanded = expandedAgendaColloqiumId === item.id;
            const agendas = agendasByColloqium[item.id] ?? [];
            const loadingAgenda = loadingAgendasByColloqium[item.id] === true;
            return (
              <Fragment key={item.id}>
                <tr
                  onDoubleClick={() => onOpenColloqium(item.id)}
                >
                  <td className="open-col">
                    <button
                      className="open-btn"
                      onClick={() => onOpenColloqium(item.id)}
                      title="Open colloquium"
                    >
                      &#x279C;
                    </button>
                  </td>
                  <td>{item.colloqium_type?.organ?.name_default ?? '–'}</td>
                  <td>{item.colloqium_type?.name ?? '–'}</td>
                  <td>{formatDate(item.date)}</td>
                  <td>
                    <button
                      className="link-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleAgenda(item.id);
                      }}
                    >
                      {isAgendaExpanded ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
                {isAgendaExpanded && (
                  <tr className="contact-row">
                    <td colSpan={5}>
                      <div className="contact-section">
                        {loadingAgenda ? (
                          <p className="contact-empty">Loading agenda...</p>
                        ) : (
                          <p className="contact-empty">{agendaEpisodeSummary(agendas)}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

