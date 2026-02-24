import type { EpisodeDetailTab } from './types';

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
  return (
    <div className="episode-tabs-header-row">
      <div className="episode-process-tabs" role="tablist" aria-label="Episode process tabs">
        {episodeDetailTabs.map((tab, idx) => (
          <div key={tab} className="episode-process-step">
            <button
              role="tab"
              aria-selected={activeEpisodeTab === tab}
              className={`episode-process-tab ${activeEpisodeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveEpisodeTab(tab)}
            >
              {tab}
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
              {detailSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setEditingDetailTab(null)}
              disabled={detailSaving}
            >
              Cancel
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
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
