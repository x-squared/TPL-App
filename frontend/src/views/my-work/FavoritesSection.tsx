import type { Favorite } from '../../api';
import { useState } from 'react';
import InlineDeleteActions from '../layout/InlineDeleteActions';

interface FavoritesSectionProps {
  favorites: Favorite[];
  typeLabels: Record<string, string>;
  episodeFavoriteNames: Record<number, string>;
  onOpenFavorite: (favorite: Favorite) => void;
  deletingFavoriteId: number | null;
  onDeleteFavorite: (id: number) => void;
}

export default function FavoritesSection({
  favorites,
  typeLabels,
  episodeFavoriteNames,
  onOpenFavorite,
  deletingFavoriteId,
  onDeleteFavorite,
}: FavoritesSectionProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  return (
    <section className="detail-section ui-panel-section">
      <div className="detail-section-heading">
        <h2>Favorites</h2>
      </div>
      <table className="detail-contact-table my-work-favorites-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {favorites.length === 0 ? (
            <tr>
              <td colSpan={3} className="detail-empty">No favorites yet.</td>
            </tr>
          ) : (
            favorites.map((favorite) => (
              <tr key={favorite.id}>
                <td>{typeLabels[favorite.favorite_type_key] ?? favorite.favorite_type_key}</td>
                <td>
                  {favorite.favorite_type_key === 'EPISODE'
                    ? (episodeFavoriteNames[favorite.id] ?? favorite.name ?? '–')
                    : (favorite.name || '–')}
                </td>
                <td className="my-work-nav-cell">
                  <div className="my-work-actions">
                    <button
                      className="my-work-open-btn"
                      title="Open favorite target"
                      onClick={() => onOpenFavorite(favorite)}
                    >
                      ↗
                    </button>
                    <InlineDeleteActions
                      confirming={confirmDeleteId === favorite.id}
                      deleting={deletingFavoriteId === favorite.id}
                      onRequestDelete={() => setConfirmDeleteId(favorite.id)}
                      onConfirmDelete={() => {
                        onDeleteFavorite(favorite.id);
                        setConfirmDeleteId(null);
                      }}
                      onCancelDelete={() => setConfirmDeleteId(null)}
                    />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
