import { useI18n } from '../../../i18n/i18n';
import type { DevRequest } from '../../../api';
import RichTextEditor from '../../../views/layout/RichTextEditor';

interface ReviewTabProps {
  reviewItems: DevRequest[];
  saving: boolean;
  reviewRejectDraft: Record<number, string>;
  onSetReviewRejectDraft: (requestId: number, next: string) => void;
  onReviewAccept: (requestId: number) => Promise<void>;
  onReviewReject: (requestId: number) => Promise<void>;
  onOpenContext: (item: DevRequest) => void;
  onOpenPreviousRequest: (requestId: number) => void;
}

export default function ReviewTab({
  reviewItems,
  saving,
  reviewRejectDraft,
  onSetReviewRejectDraft,
  onReviewAccept,
  onReviewReject,
  onOpenContext,
  onOpenPreviousRequest,
}: ReviewTabProps) {
  const { t } = useI18n();

  return (
    <div className="dev-forum-list">
      {reviewItems.length === 0 ? <p className="status">{t('devForum.review.empty', 'No review items right now.')}</p> : null}
      {reviewItems.map((item) => {
        const parentRequestId = item.parent_request_id;
        return (
        <article key={item.id} className="ui-panel-section dev-forum-item">
          <h3 className="detail-section-heading">
            {t('devForum.request.title', 'Request')} #{item.id}
          </h3>
          <p className="dev-forum-meta">{t('devForum.request.status', 'Status')}: {item.status}</p>
          <p className="dev-forum-meta">{t('devForum.request.guiPart', 'GUI part')}: {item.capture_gui_part || '-'}</p>
          <p className="dev-forum-text" dangerouslySetInnerHTML={{ __html: item.request_text }} />
          {item.developer_response_text ? (
            <>
              <h4 className="detail-section-heading">{t('devForum.review.developerReply', 'Developer reply')}</h4>
              <p className="dev-forum-text" dangerouslySetInnerHTML={{ __html: item.developer_response_text }} />
            </>
          ) : null}
          <div className="dev-forum-actions-row">
            <button type="button" className="patients-add-btn" onClick={() => onOpenContext(item)}>
              {t('devForum.actions.openContext', 'Open context')}
            </button>
            {parentRequestId !== null ? (
              <button type="button" className="patients-add-btn" onClick={() => onOpenPreviousRequest(parentRequestId)}>
                {t('devForum.actions.openPreviousTicket', 'Open previous ticket')}
              </button>
            ) : null}
            <button type="button" className="patients-save-btn" onClick={() => void onReviewAccept(item.id)} disabled={saving}>
              {t('devForum.review.accept', 'Accept')}
            </button>
          </div>
          <h4 className="detail-section-heading">{t('devForum.review.notAccepted', 'Not accepted')}</h4>
          <RichTextEditor
            value={reviewRejectDraft[item.id] ?? ''}
            onChange={(next) => onSetReviewRejectDraft(item.id, next)}
            ariaLabel={t('devForum.review.rejectEditorAria', 'Review reject editor')}
            boldTitle={t('devForum.editor.bold', 'Bold')}
            italicTitle={t('devForum.editor.italic', 'Italic')}
            underlineTitle={t('devForum.editor.underline', 'Underline')}
          />
          <div className="dev-forum-actions-row">
            <button type="button" className="patients-cancel-btn" onClick={() => void onReviewReject(item.id)} disabled={saving || !(reviewRejectDraft[item.id] ?? '').trim()}>
              {t('devForum.review.sendRejection', 'Send rejection and reopen')}
            </button>
          </div>
        </article>
        );
      })}
    </div>
  );
}
