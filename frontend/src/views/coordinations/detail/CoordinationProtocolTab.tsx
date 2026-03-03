import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/i18n';
import type { ProtocolOverviewEntry } from './CoordinationProtocolOverviewSection';
import CoordinationProtocolDataPanel from './CoordinationProtocolDataPanel';
import CoordinationProtocolEventLogPanel from './CoordinationProtocolEventLogPanel';
import CoordinationProtocolTasksPanel from './CoordinationProtocolTasksPanel';

const ENGLISH_ORGAN_LABEL_BY_KEY: Record<string, string> = {
  KIDNEY: 'Kidney',
  PANCREAS: 'Pancreas',
  LIVER: 'Liver',
  HEART: 'Heart',
  HEART_VALVE: 'Heart valve',
  LUNG: 'Lung',
  ISLET: 'Islet cells',
  VESSELS: 'Vessels',
  INTESTINE: 'Intestine',
};

interface ProtocolOverviewGroup {
  organ: { id: number; key?: string; name_default: string; pos?: number | null };
  entries: ProtocolOverviewEntry[];
}

interface CoordinationProtocolTabProps {
  coordinationId: number;
  groups: ProtocolOverviewGroup[];
  onOpenPatientEpisode: (patientId: number, episodeId: number) => void;
}

export default function CoordinationProtocolTab({ coordinationId, groups, onOpenPatientEpisode }: CoordinationProtocolTabProps) {
  const { t } = useI18n();
  void onOpenPatientEpisode;
  const getOrganLabel = (organ: ProtocolOverviewGroup['organ']): string => {
    const key = (organ.key ?? '').trim().toUpperCase();
    if (!key) return organ.name_default;
    return t(`coordinations.protocolOverview.organByKey.${key}`, ENGLISH_ORGAN_LABEL_BY_KEY[key] ?? organ.name_default);
  };
  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => {
      const ap = a.organ.pos ?? Number.MAX_SAFE_INTEGER;
      const bp = b.organ.pos ?? Number.MAX_SAFE_INTEGER;
      return ap - bp || getOrganLabel(a.organ).localeCompare(getOrganLabel(b.organ));
    }),
    [groups, t],
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
        <p className="detail-empty">{t('coordinations.protocolOverview.noOrgans', 'No organs found.')}</p>
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
            {getOrganLabel(group.organ)}
          </button>
        ))}
      </nav>
      <div className="coord-protocol-layout">
        <div className="coord-protocol-left">
          <CoordinationProtocolDataPanel coordinationId={coordinationId} organId={activeGroup.organ.id} />
        </div>
        <div className="coord-protocol-right">
          <CoordinationProtocolEventLogPanel
            coordinationId={coordinationId}
            organId={activeGroup.organ.id}
          />
          <CoordinationProtocolTasksPanel coordinationId={coordinationId} organId={activeGroup.organ.id} />
        </div>
      </div>
    </section>
  );
}
