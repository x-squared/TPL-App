import type { MedicalDataTabProps } from './types';

type DiagnosesSectionProps = Pick<
  MedicalDataTabProps,
  | 'patient'
  | 'addingDiag'
  | 'setAddingDiag'
  | 'diagCodes'
  | 'diagForm'
  | 'setDiagForm'
  | 'diagSaving'
  | 'handleAddDiag'
  | 'editingDiagId'
  | 'diagEditForm'
  | 'setDiagEditForm'
  | 'handleSaveDiag'
  | 'cancelEditingDiag'
  | 'startEditingDiag'
  | 'confirmDeleteDiagId'
  | 'setConfirmDeleteDiagId'
  | 'handleDeleteDiag'
  | 'formatDate'
>;

export default function DiagnosesSection({
  patient,
  addingDiag,
  setAddingDiag,
  diagCodes,
  diagForm,
  setDiagForm,
  diagSaving,
  handleAddDiag,
  editingDiagId,
  diagEditForm,
  setDiagEditForm,
  handleSaveDiag,
  cancelEditingDiag,
  startEditingDiag,
  confirmDeleteDiagId,
  setConfirmDeleteDiagId,
  handleDeleteDiag,
  formatDate,
}: DiagnosesSectionProps) {
  return (
    <section className="detail-section" style={{ marginTop: '1.5rem' }}>
      <div className="detail-section-heading">
        <h2>Diagnoses</h2>
        {!addingDiag && (
          <button className="ci-add-btn" onClick={() => setAddingDiag(true)}>+ Add</button>
        )}
      </div>
      {patient.diagnoses && patient.diagnoses.length > 0 ? (
        <table className="detail-contact-table">
          <tbody>
            {patient.diagnoses.map((d) => (
              editingDiagId === d.id ? (
                <tr key={d.id} className="ci-editing-row">
                  <td className="diag-code">
                    <select
                      className="detail-input ci-inline-input"
                      value={diagEditForm.catalogue_id}
                      onChange={(e) => setDiagEditForm((f) => ({ ...f, catalogue_id: Number(e.target.value) }))}
                    >
                      {diagCodes.map((c) => (
                        <option key={c.id} value={c.id}>{c.key} – {c.name_default}</option>
                      ))}
                    </select>
                  </td>
                  <td className="diag-comment">
                    <input
                      className="detail-input ci-inline-input"
                      value={diagEditForm.comment ?? ''}
                      onChange={(e) => setDiagEditForm((f) => ({ ...f, comment: e.target.value }))}
                    />
                  </td>
                  <td className="diag-date">{formatDate(d.updated_at ?? d.created_at)}</td>
                  <td className="detail-ci-actions">
                    <button className="ci-save-inline" onClick={handleSaveDiag} disabled={diagSaving}>✓</button>
                    <button className="ci-cancel-inline" onClick={cancelEditingDiag} disabled={diagSaving}>✕</button>
                  </td>
                </tr>
              ) : (
                <tr key={d.id} onDoubleClick={() => startEditingDiag({ id: d.id, catalogue_id: d.catalogue_id, comment: d.comment ?? '' })}>
                  <td className="diag-code">{d.catalogue ? `${d.catalogue.key} – ${d.catalogue.name_default}` : '–'}</td>
                  <td className="diag-comment">{d.comment || ''}</td>
                  <td className="diag-date">{formatDate(d.updated_at ?? d.created_at)}</td>
                  <td className="detail-ci-actions">
                    {confirmDeleteDiagId === d.id ? (
                      <span className="ci-confirm">
                        <span className="ci-confirm-text">Delete?</span>
                        <button className="ci-confirm-yes" onClick={() => handleDeleteDiag(d.id)}>Yes</button>
                        <button className="ci-confirm-no" onClick={() => setConfirmDeleteDiagId(null)}>No</button>
                      </span>
                    ) : (
                      <>
                        <button className="ci-edit-inline" onClick={() => startEditingDiag({ id: d.id, catalogue_id: d.catalogue_id, comment: d.comment ?? '' })} title="Edit">✎</button>
                        <button className="ci-delete-btn" onClick={() => setConfirmDeleteDiagId(d.id)} title="Delete">×</button>
                      </>
                    )}
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      ) : (
        <p className="detail-empty">No diagnoses.</p>
      )}

      {addingDiag && (
        <div className="ci-add-form">
          <select
            className="detail-input"
            value={diagForm.catalogue_id}
            onChange={(e) => setDiagForm((f) => ({ ...f, catalogue_id: Number(e.target.value) }))}
          >
            {diagCodes.map((c) => (
              <option key={c.id} value={c.id}>{c.key} – {c.name_default}</option>
            ))}
          </select>
          <input
            className="detail-input"
            placeholder="Comment"
            value={diagForm.comment}
            onChange={(e) => setDiagForm((f) => ({ ...f, comment: e.target.value }))}
          />
          <div className="ci-add-actions">
            <button className="save-btn" onClick={handleAddDiag} disabled={diagSaving || !diagForm.catalogue_id}>
              {diagSaving ? 'Saving...' : 'Save'}
            </button>
            <button className="cancel-btn" onClick={() => setAddingDiag(false)} disabled={diagSaving}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
