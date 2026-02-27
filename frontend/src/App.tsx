import { useState } from 'react';
import AppMainRouter from './app/AppMainRouter';
import AppSidebar from './app/AppSidebar';
import { useInformationUnreadCount } from './app/useInformationUnreadCount';
import { useAppNavigation } from './app/useAppNavigation';
import { useAppPermissions } from './app/useAppPermissions';
import { useAppSession } from './app/useAppSession';
import './App.css';
import './styles/TableStyles.css';
import ColloquiumDetailView from './views/ColloquiumDetailView';
import CoordinationDetailView from './views/CoordinationDetailView';

function App() {
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
  const {
    page,
    setPage,
    selectedPatientId,
    setSelectedPatientId,
    selectedColloqiumId,
    setSelectedColloqiumId,
    selectedCoordinationId,
    setSelectedCoordinationId,
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
  });
  const { unreadCount: unreadInformationCount } = useInformationUnreadCount(Boolean(user));

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
        <p className="status">Loading...</p>
      </div>
    );
  }

  /* ── Login ── */
  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>TPL App</h1>
          <p className="subtitle">Please log in to continue</p>
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Enter your User ID (e.g. TKOORD)"
              value={extId}
              onChange={(e) => setExtId(e.target.value)}
              required
            />
            <button type="submit">Log in</button>
          </form>
          {loginError && <p className="login-error">{loginError}</p>}
        </div>
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
        onResetSelection={resetSelection}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        hasMarkedLocation={hasMarkedLocation}
        onGoBack={goBack}
        onGoForward={goForward}
        onToggleMarkedLocation={toggleMarkedLocation}
        onQuickCreateCoordination={handleQuickCreateCoordination}
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
        selectedPatientId={selectedPatientId}
        setSelectedPatientId={setSelectedPatientId}
        selectedColloqiumId={selectedColloqiumId}
        setSelectedColloqiumId={setSelectedColloqiumId}
        selectedCoordinationId={selectedCoordinationId}
        setSelectedCoordinationId={setSelectedCoordinationId}
        setPage={setPage}
        patientInitialTab={patientInitialTab}
        setPatientInitialTab={setPatientInitialTab}
        patientInitialEpisodeId={patientInitialEpisodeId}
        setPatientInitialEpisodeId={setPatientInitialEpisodeId}
        onOpenFavorite={openFavorite}
        coordinationQuickCreateToken={coordinationQuickCreateToken}
      />
    </div>
  );
}

export default App;
