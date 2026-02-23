import { useEffect, useState } from 'react';
import { api, type Item } from './api';
import './App.css';

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const data = await api.listItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.createItem({ title: title.trim(), description: description.trim() });
    setTitle('');
    setDescription('');
    fetchItems();
  };

  const toggleComplete = async (item: Item) => {
    await api.updateItem(item.id, { completed: !item.completed });
    fetchItems();
  };

  const handleDelete = async (id: number) => {
    await api.deleteItem(id);
    fetchItems();
  };

  return (
    <div className="container">
      <header>
        <h1>TPL App</h1>
        <p className="subtitle">Full-stack starter with FastAPI + React + SQLite</p>
      </header>

      <form className="add-form" onSubmit={handleAdd}>
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
        <button type="submit">Add Item</button>
      </form>

      {loading ? (
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
              </div>
              <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
