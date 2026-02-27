import { useState } from 'react';
import type { Person } from '../../../../api';
import InlineDeleteActions from '../../../layout/InlineDeleteActions';
import type { PersonUpsertPayload } from './types';

interface PersonsSectionProps {
  people: Person[];
  saving: boolean;
  onCreatePerson: (payload: PersonUpsertPayload) => Promise<void>;
  onUpdatePerson: (personId: number, payload: PersonUpsertPayload) => Promise<void>;
  onDeletePerson: (personId: number) => Promise<void>;
}

export default function PersonsSection({
  people,
  saving,
  onCreatePerson,
  onUpdatePerson,
  onDeletePerson,
}: PersonsSectionProps) {
  const [addingPerson, setAddingPerson] = useState(false);
  const [personDraft, setPersonDraft] = useState({ first_name: '', surname: '', user_id: '' });
  const [editingPersonId, setEditingPersonId] = useState<number | null>(null);
  const [confirmDeletePersonId, setConfirmDeletePersonId] = useState<number | null>(null);

  const startEdit = (person: Person) => {
    setEditingPersonId(person.id);
    setPersonDraft({
      first_name: person.first_name,
      surname: person.surname,
      user_id: person.user_id ?? '',
    });
  };

  const saveCreate = async () => {
    await onCreatePerson(personDraft);
    setPersonDraft({ first_name: '', surname: '', user_id: '' });
    setAddingPerson(false);
  };

  const saveEdit = async () => {
    if (editingPersonId == null) return;
    await onUpdatePerson(editingPersonId, personDraft);
    setEditingPersonId(null);
  };

  return (
    <div className="admin-people-card">
      <div className="detail-section-heading">
        <h3>Persons</h3>
        {!addingPerson && (
          <button className="ci-add-btn" onClick={() => setAddingPerson(true)}>
            + Add
          </button>
        )}
      </div>
      <div className="patients-table-wrap ui-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Surname</th>
              <th>User ID</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {addingPerson && (
              <tr className="ci-editing-row">
                <td>
                  <input
                    className="detail-input ci-inline-input"
                    value={personDraft.first_name}
                    onChange={(event) => setPersonDraft((prev) => ({ ...prev, first_name: event.target.value }))}
                    placeholder="First name"
                  />
                </td>
                <td>
                  <input
                    className="detail-input ci-inline-input"
                    value={personDraft.surname}
                    onChange={(event) => setPersonDraft((prev) => ({ ...prev, surname: event.target.value }))}
                    placeholder="Surname"
                  />
                </td>
                <td>
                  <input
                    className="detail-input ci-inline-input"
                    value={personDraft.user_id}
                    onChange={(event) => setPersonDraft((prev) => ({ ...prev, user_id: event.target.value }))}
                    placeholder="Optional user ID (max 12)"
                    maxLength={12}
                  />
                </td>
                <td className="detail-ci-actions">
                  <button
                    className="ci-save-inline"
                    onClick={() => { void saveCreate(); }}
                    disabled={saving || !personDraft.first_name.trim() || !personDraft.surname.trim()}
                  >
                    ✓
                  </button>
                  <button
                    className="ci-cancel-inline"
                    onClick={() => setAddingPerson(false)}
                    disabled={saving}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            )}
            {people.map((person) => (
              editingPersonId === person.id ? (
                <tr key={person.id} className="ci-editing-row">
                  <td>
                    <input
                      className="detail-input ci-inline-input"
                      value={personDraft.first_name}
                      onChange={(event) => setPersonDraft((prev) => ({ ...prev, first_name: event.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      className="detail-input ci-inline-input"
                      value={personDraft.surname}
                      onChange={(event) => setPersonDraft((prev) => ({ ...prev, surname: event.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      className="detail-input ci-inline-input"
                      value={personDraft.user_id}
                      onChange={(event) => setPersonDraft((prev) => ({ ...prev, user_id: event.target.value }))}
                      maxLength={12}
                    />
                  </td>
                  <td className="detail-ci-actions">
                    <button
                      className="ci-save-inline"
                      onClick={() => { void saveEdit(); }}
                      disabled={saving || !personDraft.first_name.trim() || !personDraft.surname.trim()}
                    >
                      ✓
                    </button>
                    <button
                      className="ci-cancel-inline"
                      onClick={() => setEditingPersonId(null)}
                      disabled={saving}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={person.id} onDoubleClick={() => startEdit(person)}>
                  <td>{person.first_name}</td>
                  <td>{person.surname}</td>
                  <td>{person.user_id || '–'}</td>
                  <td className="detail-ci-actions">
                    <InlineDeleteActions
                      confirming={confirmDeletePersonId === person.id}
                      deleting={saving}
                      onEdit={() => startEdit(person)}
                      onRequestDelete={() => setConfirmDeletePersonId(person.id)}
                      onConfirmDelete={() => { void onDeletePerson(person.id); }}
                      onCancelDelete={() => setConfirmDeletePersonId(null)}
                    />
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
