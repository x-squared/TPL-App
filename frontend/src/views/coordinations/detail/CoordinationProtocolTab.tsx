import { useEffect, useMemo, useState } from 'react';
import type { ProtocolOverviewEntry } from './CoordinationProtocolOverviewSection';
import CoordinationProtocolDataPanel from './CoordinationProtocolDataPanel';
import CoordinationProtocolEventLogPanel from './CoordinationProtocolEventLogPanel';
import CoordinationProtocolTasksPanel from './CoordinationProtocolTasksPanel';

interface ProtocolOverviewGroup {
  organ: { id: number; name_default: string };
  entries: ProtocolOverviewEntry[];
}

interface CoordinationProtocolTabProps {
  coordinationId: number;
  groups: ProtocolOverviewGroup[];
  onOpenPatientEpisode: (patientId: number, episodeId: number) => void;
}

export default function CoordinationProtocolTab({ coordinationId, groups, onOpenPatientEpisode }: CoordinationProtocolTabProps) {
  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.organ.name_default.localeCompare(b.organ.name_default)),
    [groups],
  );
  const [activeOrganId, setActiveOrganId] = useState<number | null>(sortedGroups[0]?.organ.id ?? null);

  useEffect(() => {
    if (!sortedGroups.some((group) => group.organ.id === activeOrganId)) {
      setActiveOrganId(sortedGroups[0]?.organ.id ?? null);
    }
  }, [activeOrganId, sortedGroups]);

  if (sortedGroups.length === 0) {
    return (
      <section className="detail-section ui-panel-section">
        <p className="detail-empty">No organs found.</p>
      </section>
    );
  }

  const activeGroup = sortedGroups.find((group) => group.organ.id === activeOrganId) ?? sortedGroups[0];

  return (
    <section className="detail-section ui-panel-section coord-protocol-shell">
      <nav className="coord-protocol-organ-tabs">
        {sortedGroups.map((group) => (
          <button
            key={group.organ.id}
            type="button"
            className={`coord-protocol-organ-tab ${group.organ.id === activeGroup.organ.id ? 'active' : ''}`}
            onClick={() => setActiveOrganId(group.organ.id)}
          >
            {group.organ.name_default}
          </button>
        ))}
      </nav>
      <div className="coord-protocol-layout">
        <div className="coord-protocol-left">
          <CoordinationProtocolDataPanel />
        </div>
        <div className="coord-protocol-right">
          <CoordinationProtocolEventLogPanel
            coordinationId={coordinationId}
            organId={activeGroup.organ.id}
          />
          <CoordinationProtocolTasksPanel entries={activeGroup.entries} />
        </div>
      </div>
    </section>
  );
}
