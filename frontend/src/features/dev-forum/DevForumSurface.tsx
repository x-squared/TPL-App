import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type AppUser, type DevRequest } from '../../api';
import { toUserErrorMessage } from '../../api/error';
import { useI18n } from '../../i18n/i18n';
import { openDevForumContextWithHighlight } from '../../views/layout/devForumHighlight';
import { getCurrentCaptureContext, withSelectedComponent } from './devForumCaptureUtils';
import { useDevForumComponentPicker } from './hooks/useDevForumComponentPicker';
import type { CapturedContextPayload, DevForumTabKey } from './types';
import CapturingTab from './tabs/CapturingTab';
import DevelopmentTab from './tabs/DevelopmentTab';
import ReviewTab from './tabs/ReviewTab';
import './DevForumSurface.css';

interface DevForumSurfaceProps {
  title: string;
  includeCapturing: boolean;
  includeClaimedByOtherDevelopers: boolean;
  enableDeveloperFilter: boolean;
  hasDevRole: boolean;
  compact?: boolean;
}

export default function DevForumSurface({
  title,
  includeCapturing,
  includeClaimedByOtherDevelopers,
  enableDeveloperFilter,
  hasDevRole,
  compact = false,
}: DevForumSurfaceProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<DevForumTabKey>(includeCapturing ? 'capturing' : 'review');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captureDraft, setCaptureDraft] = useState('');
  const [capturedContext, setCapturedContext] = useState<CapturedContextPayload | null>(null);
  const [reviewItems, setReviewItems] = useState<DevRequest[]>([]);
  const [developmentItems, setDevelopmentItems] = useState<DevRequest[]>([]);
  const [developerUsers, setDeveloperUsers] = useState<AppUser[]>([]);
  const [selectedDeveloperFilter, setSelectedDeveloperFilter] = useState<string>('all');
  const [developmentNoteDraft, setDevelopmentNoteDraft] = useState<Record<number, string>>({});
  const [developmentResponseDraft, setDevelopmentResponseDraft] = useState<Record<number, string>>({});
  const [reviewRejectDraft, setReviewRejectDraft] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const {
    pickingComponent,
    selectedComponent,
    startPicking,
    clearSelectedComponent,
  } = useDevForumComponentPicker();

  const refreshReview = useCallback(async () => {
    const data = await api.listReviewDevRequests();
    setReviewItems(data);
  }, []);

  const refreshDevelopment = useCallback(async () => {
    if (!hasDevRole) {
      setDevelopmentItems([]);
      return;
    }
    const filterId = selectedDeveloperFilter === 'all' ? null : Number(selectedDeveloperFilter);
    const data = await api.listDevelopmentDevRequests({
      include_claimed_by_other_developers: includeClaimedByOtherDevelopers,
      filter_claimed_by_user_id: Number.isFinite(filterId as number) ? filterId : null,
    });
    setDevelopmentItems(data);
  }, [hasDevRole, includeClaimedByOtherDevelopers, selectedDeveloperFilter]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        refreshReview(),
        refreshDevelopment(),
        hasDevRole && enableDeveloperFilter ? api.listUsers('DEV').then(setDeveloperUsers) : Promise.resolve(),
      ]);
    } catch (err) {
      setError(toUserErrorMessage(err, t('devForum.errors.loadFailed', 'Could not load Dev-Forum data.')));
    } finally {
      setLoading(false);
    }
  }, [enableDeveloperFilter, hasDevRole, refreshDevelopment, refreshReview, t]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const visibleTabs = useMemo<DevForumTabKey[]>(() => {
    const tabs: DevForumTabKey[] = [];
    if (includeCapturing) tabs.push('capturing');
    tabs.push('review');
    if (hasDevRole) tabs.push('development');
    return tabs;
  }, [hasDevRole, includeCapturing]);

  useEffect(() => {
    if (visibleTabs.includes(activeTab)) return;
    setActiveTab(visibleTabs[0] ?? 'review');
  }, [activeTab, visibleTabs]);

  const onCaptureContext = () => {
    setCapturedContext(getCurrentCaptureContext());
  };

  const onSubmitCapture = async () => {
    if (!capturedContext) return;
    if (!captureDraft.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.createDevRequest({
        ...capturedContext,
        capture_state_json: withSelectedComponent(capturedContext.capture_state_json, selectedComponent),
        request_text: captureDraft.trim(),
      });
      setCaptureDraft('');
      setCapturedContext(null);
      clearSelectedComponent();
      await refreshAll();
    } catch (err) {
      setError(toUserErrorMessage(err, t('devForum.errors.captureFailed', 'Could not save request.')));
    } finally {
      setSaving(false);
    }
  };

  const onClaimRequest = async (requestId: number) => {
    setSaving(true);
    setError('');
    try {
      await api.claimDevRequest(requestId);
      await refreshDevelopment();
    } catch (err) {
      setError(toUserErrorMessage(err, t('devForum.errors.claimFailed', 'Could not claim request.')));
    } finally {
      setSaving(false);
    }
  };

  const onDecision = async (requestId: number, decision: 'REJECTED' | 'IMPLEMENTED') => {
    setSaving(true);
    setError('');
    try {
      await api.decideDevRequest(requestId, {
        decision,
        developer_note_text: developmentNoteDraft[requestId] ?? '',
        developer_response_text: developmentResponseDraft[requestId] ?? '',
      });
      await refreshAll();
    } catch (err) {
      setError(toUserErrorMessage(err, t('devForum.errors.decisionFailed', 'Could not save decision.')));
    } finally {
      setSaving(false);
    }
  };

  const onReviewAccept = async (requestId: number) => {
    setSaving(true);
    setError('');
    try {
      await api.acceptDevRequestReview(requestId);
      await refreshReview();
    } catch (err) {
      setError(toUserErrorMessage(err, t('devForum.errors.reviewAcceptFailed', 'Could not accept review result.')));
    } finally {
      setSaving(false);
    }
  };

  const onReviewReject = async (requestId: number) => {
    const reviewText = (reviewRejectDraft[requestId] ?? '').trim();
    if (!reviewText) return;
    setSaving(true);
    setError('');
    try {
      await api.rejectDevRequestReview(requestId, reviewText);
      setReviewRejectDraft((prev) => ({ ...prev, [requestId]: '' }));
      await refreshAll();
    } catch (err) {
      setError(toUserErrorMessage(err, t('devForum.errors.reviewRejectFailed', 'Could not reopen request.')));
    } finally {
      setSaving(false);
    }
  };

  const onOpenContext = (item: DevRequest) => {
    openDevForumContextWithHighlight(item.capture_url || '/', item.capture_state_json);
  };

  return (
    <section className={`dev-forum-surface ${compact ? 'compact' : ''}`}>
      <header className="dev-forum-header">
        <h2 className="detail-section-heading">{title}</h2>
        <button type="button" className="patients-add-btn" onClick={() => void refreshAll()} disabled={loading || saving}>
          {t('devForum.actions.refresh', 'Refresh')}
        </button>
      </header>

      <nav className="detail-tabs">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`detail-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'capturing' ? t('devForum.tabs.capturing', 'Capturing') : null}
            {tab === 'review' ? t('devForum.tabs.review', 'Review') : null}
            {tab === 'development' ? t('devForum.tabs.development', 'Development') : null}
          </button>
        ))}
      </nav>

      {error ? <p className="dev-forum-error">{error}</p> : null}
      {loading ? <p className="status">{t('devForum.status.loading', 'Loading Dev-Forum...')}</p> : null}

      {!loading && activeTab === 'capturing' && includeCapturing ? (
        <CapturingTab
          saving={saving}
          captureDraft={captureDraft}
          capturedContext={capturedContext}
          selectedComponent={selectedComponent}
          pickingComponent={pickingComponent}
          onCaptureContext={onCaptureContext}
          onStartPicking={startPicking}
          onCaptureDraftChange={setCaptureDraft}
          onSubmitCapture={onSubmitCapture}
        />
      ) : null}

      {!loading && activeTab === 'review' ? (
        <ReviewTab
          reviewItems={reviewItems}
          saving={saving}
          reviewRejectDraft={reviewRejectDraft}
          onSetReviewRejectDraft={(requestId, next) => {
            setReviewRejectDraft((prev) => ({ ...prev, [requestId]: next }));
          }}
          onReviewAccept={onReviewAccept}
          onReviewReject={onReviewReject}
          onOpenContext={onOpenContext}
        />
      ) : null}

      {!loading && activeTab === 'development' && hasDevRole ? (
        <DevelopmentTab
          enableDeveloperFilter={enableDeveloperFilter}
          developerUsers={developerUsers}
          selectedDeveloperFilter={selectedDeveloperFilter}
          onSetSelectedDeveloperFilter={setSelectedDeveloperFilter}
          developmentItems={developmentItems}
          saving={saving}
          developmentNoteDraft={developmentNoteDraft}
          developmentResponseDraft={developmentResponseDraft}
          onSetDevelopmentNoteDraft={(requestId, next) => {
            setDevelopmentNoteDraft((prev) => ({ ...prev, [requestId]: next }));
          }}
          onSetDevelopmentResponseDraft={(requestId, next) => {
            setDevelopmentResponseDraft((prev) => ({ ...prev, [requestId]: next }));
          }}
          onClaimRequest={onClaimRequest}
          onDecision={onDecision}
          onOpenContext={onOpenContext}
          onCopyRequestText={(item) => {
            setDevelopmentNoteDraft((prev) => ({ ...prev, [item.id]: item.request_text }));
          }}
          onCopyNoteForCursor={(requestId) => {
            void navigator.clipboard.writeText(developmentNoteDraft[requestId] ?? '');
          }}
        />
      ) : null}
    </section>
  );
}
