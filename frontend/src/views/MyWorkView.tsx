import type { Favorite } from '../api';
import InformationRowsSection from './information/InformationRowsSection';
import FavoritesSection from './my-work/FavoritesSection';
import MyWorkTabs from './my-work/MyWorkTabs';
import { useMyWorkPageViewModel } from './my-work/useMyWorkPageViewModel';
import './layout/PanelLayout.css';
import './PatientDetailView.css';
import './InformationView.css';
import './my-work/MyWorkView.css';

interface Props {
  onOpenFavorite: (favorite: Favorite) => void;
}

export default function MyWorkView({ onOpenFavorite }: Props) {
  const model = useMyWorkPageViewModel();

  return (
    <>
      <header className="patients-header">
        <h1>My Work</h1>
      </header>
      <div className="detail-tabs my-work-tabs">
        <MyWorkTabs activeTab={model.tabs.activeTab} setActiveTab={model.tabs.setActiveTab} />
      </div>
      {model.tabs.activeTab === 'favorites' && model.favorites.error ? <p className="status">{model.favorites.error}</p> : null}
      {model.tabs.activeTab === 'favorites' && model.favorites.loading ? (
        <p className="status">Loading...</p>
      ) : null}
      {model.tabs.activeTab === 'favorites' && !model.favorites.loading ? (
        <FavoritesSection
          favorites={model.favorites.favorites}
          typeLabels={model.favorites.typeLabels}
          episodeFavoriteNames={model.favorites.episodeFavoriteNames}
          onOpenFavorite={onOpenFavorite}
          deletingFavoriteId={model.favorites.deletingFavoriteId}
          draggingFavoriteId={model.favorites.draggingFavoriteId}
          dragOverFavoriteId={model.favorites.dragOverFavoriteId}
          setDraggingFavoriteId={model.favorites.setDraggingFavoriteId}
          setDragOverFavoriteId={model.favorites.setDragOverFavoriteId}
          onDropFavorite={(id) => void model.favorites.reorderFavorites(id)}
          onDeleteFavorite={(id) => void model.favorites.deleteFavorite(id)}
        />
      ) : null}
      {model.tabs.activeTab === 'information' ? <InformationRowsSection model={model.information} /> : null}
    </>
  );
}
