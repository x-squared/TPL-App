import { useEffect, useState } from 'react';
import {
  api,
  clearToken,
  getToken,
  setToken,
  type AppUser,
} from './api';
import './App.css';
import './styles/TableStyles.css';
import ColloquiumDetailView from './views/ColloquiumDetailView';
import ColloquiumsView from './views/ColloquiumsView';
import PatientDetailView from './views/PatientDetailView';
import PatientsView from './views/PatientsView';

type Page = 'patients' | 'colloquiums';

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
            className={`nav-item ${page === 'patients' ? 'active' : ''}`}
            onClick={() => { setPage('patients'); setSelectedPatientId(null); setSelectedColloqiumId(null); }}
            title="Recipients"
          >
            <span className="nav-icon">{'\u2695'}</span>
            {sidebarOpen && <span className="nav-label">Recipients</span>}
          </button>
          <button
            className={`nav-item ${page === 'colloquiums' ? 'active' : ''}`}
            onClick={() => { setPage('colloquiums'); setSelectedPatientId(null); }}
            title="Colloquiums"
          >
            <span className="nav-icon">{'\u{1F4CB}'}</span>
            {sidebarOpen && <span className="nav-label">Colloquiums</span>}
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
        {page === 'patients' && !selectedPatientId && (
          <PatientsView onSelectPatient={(id) => setSelectedPatientId(id)} />
        )}
        {page === 'patients' && selectedPatientId && (
          <PatientDetailView
            patientId={selectedPatientId}
            onBack={() => setSelectedPatientId(null)}
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
      </main>
    </div>
  );
}

export default App;
