import './PatientTab.css';

export default function PatientTab(props: any) {
  const {
    patient,
    editing,
    startEditing,
    saving,
    handleSave,
    cancelEditing,
    form,
    setForm,
    setField,
    formatDate,
    languages,
    bloodTypes,
    coordUsers,
    addingContact,
    setAddingContact,
    sortedContactInfos,
    editingCiId,
    ciEditForm,
    setCiEditForm,
    ciSaving,
    handleSaveCi,
    cancelEditingCi,
    ciDragId,
    ciDragOverId,
    setCiDragId,
    setCiDragOverId,
    handleCiDrop,
    startEditingCi,
    confirmDeleteId,
    setConfirmDeleteId,
    handleDeleteContact,
    contactTypes,
    ciForm,
    setCiForm,
    handleAddContact,
    addingAbsence,
    setAddingAbsence,
    sortedAbsences,
    editingAbId,
    abEditForm,
    setAbEditForm,
    abSaving,
    handleSaveAb,
    cancelEditingAb,
    startEditingAb,
    confirmDeleteAbId,
    setConfirmDeleteAbId,
    handleDeleteAbsence,
    abForm,
    setAbForm,
    handleAddAbsence,
  } = props;

  return (
    <>
      <div className="detail-tab-toolbar">
        {!editing ? (
          <button className="edit-btn" onClick={startEditing}>Edit</button>
        ) : (
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="cancel-btn" onClick={cancelEditing} disabled={saving}>Cancel</button>
          </div>
        )}
      </div>

      <section className="detail-section">
        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-label">PID</span>
            {editing ? (
              <input className="detail-input" value={form.pid} onChange={(e) => setField('pid', e.target.value)} />
            ) : (
              <span className="detail-value">{patient.pid}</span>
            )}
          </div>
          <div className="detail-field">
            <span className="detail-label">Name</span>
            {editing ? (
              <input className="detail-input" value={form.name} onChange={(e) => setField('name', e.target.value)} />
            ) : (
              <span className="detail-value">{patient.name}</span>
            )}
          </div>
          <div className="detail-field">
            <span className="detail-label">First Name</span>
            {editing ? (
              <input className="detail-input" value={form.first_name} onChange={(e) => setField('first_name', e.target.value)} />
            ) : (
              <span className="detail-value">{patient.first_name}</span>
            )}
          </div>
          <div className="detail-field">
            <span className="detail-label">Date of Birth</span>
            {editing ? (
              <input className="detail-input" type="date" value={form.date_of_birth} onChange={(e) => setField('date_of_birth', e.target.value)} />
            ) : (
              <span className="detail-value">{formatDate(patient.date_of_birth)}</span>
            )}
          </div>
          <div className="detail-field">
            <span className="detail-label">Date of Death</span>
            {editing ? (
              <input className="detail-input" type="date" value={form.date_of_death} onChange={(e) => setField('date_of_death', e.target.value)} />
            ) : (
              <span className="detail-value">{formatDate(patient.date_of_death)}</span>
            )}
          </div>
          <div className="detail-field">
            <span className="detail-label">AHV Nr.</span>
            {editing ? (
              <input className="detail-input" value={form.ahv_nr} onChange={(e) => setField('ahv_nr', e.target.value)} />
            ) : (
              <span className="detail-value">{patient.ahv_nr || '–'}</span>
            )}
          </div>
          <div className="detail-field">
            <span className="detail-label">Language</span>
            {editing ? (
              languages.length > 0 && !languages.some((l: any) => l.name_default === form.lang) && form.lang !== '' ? (
                <div className="lang-custom-row">
                  <input
                    className="detail-input"
                    value={form.lang}
                    onChange={(e) => setField('lang', e.target.value)}
                    placeholder="Enter language..."
                  />
                  <button
                    type="button"
                    className="lang-switch-btn"
                    onClick={() => setField('lang', languages[0]?.name_default ?? '')}
                    title="Pick from list"
                  >▼</button>
                </div>
              ) : (
                <div className="lang-custom-row">
                  <select
                    className="detail-input"
                    value={form.lang}
                    onChange={(e) => {
                      if (e.target.value === '__other__') {
                        setField('lang', '');
                      } else {
                        setField('lang', e.target.value);
                      }
                    }}
                  >
                    <option value="">–</option>
                    {languages.map((l: any) => (
                      <option key={l.id} value={l.name_default}>{l.name_default}</option>
                    ))}
                    <option value="__other__">Other...</option>
                  </select>
                </div>
              )
            ) : (
              <span className="detail-value">{patient.lang || '–'}</span>
            )}
          </div>
          <div className="detail-field">
            <span className="detail-label">Blood Type</span>
            {editing ? (
              <select
                className="detail-input"
                value={form.blood_type_id ?? ''}
                onChange={(e) => setForm((f: any) => ({ ...f, blood_type_id: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">–</option>
                {bloodTypes.map((bt: any) => (
                  <option key={bt.id} value={bt.id}>{bt.name_default}</option>
                ))}
              </select>
            ) : (
              <span className="detail-value">{patient.blood_type?.name_default ?? '–'}</span>
            )}
          </div>
          <div className="detail-field">
            <span className="detail-label">Responsible Coordinator</span>
            {editing ? (
              <select
                className="detail-input"
                value={form.resp_coord_id ?? ''}
                onChange={(e) => setForm((f: any) => ({ ...f, resp_coord_id: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">–</option>
                {coordUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            ) : (
              <span className="detail-value">{patient.resp_coord?.name ?? '–'}</span>
            )}
          </div>
          <div className="detail-field">
            <span className="detail-label">Translate</span>
            {editing ? (
              <label className="detail-checkbox">
                <input type="checkbox" checked={form.translate} onChange={(e) => setField('translate', e.target.checked)} />
                Yes
              </label>
            ) : (
              <span className="detail-value">{patient.translate ? 'Yes' : 'No'}</span>
            )}
          </div>
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-section-heading">
          <h2>Contact Information</h2>
          {!addingContact && (
            <button className="ci-add-btn" onClick={() => setAddingContact(true)}>+ Add</button>
          )}
        </div>
        {sortedContactInfos.length > 0 ? (
          <table className="detail-contact-table">
            <tbody>
              {sortedContactInfos.map((ci: any) => (
                editingCiId === ci.id ? (
                  <tr key={ci.id} className="ci-editing-row">
                    <td className="detail-ci-main">
                      <label className="detail-checkbox">
                        <input
                          type="checkbox"
                          checked={ciEditForm.main ?? false}
                          onChange={(e) => setCiEditForm((f: any) => ({ ...f, main: e.target.checked }))}
                        />
                      </label>
                    </td>
                    <td className="detail-ci-type">
                      <select
                        className="detail-input ci-inline-input"
                        value={ciEditForm.type_id}
                        onChange={(e) => setCiEditForm((f: any) => ({ ...f, type_id: Number(e.target.value) }))}
                      >
                        {contactTypes.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name_default}</option>
                        ))}
                      </select>
                    </td>
                    <td className="detail-ci-data">
                      <input
                        className="detail-input ci-inline-input"
                        value={ciEditForm.data ?? ''}
                        onChange={(e) => setCiEditForm((f: any) => ({ ...f, data: e.target.value }))}
                      />
                    </td>
                    <td className="detail-ci-comment">
                      <input
                        className="detail-input ci-inline-input"
                        value={ciEditForm.comment ?? ''}
                        onChange={(e) => setCiEditForm((f: any) => ({ ...f, comment: e.target.value }))}
                      />
                    </td>
                    <td className="detail-ci-actions">
                      <button className="ci-save-inline" onClick={handleSaveCi} disabled={ciSaving}>✓</button>
                      <button className="ci-cancel-inline" onClick={cancelEditingCi} disabled={ciSaving}>✕</button>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={ci.id}
                    draggable={editingCiId === null}
                    onDragStart={() => setCiDragId(ci.id)}
                    onDragOver={(e) => { e.preventDefault(); setCiDragOverId(ci.id); }}
                    onDragLeave={() => setCiDragOverId((prev: any) => prev === ci.id ? null : prev)}
                    onDrop={() => handleCiDrop(ci.id)}
                    onDragEnd={() => { setCiDragId(null); setCiDragOverId(null); }}
                    onDoubleClick={() => startEditingCi(ci)}
                    className={ciDragId === ci.id ? 'ci-dragging' : ciDragOverId === ci.id ? 'ci-drag-over' : ''}
                  >
                    <td className="detail-ci-main">
                      {ci.main && <span className="main-badge">Main</span>}
                    </td>
                    <td className="detail-ci-type">{ci.type?.name_default ?? ci.type?.key ?? '–'}</td>
                    <td className="detail-ci-data">{ci.data}</td>
                    <td className="detail-ci-comment">{ci.comment || ''}</td>
                    <td className="detail-ci-actions">
                      {confirmDeleteId === ci.id ? (
                        <span className="ci-confirm">
                          <span className="ci-confirm-text">Delete?</span>
                          <button className="ci-confirm-yes" onClick={() => handleDeleteContact(ci.id)}>Yes</button>
                          <button className="ci-confirm-no" onClick={() => setConfirmDeleteId(null)}>No</button>
                        </span>
                      ) : (
                        <>
                          <button className="ci-edit-inline" onClick={() => startEditingCi(ci)} title="Edit">✎</button>
                          <button className="ci-delete-btn" onClick={() => setConfirmDeleteId(ci.id)} title="Delete">×</button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        ) : (
          <p className="detail-empty">No contact information.</p>
        )}

        {addingContact && (
          <div className="ci-add-form">
            <select
              className="detail-input"
              value={ciForm.type_id}
              onChange={(e) => setCiForm((f: any) => ({ ...f, type_id: Number(e.target.value) }))}
            >
              {contactTypes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name_default}</option>
              ))}
            </select>
            <input
              className="detail-input"
              placeholder="Data"
              value={ciForm.data}
              onChange={(e) => setCiForm((f: any) => ({ ...f, data: e.target.value }))}
            />
            <input
              className="detail-input"
              placeholder="Comment"
              value={ciForm.comment}
              onChange={(e) => setCiForm((f: any) => ({ ...f, comment: e.target.value }))}
            />
            <label className="detail-checkbox ci-main-check">
              <input
                type="checkbox"
                checked={ciForm.main}
                onChange={(e) => setCiForm((f: any) => ({ ...f, main: e.target.checked }))}
              />
              Main
            </label>
            <div className="ci-add-actions">
              <button className="save-btn" onClick={handleAddContact} disabled={ciSaving || !ciForm.data.trim()}>
                {ciSaving ? 'Saving...' : 'Save'}
              </button>
              <button className="cancel-btn" onClick={() => setAddingContact(false)} disabled={ciSaving}>Cancel</button>
            </div>
          </div>
        )}
      </section>

      <section className="detail-section">
        <div className="detail-section-heading">
          <h2>Absences</h2>
          {!addingAbsence && (
            <button className="ci-add-btn" onClick={() => setAddingAbsence(true)}>+ Add</button>
          )}
        </div>
        {sortedAbsences.length > 0 ? (
          <table className="detail-contact-table">
            <tbody>
              {sortedAbsences.map((ab: any) => (
                editingAbId === ab.id ? (
                  <tr key={ab.id} className="ci-editing-row">
                    <td className="ab-date">
                      <input
                        className="detail-input ci-inline-input"
                        type="date"
                        value={abEditForm.start ?? ''}
                        onChange={(e) => setAbEditForm((f: any) => ({ ...f, start: e.target.value }))}
                      />
                    </td>
                    <td className="ab-date">
                      <input
                        className="detail-input ci-inline-input"
                        type="date"
                        value={abEditForm.end ?? ''}
                        onChange={(e) => setAbEditForm((f: any) => ({ ...f, end: e.target.value }))}
                      />
                    </td>
                    <td className="ab-comment">
                      <input
                        className="detail-input ci-inline-input"
                        value={abEditForm.comment ?? ''}
                        onChange={(e) => setAbEditForm((f: any) => ({ ...f, comment: e.target.value }))}
                      />
                    </td>
                    <td className="detail-ci-actions">
                      <button className="ci-save-inline" onClick={handleSaveAb} disabled={abSaving || !abEditForm.start || !abEditForm.end || abEditForm.end < abEditForm.start}>✓</button>
                      <button className="ci-cancel-inline" onClick={cancelEditingAb} disabled={abSaving}>✕</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={ab.id} onDoubleClick={() => startEditingAb(ab)}>
                    <td className="ab-date">{formatDate(ab.start)}</td>
                    <td className="ab-date">{formatDate(ab.end)}</td>
                    <td className="ab-comment">{ab.comment || ''}</td>
                    <td className="detail-ci-actions">
                      {confirmDeleteAbId === ab.id ? (
                        <span className="ci-confirm">
                          <span className="ci-confirm-text">Delete?</span>
                          <button className="ci-confirm-yes" onClick={() => handleDeleteAbsence(ab.id)}>Yes</button>
                          <button className="ci-confirm-no" onClick={() => setConfirmDeleteAbId(null)}>No</button>
                        </span>
                      ) : (
                        <>
                          <button className="ci-edit-inline" onClick={() => startEditingAb(ab)} title="Edit">✎</button>
                          <button className="ci-delete-btn" onClick={() => setConfirmDeleteAbId(ab.id)} title="Delete">×</button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        ) : (
          <p className="detail-empty">No absences.</p>
        )}

        {addingAbsence && (
          <div className="ci-add-form">
            <input
              className="detail-input"
              type="date"
              value={abForm.start}
              onChange={(e) => setAbForm((f: any) => ({ ...f, start: e.target.value }))}
            />
            <input
              className="detail-input"
              type="date"
              value={abForm.end}
              onChange={(e) => setAbForm((f: any) => ({ ...f, end: e.target.value }))}
            />
            <input
              className="detail-input"
              placeholder="Comment"
              value={abForm.comment}
              onChange={(e) => setAbForm((f: any) => ({ ...f, comment: e.target.value }))}
            />
            <div className="ci-add-actions">
              <button className="save-btn" onClick={handleAddAbsence} disabled={abSaving || !abForm.start || !abForm.end || abForm.end < abForm.start}>
                {abSaving ? 'Saving...' : 'Save'}
              </button>
              <button className="cancel-btn" onClick={() => setAddingAbsence(false)} disabled={abSaving}>Cancel</button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
