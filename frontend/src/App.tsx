import { useEffect, useMemo, useState } from 'react';
import { api, type UserPreferences } from './api';
import AppMainRouter from './app/AppMainRouter';
import AppSidebar from './app/AppSidebar';
import { useInformationUnreadCount } from './app/useInformationUnreadCount';
import { useMyWorkOpenTaskCount } from './app/useMyWorkOpenTaskCount';
import { useAppNavigation } from './app/useAppNavigation';
import { buildStartViewOptions } from './app/navigationConfig';
import type { Page } from './app/useAppNavigation';
import { useAppPermissions } from './app/useAppPermissions';
import { useAppSession } from './app/useAppSession';
import { useI18n } from './i18n/i18n';
import './App.css';
import './styles/TableStyles.css';
import ColloquiumDetailView from './views/ColloquiumDetailView';
import CoordinationDetailView from './views/CoordinationDetailView';

function App() {
  const { t, setLocale, setRuntimeTranslations } = useI18n();
  const protocolParam = new URLSearchParams(window.location.search).get('protocol');
  const coordinationProtocolParam = new URLSearchParams(window.location.search).get('coordination_protocol');
  const standaloneProtocolId = protocolParam && !Number.isNaN(Number(protocolParam))
    ? Number(protocolParam)
    : null;
  const standaloneCoordinationProtocolId = coordinationProtocolParam && !Number.isNaN(Number(coordinationProtocolParam))
    ? Number(coordinationProtocolParam)
    : null;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [coordinationQuickCreateToken, setCoordinationQuickCreateToken] = useState(0);
  const {
    user,
    authLoading,
    extId,
    setExtId,
    loginError,
    devToolsEnabled,
    handleLogin,
    handleLogout: handleSessionLogout,
  } = useAppSession('TALL');
  const {
    canViewPatients,
    canViewDonations,
    canViewColloquiums,
    canViewCoordinations,
    canViewReports,
    canViewAdmin,
  } = useAppPermissions(user);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    locale: 'en',
    start_page: 'patients',
  });
  const startViewOptions = useMemo(() => {
    return buildStartViewOptions({
      canViewPatients,
      canViewDonations,
      canViewColloquiums,
      canViewCoordinations,
      canViewReports,
      canViewAdmin,
      devToolsEnabled,
    });
  }, [canViewAdmin, canViewColloquiums, canViewCoordinations, canViewDonations, canViewPatients, canViewReports, devToolsEnabled]);
  const allowedStartPages = startViewOptions.map((option) => option.key);
  const defaultStartPage: UserPreferences['start_page'] = allowedStartPages.includes('patients') ? 'patients' : 'my-work';
  const startPagePreference: Page = allowedStartPages.includes(preferences.start_page)
    ? preferences.start_page
    : defaultStartPage;

  useEffect(() => {
    if (!user) return;
    setPreferencesLoading(true);
    api.getMyUserPreferences()
      .then(async (payload) => {
        setPreferences(payload);
        setLocale(payload.locale);
        try {
          const overrides = await api.getTranslationOverrides(payload.locale);
          setRuntimeTranslations(overrides.entries ?? {});
        } catch {
          setRuntimeTranslations({});
        }
      })
      .finally(() => setPreferencesLoading(false));
  }, [setLocale, setRuntimeTranslations, user]);

  const {
    page,
    setPage,
    selectedPatientId,
    setSelectedPatientId,
    selectedColloqiumId,
    setSelectedColloqiumId,
    selectedColloqiumTab,
    setSelectedColloqiumTab,
    selectedCoordinationId,
    setSelectedCoordinationId,
    selectedCoordinationTab,
    setSelectedCoordinationTab,
    patientInitialTab,
    setPatientInitialTab,
    patientInitialEpisodeId,
    setPatientInitialEpisodeId,
    resetSelection,
    openFavorite,
    canGoBack,
    canGoForward,
    hasMarkedLocation,
    goBack,
    goForward,
    toggleMarkedLocation,
  } = useAppNavigation({
    canViewPatients,
    canViewDonations,
    canViewColloquiums,
    canViewCoordinations,
    canViewReports,
    canViewAdmin,
    devToolsEnabled,
    startPagePreference,
  });
  const { unreadCount: unreadInformationCount } = useInformationUnreadCount(Boolean(user));
  const { openTaskCount } = useMyWorkOpenTaskCount(Boolean(user));

  const handleLogout = () => {
    handleSessionLogout();
    setUserMenuOpen(false);
  };

  const handleQuickCreateCoordination = () => {
    setPage('coordinations');
    resetSelection();
    setCoordinationQuickCreateToken((prev) => prev + 1);
  };

  /* ── Auth loading ── */
  if (authLoading) {
    return (
      <div className="login-page">
        <p className="status">{t('app.login.loading', 'Loading...')}</p>
      </div>
    );
  }

  /* ── Login ── */
  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>TPL App</h1>
          <p className="subtitle">{t('app.login.subtitle', 'Please log in to continue')}</p>
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="text"
              placeholder={t('app.login.placeholder.extId', 'Enter your User ID (e.g. TKOORD)')}
              value={extId}
              onChange={(e) => setExtId(e.target.value)}
              required
            />
            <button type="submit">{t('app.login.submit', 'Log in')}</button>
          </form>
          {loginError && <p className="login-error">{loginError}</p>}
        </div>
      </div>
    );
  }

  if (preferencesLoading) {
    return (
      <div className="login-page">
        <p className="status">{t('app.login.loading', 'Loading...')}</p>
      </div>
    );
  }

  /* ── Main app ── */
  if (standaloneProtocolId !== null) {
    return (
      <div className="app-layout app-standalone">
        <main className="main-content">
          <ColloquiumDetailView
            colloqiumId={standaloneProtocolId}
            onOpenEpisode={() => undefined}
            onBack={() => window.close()}
            standalone
          />
        </main>
      </div>
    );
  }
  if (standaloneCoordinationProtocolId !== null) {
    return (
      <div className="app-layout app-standalone">
        <main className="main-content">
          <CoordinationDetailView
            coordinationId={standaloneCoordinationProtocolId}
            onBack={() => window.close()}
            onOpenPatientEpisode={() => undefined}
            initialTab="protocol"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <AppSidebar
        user={user}
        page={page}
        setPage={setPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        canViewPatients={canViewPatients}
        canViewDonations={canViewDonations}
        canViewColloquiums={canViewColloquiums}
        canViewCoordinations={canViewCoordinations}
        canViewReports={canViewReports}
        canViewAdmin={canViewAdmin}
        devToolsEnabled={devToolsEnabled}
        unreadInformationCount={unreadInformationCount}
        openTaskCount={openTaskCount}
        onResetSelection={resetSelection}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        hasMarkedLocation={hasMarkedLocation}
        onGoBack={goBack}
        onGoForward={goForward}
        onToggleMarkedLocation={toggleMarkedLocation}
        onQuickCreateCoordination={handleQuickCreateCoordination}
        onOpenPreferences={() => {
          setPage('preferences');
          setUserMenuOpen(false);
        }}
        onLogout={handleLogout}
      />
      <AppMainRouter
        page={page}
        canViewPatients={canViewPatients}
        canViewDonations={canViewDonations}
        canViewColloquiums={canViewColloquiums}
        canViewCoordinations={canViewCoordinations}
        canViewReports={canViewReports}
        canViewAdmin={canViewAdmin}
        devToolsEnabled={devToolsEnabled}
        currentUserId={user.id}
        selectedPatientId={selectedPatientId}
        setSelectedPatientId={setSelectedPatientId}
        selectedColloqiumId={selectedColloqiumId}
        setSelectedColloqiumId={setSelectedColloqiumId}
        selectedColloqiumTab={selectedColloqiumTab}
        setSelectedColloqiumTab={setSelectedColloqiumTab}
        selectedCoordinationId={selectedCoordinationId}
        setSelectedCoordinationId={setSelectedCoordinationId}
        selectedCoordinationTab={selectedCoordinationTab}
        setSelectedCoordinationTab={setSelectedCoordinationTab}
        setPage={setPage}
        patientInitialTab={patientInitialTab}
        setPatientInitialTab={setPatientInitialTab}
        patientInitialEpisodeId={patientInitialEpisodeId}
        setPatientInitialEpisodeId={setPatientInitialEpisodeId}
        onOpenFavorite={openFavorite}
        coordinationQuickCreateToken={coordinationQuickCreateToken}
        preferences={preferences}
        startPageOptions={startViewOptions}
        onSavePreferences={async (payload) => {
          const saved = await api.updateMyUserPreferences(payload);
          setPreferences(saved);
          setLocale(saved.locale);
          try {
            const overrides = await api.getTranslationOverrides(saved.locale);
            setRuntimeTranslations(overrides.entries ?? {});
          } catch {
            setRuntimeTranslations({});
          }
        }}
      />
    </div>
  );
}

export default App;
