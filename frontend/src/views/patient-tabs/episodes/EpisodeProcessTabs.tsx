import type { EpisodeDetailTab } from './types';
import { useI18n } from '../../../i18n/i18n';

interface EpisodeProcessTabsProps {
  episodeDetailTabs: readonly EpisodeDetailTab[];
  activeEpisodeTab: EpisodeDetailTab;
  setActiveEpisodeTab: React.Dispatch<React.SetStateAction<EpisodeDetailTab>>;
  editingDetailTab: EpisodeDetailTab | null;
  detailSaving: boolean;
  handleSaveDetailTab: () => void;
  setEditingDetailTab: React.Dispatch<React.SetStateAction<EpisodeDetailTab | null>>;
  startEditingDetailTab: (tab: EpisodeDetailTab) => void;
  setDetailSaveError: (message: string) => void;
}

export default function EpisodeProcessTabs({
  episodeDetailTabs,
  activeEpisodeTab,
  setActiveEpisodeTab,
  editingDetailTab,
  detailSaving,
  handleSaveDetailTab,
  setEditingDetailTab,
  startEditingDetailTab,
  setDetailSaveError,
}: EpisodeProcessTabsProps) {
  const { t } = useI18n();
  const tabLabel = (tab: EpisodeDetailTab): string => {
    if (tab === 'Evaluation') return t('episode.tabs.evaluation', 'Evaluation');
    if (tab === 'Listing') return t('episode.tabs.listing', 'Listing');
    if (tab === 'Transplantation') return t('episode.tabs.transplantation', 'Transplantation');
    if (tab === 'Follow-Up') return t('episode.tabs.followUp', 'Follow-Up');
    return t('episode.tabs.closed', 'Closed');
  };
  return (
    <div className="episode-tabs-header-row">
      <div className="episode-process-tabs" role="tablist" aria-label={t('episode.processTabs.ariaLabel', 'Episode process tabs')}>
        {episodeDetailTabs.map((tab, idx) => (
          <div key={tab} className="episode-process-step">
            <button
              role="tab"
              aria-selected={activeEpisodeTab === tab}
              className={`episode-process-tab ${activeEpisodeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveEpisodeTab(tab)}
            >
              {tabLabel(tab)}
            </button>
            {idx < episodeDetailTabs.length - 1 && (
              <span className="episode-process-arrow" aria-hidden="true">→</span>
            )}
          </div>
        ))}
      </div>
      <div className="episode-tab-actions">
        {editingDetailTab === activeEpisodeTab ? (
          <div className="edit-actions">
            <button
              type="button"
              className="save-btn"
              onClick={handleSaveDetailTab}
              disabled={detailSaving}
            >
              {detailSaving ? t('coordinations.form.saving', 'Saving...') : t('actions.save', 'Save')}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setEditingDetailTab(null)}
              disabled={detailSaving}
            >
              {t('actions.cancel', 'Cancel')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="edit-btn"
            onClick={() => {
              setDetailSaveError('');
              startEditingDetailTab(activeEpisodeTab);
            }}
          >
            {t('actions.edit', 'Edit')}
          </button>
        )}
      </div>
    </div>
  );
}
