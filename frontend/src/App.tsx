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
import ColloquiumDetailView from './views/ColloquiumDetailView';
import ColloquiumsView from './views/ColloquiumsView';
import CoordinationDetailView from './views/CoordinationDetailView';
import CoordinationsView from './views/CoordinationsView';
import MyWorkView from './views/MyWorkView';
import PatientDetailView from './views/PatientDetailView';
import PatientsView from './views/PatientsView';
import type { PatientDetailTab } from './views/patient-detail/PatientDetailTabs';

type Page = 'my-work' | 'patients' | 'colloquiums' | 'coordinations';

function App() {
  const protocolParam = new URLSearchParams(window.location.search).get('protocol');
  const standaloneProtocolId = protocolParam && !Number.isNaN(Number(protocolParam))
    ? Number(protocolParam)
    : null;

  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [extId, setExtId] = useState('TKOORD');
  const [loginError, setLoginError] = useState('');

  const [page, setPage] = useState<Page>('patients');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedColloqiumId, setSelectedColloqiumId] = useState<number | null>(null);
  const [selectedCoordinationId, setSelectedCoordinationId] = useState<number | null>(null);
  const [patientInitialTab, setPatientInitialTab] = useState<PatientDetailTab | undefined>(undefined);
  const [patientInitialEpisodeId, setPatientInitialEpisodeId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
            onBack={() => window.close()}
            standalone
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
        {page === 'patients' && !selectedPatientId && (
          <PatientsView
            onSelectPatient={(id) => {
              setPatientInitialTab(undefined);
              setPatientInitialEpisodeId(null);
              setSelectedPatientId(id);
            }}
          />
        )}
        {page === 'patients' && selectedPatientId && (
          <PatientDetailView
            patientId={selectedPatientId}
            initialTab={patientInitialTab}
            initialEpisodeId={patientInitialEpisodeId}
            onBack={() => {
              setSelectedPatientId(null);
              setPatientInitialTab(undefined);
              setPatientInitialEpisodeId(null);
            }}
          />
        )}
        {page === 'colloquiums' && selectedColloqiumId === null && (
          <ColloquiumsView onOpenColloqium={(id) => setSelectedColloqiumId(id)} />
        )}
        {page === 'colloquiums' && selectedColloqiumId !== null && (
          <ColloquiumDetailView
            colloqiumId={selectedColloqiumId}
            onBack={() => setSelectedColloqiumId(null)}
          />
        )}
        {page === 'coordinations' && selectedCoordinationId === null && (
          <CoordinationsView onOpenCoordination={(id) => setSelectedCoordinationId(id)} />
        )}
        {page === 'coordinations' && selectedCoordinationId !== null && (
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
      </main>
    </div>
  );
}

export default App;
