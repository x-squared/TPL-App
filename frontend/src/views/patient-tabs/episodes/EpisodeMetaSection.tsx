import type { Episode } from '../../../api';
import type { EpisodeMetaForm } from './types';

interface EpisodeMetaSectionProps {
  selectedEpisode: Episode;
  editingEpisodeMeta: boolean;
  episodeMetaForm: EpisodeMetaForm;
  setEpisodeMetaForm: React.Dispatch<React.SetStateAction<EpisodeMetaForm>>;
  detailSaving: boolean;
  startEditingEpisodeMeta: () => void;
  handleSaveEpisodeMeta: () => void;
  setEditingEpisodeMeta: React.Dispatch<React.SetStateAction<boolean>>;
  favoriteControl?: React.ReactNode;
}

export default function EpisodeMetaSection({
  selectedEpisode,
  editingEpisodeMeta,
  episodeMetaForm,
  setEpisodeMetaForm,
  detailSaving,
  startEditingEpisodeMeta,
  handleSaveEpisodeMeta,
  setEditingEpisodeMeta,
  favoriteControl,
}: EpisodeMetaSectionProps) {
  return (
    <>
      <div className="detail-section-heading">
        <div className="ui-heading-title-with-favorite">
          <h2>Episode {selectedEpisode.organ?.name_default ?? '–'}</h2>
          {favoriteControl}
        </div>
        {editingEpisodeMeta ? (
          <div className="edit-actions">
            <button
              type="button"
              className="save-btn"
              onClick={handleSaveEpisodeMeta}
              disabled={detailSaving}
            >
              {detailSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setEditingEpisodeMeta(false)}
              disabled={detailSaving}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="edit-btn" onClick={startEditingEpisodeMeta}>Edit</button>
        )}
      </div>
      <section className="episode-meta-section">
        <div className="episode-meta-grid">
          <div className="episode-detail-field episode-meta-comment">
            <span className="episode-detail-label">Comment</span>
            {editingEpisodeMeta ? (
              <textarea
                className="detail-input episode-meta-textarea"
                rows={2}
                value={episodeMetaForm.comment}
                onChange={(e) => setEpisodeMetaForm((f) => ({ ...f, comment: e.target.value }))}
              />
            ) : (
              <textarea
                className="detail-input episode-meta-textarea episode-meta-readonly"
                rows={2}
                readOnly
                value={selectedEpisode.comment ?? ''}
              />
            )}
          </div>
          <div className="episode-detail-field episode-meta-cave">
            <span className="episode-detail-label">Cave</span>
            {editingEpisodeMeta ? (
              <textarea
                className="detail-input episode-meta-textarea"
                rows={2}
                value={episodeMetaForm.cave}
                onChange={(e) => setEpisodeMetaForm((f) => ({ ...f, cave: e.target.value }))}
              />
            ) : (
              <textarea
                className="detail-input episode-meta-textarea episode-meta-readonly"
                rows={2}
                readOnly
                value={selectedEpisode.cave ?? ''}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
