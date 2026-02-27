import type { ProtocolOverviewEntry } from './CoordinationProtocolOverviewSection';

interface CoordinationProtocolTasksPanelProps {
  entries: ProtocolOverviewEntry[];
}

export default function CoordinationProtocolTasksPanel({ entries }: CoordinationProtocolTasksPanelProps) {
  return (
    <section className="coord-protocol-pane">
      {entries.length === 0 ? (
        <p className="detail-empty">No protocol tasks for this organ.</p>
      ) : (
        <ul className="coord-protocol-compact-list">
          {entries.map((entry) => (
            <li key={entry.id}>
              Verify RS-nr {entry.rsNr} for {entry.recipientName}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
