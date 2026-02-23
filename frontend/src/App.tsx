import { useEffect, useState } from 'react';
import {
  api,
  clearToken,
  getToken,
  setToken,
  type AppUser,
  type Code,
  type Item,
} from './api';
import './App.css';
import PatientDetailView from './views/PatientDetailView';
import PatientsView from './views/PatientsView';

type Page = 'items' | 'patients';

function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [extId, setExtId] = useState('TKOORD');
  const [loginError, setLoginError] = useState('');

  const [page, setPage] = useState<Page>('patients');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [items, setItems] = useState<Item[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [codeId, setCodeId] = useState<number | null>(null);
  const [itemsLoading, setItemsLoading] = useState(true);


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
    if (user) {
      fetchItems();
      fetchCodes();
    }
  }, [user]);

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
    setItems([]);
    setUserMenuOpen(false);
  };

  /* ── Items ── */
  const fetchItems = async () => {
    try {
      const data = await api.listItems();
      setItems(data);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchCodes = async () => {
    const data = await api.listCodes();
    setCodes(data);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.createItem({
      title: title.trim(),
      description: description.trim(),
      code_id: codeId,
    });
    setTitle('');
    setDescription('');
    setCodeId(null);
    fetchItems();
  };

  const toggleComplete = async (item: Item) => {
    await api.updateItem(item.id, { completed: !item.completed });
    fetchItems();
  };

  const handleDeleteItem = async (id: number) => {
    await api.deleteItem(id);
    fetchItems();
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
            onClick={() => { setPage('patients'); setSelectedPatientId(null); }}
            title="Patients"
          >
            <span className="nav-icon">{'\u2695'}</span>
            {sidebarOpen && <span className="nav-label">Patients</span>}
          </button>
          <button
            className={`nav-item ${page === 'items' ? 'active' : ''}`}
            onClick={() => setPage('items')}
            title="Items"
          >
            <span className="nav-icon">{'\u2630'}</span>
            {sidebarOpen && <span className="nav-label">Items</span>}
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
        {page === 'items' && (
          <>
            <header>
              <h1>Items</h1>
            </header>

            <form className="add-form" onSubmit={handleAddItem}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <select
                value={codeId ?? ''}
                onChange={(e) => setCodeId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">No code</option>
                {codes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type} – {c.name_default || c.key}
                  </option>
                ))}
              </select>
              <button type="submit">Add Item</button>
            </form>

            {itemsLoading ? (
              <p className="status">Loading...</p>
            ) : items.length === 0 ? (
              <p className="status">No items yet. Add one above.</p>
            ) : (
              <ul className="item-list">
                {items.map((item) => (
                  <li key={item.id} className={item.completed ? 'completed' : ''}>
                    <div className="item-content">
                      <label>
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleComplete(item)}
                        />
                        <span className="item-title">{item.title}</span>
                      </label>
                      {item.description && (
                        <p className="item-desc">{item.description}</p>
                      )}
                      <div className="item-meta">
                        {item.code && (
                          <span className="item-code">{item.code.type}: {item.code.name_default || item.code.key}</span>
                        )}
                        {item.changed_by_user && (
                          <span className="item-changed-by">by {item.changed_by_user.name}</span>
                        )}
                      </div>
                    </div>
                    <button className="delete-btn" onClick={() => handleDeleteItem(item.id)}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {page === 'patients' && !selectedPatientId && (
          <PatientsView onSelectPatient={(id) => setSelectedPatientId(id)} />
        )}
        {page === 'patients' && selectedPatientId && (
          <PatientDetailView
            patientId={selectedPatientId}
            onBack={() => setSelectedPatientId(null)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
