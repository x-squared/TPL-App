import type { MyWorkTabKey } from './useMyWorkTabsViewModel';

interface MyWorkTabsProps {
  activeTab: MyWorkTabKey;
  setActiveTab: (tab: MyWorkTabKey) => void;
  unreadInformationCount: number;
  openTaskCount: number;
}

export default function MyWorkTabs({
  activeTab,
  setActiveTab,
  unreadInformationCount,
  openTaskCount,
}: MyWorkTabsProps) {
  return (
    <>
      <button
        className={`detail-tab ${activeTab === 'favorites' ? 'active' : ''}`}
        onClick={() => setActiveTab('favorites')}
        type="button"
      >
        Favorites
      </button>
      <button
        className={`detail-tab ${activeTab === 'tasks' ? 'active' : ''}`}
        onClick={() => setActiveTab('tasks')}
        type="button"
      >
        Tasks ({openTaskCount})
      </button>
      <button
        className={`detail-tab ${activeTab === 'information' ? 'active' : ''}`}
        onClick={() => setActiveTab('information')}
        type="button"
      >
        Information ({unreadInformationCount})
      </button>
    </>
  );
}
