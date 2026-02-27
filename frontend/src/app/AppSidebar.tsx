import type { AppUser } from '../api';

type Page = 'my-work' | 'patients' | 'donations' | 'colloquiums' | 'coordinations' | 'reports' | 'admin' | 'e2e-tests';

interface AppSidebarProps {
  user: AppUser;
  page: Page;
  setPage: (page: Page) => void;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userMenuOpen: boolean;
  setUserMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  canViewPatients: boolean;
  canViewDonations: boolean;
  canViewColloquiums: boolean;
  canViewCoordinations: boolean;
  canViewReports: boolean;
  canViewAdmin: boolean;
  devToolsEnabled: boolean;
  unreadInformationCount: number;
  onResetSelection: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  hasMarkedLocation: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onToggleMarkedLocation: () => void;
  onQuickCreateCoordination: () => void;
  onLogout: () => void;
}

export default function AppSidebar({
  user,
  page,
  setPage,
  sidebarOpen,
  setSidebarOpen,
  userMenuOpen,
  setUserMenuOpen,
  canViewPatients,
  canViewDonations,
  canViewColloquiums,
  canViewCoordinations,
  canViewReports,
  canViewAdmin,
  devToolsEnabled,
  unreadInformationCount,
  onResetSelection,
  canGoBack,
  canGoForward,
  hasMarkedLocation,
  onGoBack,
  onGoForward,
  onToggleMarkedLocation,
  onQuickCreateCoordination,
  onLogout,
}: AppSidebarProps) {
  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-top">
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Collapse' : 'Expand'}
        >
          {sidebarOpen ? '\u2039' : '\u203A'}
        </button>
        {sidebarOpen && <span className="sidebar-brand">TPL App</span>}
        {sidebarOpen && canViewCoordinations ? (
          <button
            type="button"
            className="sidebar-alert-btn"
            title="Create coordination now"
            aria-label="Create coordination now"
            onClick={onQuickCreateCoordination}
          />
        ) : null}
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${page === 'my-work' ? 'active' : ''}`}
          onClick={() => {
            setPage('my-work');
            onResetSelection();
          }}
          title={`My Work (${unreadInformationCount})`}
        >
          <span className="nav-icon">{'\u2606'}</span>
          {sidebarOpen && <span className="nav-label">{`My Work (${unreadInformationCount})`}</span>}
        </button>
        {canViewPatients && (
          <button
            className={`nav-item ${page === 'patients' ? 'active' : ''}`}
            onClick={() => {
              setPage('patients');
              onResetSelection();
            }}
            title="Recipients"
          >
            <span className="nav-icon">{'\u2695'}</span>
            {sidebarOpen && <span className="nav-label">Recipients</span>}
          </button>
        )}
        {canViewDonations && (
          <button
            className={`nav-item ${page === 'donations' ? 'active' : ''}`}
            onClick={() => {
              setPage('donations');
              onResetSelection();
            }}
            title="Donors"
          >
            <span className="nav-icon">{'\u25C8'}</span>
            {sidebarOpen && <span className="nav-label">Donors</span>}
          </button>
        )}
        {canViewColloquiums && (
          <button
            className={`nav-item ${page === 'colloquiums' ? 'active' : ''}`}
            onClick={() => {
              setPage('colloquiums');
              onResetSelection();
            }}
            title="Colloquiums"
          >
            <span className="nav-icon">{'\u2263'}</span>
            {sidebarOpen && <span className="nav-label">Colloquiums</span>}
          </button>
        )}
        {canViewCoordinations && (
          <button
            className={`nav-item ${page === 'coordinations' ? 'active' : ''}`}
            onClick={() => {
              setPage('coordinations');
              onResetSelection();
            }}
            title="Coordinations"
          >
            <span className="nav-icon">{'\u23F1'}</span>
            {sidebarOpen && <span className="nav-label">Coordinations</span>}
          </button>
        )}
        {canViewReports && (
          <button
            className={`nav-item ${page === 'reports' ? 'active' : ''}`}
            onClick={() => {
              setPage('reports');
              onResetSelection();
            }}
            title="Reports"
          >
            <span className="nav-icon">{'\u25A4'}</span>
            {sidebarOpen && <span className="nav-label">Reports</span>}
          </button>
        )}
        {canViewAdmin && (
          <>
            <div className="nav-divider-dev" aria-hidden="true">
              <span className="nav-divider-line" />
              {sidebarOpen && <span className="nav-divider-label">ADMIN</span>}
              <span className="nav-divider-line" />
            </div>
            <button
              className={`nav-item ${page === 'admin' ? 'active' : ''}`}
              onClick={() => {
                setPage('admin');
                onResetSelection();
              }}
              title="Admin"
            >
              <span className="nav-icon">{'\u2699'}</span>
              {sidebarOpen && <span className="nav-label">Admin</span>}
            </button>
          </>
        )}
        {devToolsEnabled && (
          <>
            <div className="nav-divider-dev" aria-hidden="true">
              <span className="nav-divider-line" />
              {sidebarOpen && <span className="nav-divider-label">DEV</span>}
              <span className="nav-divider-line" />
            </div>
            <button
              className={`nav-item ${page === 'e2e-tests' ? 'active' : ''}`}
              onClick={() => {
                setPage('e2e-tests');
                onResetSelection();
              }}
              title="E2E Tests"
            >
              <span className="nav-icon">{'\u2699'}</span>
              {sidebarOpen && <span className="nav-label">E2E Tests</span>}
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-history" aria-label="Navigation history">
        <button
          className={`history-nav-btn ${canGoBack ? 'enabled' : 'disabled'}`}
          onClick={onGoBack}
          disabled={!canGoBack}
          title="Go back"
          type="button"
        >
          {canGoBack ? '\u25C0' : '\u25C1'}
        </button>
        <button
          className={`history-nav-btn history-mark-btn ${hasMarkedLocation ? 'enabled' : 'disabled'}`}
          onClick={onToggleMarkedLocation}
          title={hasMarkedLocation ? 'Return to marked location' : 'Mark current location'}
          type="button"
        >
          {hasMarkedLocation ? '\u25CF' : '\u25CB'}
        </button>
        <button
          className={`history-nav-btn ${canGoForward ? 'enabled' : 'disabled'}`}
          onClick={onGoForward}
          disabled={!canGoForward}
          title="Go forward"
          type="button"
        >
          {canGoForward ? '\u25B6' : '\u25B7'}
        </button>
      </div>

      <div className="sidebar-bottom">
        <button
          className="nav-item user-trigger"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          title={user.name}
        >
          <span className="nav-icon user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </span>
          {sidebarOpen && <span className="nav-label">{user.name}</span>}
        </button>
        {userMenuOpen && (
          <div className="user-menu">
            <div className="user-menu-info">
              <strong>{user.name}</strong>
              <span>{user.ext_id}</span>
            </div>
            <button className="user-menu-action" onClick={onLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
