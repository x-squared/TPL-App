import type { MyWorkTabKey } from './useMyWorkTabsViewModel';

interface MyWorkTabsProps {
  activeTab: MyWorkTabKey;
  setActiveTab: (tab: MyWorkTabKey) => void;
}

export default function MyWorkTabs({ activeTab, setActiveTab }: MyWorkTabsProps) {
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
        className={`detail-tab ${activeTab === 'information' ? 'active' : ''}`}
        onClick={() => setActiveTab('information')}
        type="button"
      >
        Information
      </button>
    </>
  );
}
