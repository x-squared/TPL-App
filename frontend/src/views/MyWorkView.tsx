import type { Favorite } from '../api';
import FavoritesSection from './my-work/FavoritesSection';
import { useMyWorkViewModel } from './my-work/useMyWorkViewModel';
import './layout/PanelLayout.css';
import './PatientDetailView.css';
import './my-work/MyWorkView.css';

interface Props {
  onOpenFavorite: (favorite: Favorite) => void;
}

export default function MyWorkView({ onOpenFavorite }: Props) {
  const model = useMyWorkViewModel();

  return (
    <>
      <header className="patients-header">
        <h1>My Work</h1>
      </header>
      {model.error ? <p className="status">{model.error}</p> : null}
      {model.loading ? (
        <p className="status">Loading...</p>
      ) : (
        <FavoritesSection
          favorites={model.favorites}
          typeLabels={model.typeLabels}
          episodeFavoriteNames={model.episodeFavoriteNames}
          onOpenFavorite={onOpenFavorite}
          deletingFavoriteId={model.deletingFavoriteId}
          onDeleteFavorite={(id) => void model.deleteFavorite(id)}
        />
      )}
    </>
  );
}
