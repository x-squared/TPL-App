import { useEffect, useState } from 'react';
import {
  api,
  clearToken,
  getToken,
  setToken,
  type Favorite,
  type AppUser,
} from './api';
import './App.css';
import './styles/TableStyles.css';
import AdminView from './views/AdminView';
import ColloquiumDetailView from './views/ColloquiumDetailView';
import ColloquiumsView from './views/ColloquiumsView';
import CoordinationDetailView from './views/CoordinationDetailView';
import CoordinationsView from './views/CoordinationsView';
import DonationsView from './views/DonationsView';
import E2ETestsView from './views/E2ETestsView';
import MyWorkView from './views/MyWorkView';
import PatientDetailView from './views/PatientDetailView';
import PatientsView from './views/PatientsView';
import ReportsView from './views/ReportsView';
import type { PatientDetailTab } from './views/patient-detail/PatientDetailTabs';

type Page = 'my-work' | 'patients' | 'donations' | 'colloquiums' | 'coordinations' | 'reports' | 'admin' | 'e2e-tests';

function App() {
  const protocolParam = new URLSearchParams(window.location.search).get('protocol');
  const coordinationProtocolParam = new URLSearchParams(window.location.search).get('coordination_protocol');
  const standaloneProtocolId = protocolParam && !Number.isNaN(Number(protocolParam))
    ? Number(protocolParam)
    : null;
  const standaloneCoordinationProtocolId = coordinationProtocolParam && !Number.isNaN(Number(coordinationProtocolParam))
    ? Number(coordinationProtocolParam)
    : null;

  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [extId, setExtId] = useState('TALL');
  const [loginError, setLoginError] = useState('');

  const [page, setPage] = useState<Page>('patients');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedColloqiumId, setSelectedColloqiumId] = useState<number | null>(null);
  const [selectedCoordinationId, setSelectedCoordinationId] = useState<number | null>(null);
  const [patientInitialTab, setPatientInitialTab] = useState<PatientDetailTab | undefined>(undefined);
  const [patientInitialEpisodeId, setPatientInitialEpisodeId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [devToolsEnabled, setDevToolsEnabled] = useState(false);
  const hasPermission = (permissionKey: string) => !!user?.permissions?.includes(permissionKey);
  const canViewPatients = hasPermission('view.patients');
  const canViewDonations = hasPermission('view.donations');
  const canViewColloquiums = hasPermission('view.colloquiums');
  const canViewCoordinations = hasPermission('view.coordinations');
  const canViewReports = hasPermission('view.reports');
  const canViewAdmin = hasPermission('view.admin');

  useEffect(() => {
    const token = getToken();
    if (token) {
      api.getMe()
        .then(setUser)
        .catch(() => clearToken())
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    api.getHealth()
      .then((health) => {
        const env = (health.env ?? '').toUpperCase();
        setDevToolsEnabled(Boolean(health.dev_tools_enabled) || env === 'DEV' || env === 'TEST');
      })
      .catch(() => setDevToolsEnabled(false));
  }, []);

  useEffect(() => {
    if (!devToolsEnabled && page === 'e2e-tests') {
      setPage('patients');
    }
  }, [devToolsEnabled, page]);

  useEffect(() => {
    const pagePermissions: Partial<Record<Page, boolean>> = {
      patients: canViewPatients,
      donations: canViewDonations,
      colloquiums: canViewColloquiums,
      coordinations: canViewCoordinations,
      reports: canViewReports,
      admin: canViewAdmin,
    };
    const pageAllowed = pagePermissions[page];
    if (typeof pageAllowed === 'boolean' && !pageAllowed) {
      if (canViewPatients) {
        setPage('patients');
      } else {
        setPage('my-work');
      }
    }
  }, [
    canViewAdmin,
    canViewColloquiums,
    canViewCoordinations,
    canViewDonations,
    canViewPatients,
    canViewReports,
    page,
  ]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const { token, user: loggedIn } = await api.login(extId.trim());
      setToken(token);
      setUser(loggedIn);
    } catch {
      setLoginError('Unknown user. Please check your ID.');
    }
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setUserMenuOpen(false);
  };

  const openFavorite = (favorite: Favorite) => {
    if (favorite.favorite_type_key === 'PATIENT' && favorite.patient_id) {
      setPage('patients');
      setSelectedColloqiumId(null);
      setSelectedCoordinationId(null);
      setPatientInitialTab(undefined);
      setPatientInitialEpisodeId(null);
      setSelectedPatientId(favorite.patient_id);
      return;
    }
    if (favorite.favorite_type_key === 'EPISODE' && favorite.episode_id && favorite.patient_id) {
      setPage('patients');
      setSelectedColloqiumId(null);
      setSelectedCoordinationId(null);
      setSelectedPatientId(favorite.patient_id);
      setPatientInitialTab('episodes');
      setPatientInitialEpisodeId(favorite.episode_id);
      return;
    }
    if (favorite.favorite_type_key === 'COLLOQUIUM' && favorite.colloqium_id) {
      setPage('colloquiums');
      setSelectedPatientId(null);
      setSelectedCoordinationId(null);
      setPatientInitialTab(undefined);
      setPatientInitialEpisodeId(null);
      setSelectedColloqiumId(favorite.colloqium_id);
      return;
    }
    if (favorite.favorite_type_key === 'COORDINATION' && favorite.coordination_id) {
      setPage('coordinations');
      setSelectedPatientId(null);
      setSelectedColloqiumId(null);
      setPatientInitialTab(undefined);
      setPatientInitialEpisodeId(null);
      setSelectedCoordinationId(favorite.coordination_id);
    }
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
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${page === 'my-work' ? 'active' : ''}`}
            onClick={() => {
              setPage('my-work');
              setSelectedPatientId(null);
              setSelectedColloqiumId(null);
              setSelectedCoordinationId(null);
              setPatientInitialTab(undefined);
              setPatientInitialEpisodeId(null);
            }}
            title="My Work"
          >
            <span className="nav-icon">{'\u2606'}</span>
            {sidebarOpen && <span className="nav-label">My Work</span>}
          </button>
          {canViewPatients && (
            <button
              className={`nav-item ${page === 'patients' ? 'active' : ''}`}
              onClick={() => {
                setPage('patients');
                setSelectedPatientId(null);
                setSelectedColloqiumId(null);
                setSelectedCoordinationId(null);
                setPatientInitialTab(undefined);
                setPatientInitialEpisodeId(null);
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
                setSelectedPatientId(null);
                setSelectedColloqiumId(null);
                setSelectedCoordinationId(null);
                setPatientInitialTab(undefined);
                setPatientInitialEpisodeId(null);
              }}
              title="Donations"
            >
              <span className="nav-icon">{'\u25C8'}</span>
              {sidebarOpen && <span className="nav-label">Donations</span>}
            </button>
          )}
          {canViewColloquiums && (
            <button
              className={`nav-item ${page === 'colloquiums' ? 'active' : ''}`}
              onClick={() => {
                setPage('colloquiums');
                setSelectedPatientId(null);
                setSelectedCoordinationId(null);
                setPatientInitialTab(undefined);
                setPatientInitialEpisodeId(null);
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
                setSelectedPatientId(null);
                setSelectedColloqiumId(null);
                setPatientInitialTab(undefined);
                setPatientInitialEpisodeId(null);
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
                setSelectedPatientId(null);
                setSelectedColloqiumId(null);
                setSelectedCoordinationId(null);
                setPatientInitialTab(undefined);
                setPatientInitialEpisodeId(null);
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
                  setSelectedPatientId(null);
                  setSelectedColloqiumId(null);
                  setSelectedCoordinationId(null);
                  setPatientInitialTab(undefined);
                  setPatientInitialEpisodeId(null);
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
                  setSelectedPatientId(null);
                  setSelectedColloqiumId(null);
                  setSelectedCoordinationId(null);
                  setPatientInitialTab(undefined);
                  setPatientInitialEpisodeId(null);
                }}
                title="E2E Tests"
              >
                <span className="nav-icon">{'\u2699'}</span>
                {sidebarOpen && <span className="nav-label">E2E Tests</span>}
              </button>
            </>
          )}
        </nav>

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
              <button className="user-menu-action" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        {page === 'my-work' && (
          <MyWorkView onOpenFavorite={openFavorite} />
        )}
        {page === 'patients' && canViewPatients && !selectedPatientId && (
          <PatientsView
            onSelectPatient={(id) => {
              setPatientInitialTab(undefined);
              setPatientInitialEpisodeId(null);
              setSelectedPatientId(id);
            }}
          />
        )}
        {page === 'patients' && canViewPatients && selectedPatientId && (
          <PatientDetailView
            patientId={selectedPatientId}
            initialTab={patientInitialTab}
            initialEpisodeId={patientInitialEpisodeId}
            onOpenColloqium={(colloqiumId) => {
              setPage('colloquiums');
              setSelectedCoordinationId(null);
              setSelectedPatientId(null);
              setPatientInitialTab(undefined);
              setPatientInitialEpisodeId(null);
              setSelectedColloqiumId(colloqiumId);
            }}
            onBack={() => {
              setSelectedPatientId(null);
              setPatientInitialTab(undefined);
              setPatientInitialEpisodeId(null);
            }}
          />
        )}
        {page === 'donations' && canViewDonations && <DonationsView />}
        {page === 'colloquiums' && canViewColloquiums && selectedColloqiumId === null && (
          <ColloquiumsView onOpenColloqium={(id) => setSelectedColloqiumId(id)} />
        )}
        {page === 'colloquiums' && canViewColloquiums && selectedColloqiumId !== null && (
          <ColloquiumDetailView
            colloqiumId={selectedColloqiumId}
            onOpenEpisode={(patientId, episodeId) => {
              setPage('patients');
              setSelectedColloqiumId(null);
              setSelectedCoordinationId(null);
              setSelectedPatientId(patientId);
              setPatientInitialTab('episodes');
              setPatientInitialEpisodeId(episodeId);
            }}
            onBack={() => setSelectedColloqiumId(null)}
          />
        )}
        {page === 'coordinations' && canViewCoordinations && selectedCoordinationId === null && (
          <CoordinationsView onOpenCoordination={(id) => setSelectedCoordinationId(id)} />
        )}
        {page === 'coordinations' && canViewCoordinations && selectedCoordinationId !== null && (
          <CoordinationDetailView
            coordinationId={selectedCoordinationId}
            onBack={() => setSelectedCoordinationId(null)}
            onOpenPatientEpisode={(patientId, episodeId) => {
              setPage('patients');
              setSelectedColloqiumId(null);
              setSelectedPatientId(patientId);
              setPatientInitialTab('episodes');
              setPatientInitialEpisodeId(episodeId);
            }}
          />
        )}
        {page === 'reports' && canViewReports && <ReportsView />}
        {page === 'admin' && canViewAdmin && <AdminView />}
        {page === 'e2e-tests' && devToolsEnabled && <E2ETestsView />}
      </main>
    </div>
  );
}

export default App;
