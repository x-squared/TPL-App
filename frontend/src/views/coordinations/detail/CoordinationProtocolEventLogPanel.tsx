import { useEffect, useRef, useState } from 'react';
import { api, type CoordinationProtocolEventLog } from '../../../api';
import { toUserErrorMessage } from '../../../api/error';

interface CoordinationProtocolEventLogPanelProps {
  coordinationId: number;
  organId: number;
}

export default function CoordinationProtocolEventLogPanel({
  coordinationId,
  organId,
}: CoordinationProtocolEventLogPanelProps) {
  const [entries, setEntries] = useState<CoordinationProtocolEventLog[]>([]);
  const [draftEvent, setDraftEvent] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const rows = await api.listCoordinationProtocolEvents(coordinationId, organId);
        setEntries(rows);
      } catch (err) {
        setError(toUserErrorMessage(err, 'Failed to load protocol event log.'));
      }
    };
    void load();
  }, [coordinationId, organId]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = 0;
  }, [entries]);

  const submitEvent = async () => {
    const text = draftEvent.trim();
    if (!text) return;
    try {
      const created = await api.createCoordinationProtocolEvent(coordinationId, {
        organ_id: organId,
        event: text,
        task_id: null,
      });
      setDraftEvent('');
      setEntries((prev) => [created, ...prev]);
      setError('');
    } catch (err) {
      setError(toUserErrorMessage(err, 'Failed to save protocol event.'));
    }
  };

  const formatTimeOfDay = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--:--:--';
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <section className="coord-protocol-pane">
      <div className={`coord-event-input-row ${focused ? 'alert' : ''}`}>
        <input
          className={`detail-input coord-event-input ${focused ? 'alert' : ''}`}
          value={draftEvent}
          placeholder="Type event..."
          onFocus={() => setFocused(true)}
          onBlur={() => {
            void submitEvent();
            setFocused(false);
          }}
          onChange={(event) => setDraftEvent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void submitEvent();
              return;
            }
            if (event.key === 'Tab') {
              void submitEvent();
            }
          }}
        />
      </div>
      {error ? <p className="status">{error}</p> : null}
      <div className="coord-event-log-list" ref={listRef}>
        {entries.length === 0 ? (
          <p className="detail-empty">No event log entries for this organ.</p>
        ) : (
          <ul className="coord-protocol-compact-list coord-event-log-list-items">
            {entries.map((entry) => (
              <li key={entry.id} className="coord-event-log-item">
                <span className="coord-event-log-text">{entry.event}</span>
                <span className="coord-event-log-time">{formatTimeOfDay(entry.time)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
