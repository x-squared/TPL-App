import { useEffect, useRef, useState } from 'react';
import ErrorBanner from '../layout/ErrorBanner';
import { formatDateDdMmYyyy } from '../layout/dateFormat';
import InlineDeleteActions from '../layout/InlineDeleteActions';
import type { InformationSectionModel } from './types';

interface InformationRowsSectionProps {
  model: InformationSectionModel;
}

function TextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);
  const apply = (command: 'bold' | 'italic' | 'underline') => {
    editorRef.current?.focus();
    document.execCommand(command);
    onChange(editorRef.current?.innerHTML ?? '');
  };
  return (
    <div className="info-editor">
      <div className="info-editor-toolbar">
        <button type="button" className="info-editor-btn" onClick={() => apply('bold')} title="Bold">
          B
        </button>
        <button type="button" className="info-editor-btn" onClick={() => apply('italic')} title="Italic">
          I
        </button>
        <button type="button" className="info-editor-btn" onClick={() => apply('underline')} title="Underline">
          U
        </button>
      </div>
      <div
        ref={editorRef}
        className="info-editor-area"
        contentEditable
        dir="ltr"
        suppressContentEditableWarning
        onInput={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}

export default function InformationRowsSection({ model }: InformationRowsSectionProps) {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const [pendingWithdrawId, setPendingWithdrawId] = useState<number | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const canManageRow = (row: { author_id: number }) => row.author_id === model.currentUserId || model.currentUserIsAdmin;
  const badgeClassForRow = (row: { current_user_read_at: string | null; valid_from: string; withdrawn: boolean }) => {
    if (row.withdrawn) return row.current_user_read_at ? 'info-read-badge-withdrawn-read' : 'info-read-badge-withdrawn-unread';
    if (row.current_user_read_at) return 'info-read-badge-read';
    if (row.valid_from <= today) return 'info-read-badge-unread-valid';
    return 'info-read-badge-unread-future';
  };
  return (
    <section className="detail-section ui-panel-section">
      <div className="detail-section-heading">
        <h2>{`Information (${model.unreadCount})`}</h2>
        {!model.adding && model.editingId == null && (
          <button className="ci-add-btn" onClick={model.startAdd}>
            + Add
          </button>
        )}
      </div>
      <label className="info-hide-read-filter">
        <input
          type="checkbox"
          checked={model.hideRead}
          onChange={(event) => model.setHideRead(event.target.checked)}
        />
        Show unread only
      </label>
      <p className="detail-help info-read-help">Click a badge in the first column to mark information as read.</p>
      {pendingWithdrawId != null ? (
        <p className="detail-help info-read-help">This information was already read. You can edit the text and then click Withdraw.</p>
      ) : null}
      <ErrorBanner message={model.error} />
      <div className="patients-table-wrap ui-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th className="info-read-col">Read</th>
              <th className="info-text-col">Text</th>
              <th className="info-valid-from-col">Valid from</th>
              <th className="info-author-col">Author</th>
              <th>Context</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(model.adding || model.editingId != null) && (
              <tr className="ci-editing-row">
                <td>
                  <span
                    className={`info-read-badge ${model.draft.valid_from <= today ? 'info-read-badge-unread-valid' : 'info-read-badge-unread-future'}`}
                    title={model.draft.valid_from <= today ? 'Unread and valid' : 'Unread and not yet valid'}
                  />
                </td>
                <td>
                  <TextEditor value={model.draft.text} onChange={model.setDraftText} />
                  <small className="info-editor-count">{model.draftTextLength} / 1024</small>
                </td>
                <td className="info-valid-from-col">
                  <input
                    className="detail-input ci-inline-input"
                    type="date"
                    min={model.minValidFrom}
                    value={model.draft.valid_from}
                    onChange={(event) => model.setDraft({ ...model.draft, valid_from: event.target.value })}
                  />
                </td>
                <td className="info-author-col">
                  {model.authors.find((author) => author.id === model.draft.author_id)?.name ?? `#${model.draft.author_id}`}
                </td>
                <td>
                  <select
                    className="detail-input ci-inline-input"
                    value={model.draft.context_id ?? ''}
                    onChange={(event) =>
                      model.setDraft({
                        ...model.draft,
                        context_id: event.target.value ? Number(event.target.value) : null,
                      })}
                  >
                    <option value="">General</option>
                    {model.organContexts.map((context) => (
                      <option key={context.id} value={context.id}>
                        {context.name_default}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="detail-ci-actions">
                  <button
                    className="ci-save-inline"
                    onClick={() => {
                      void model.saveDraft();
                    }}
                    disabled={model.saving || !model.canSaveDraft}
                    title="Save"
                    aria-label="Save"
                  >
                    ✓
                  </button>
                  <button
                    className="ci-cancel-inline"
                    onClick={() => {
                      setPendingWithdrawId(null);
                      model.cancelDraft();
                    }}
                    disabled={model.saving}
                    title="Cancel"
                    aria-label="Cancel"
                  >
                    ✕
                  </button>
                  {pendingWithdrawId != null && model.editingId === pendingWithdrawId ? (
                    <button
                      className="ci-delete-btn"
                      onClick={() => {
                        const targetId = pendingWithdrawId;
                        setPendingWithdrawId(null);
                        model.cancelDraft();
                        void model.deleteRow(targetId);
                      }}
                      disabled={model.saving}
                      title="Withdraw"
                      aria-label="Withdraw"
                    >
                      Withdraw
                    </button>
                  ) : null}
                </td>
              </tr>
            )}
            {model.rows.length === 0 && !model.loading ? (
              <tr>
                <td colSpan={6} className="status">No information rows yet.</td>
              </tr>
            ) : null}
            {model.rows.map((row) => (
              <tr key={row.id} className={row.current_user_read_at && !row.withdrawn ? 'info-row-read' : ''}>
                <td className="info-read-col">
                  {row.current_user_read_at ? (
                    <span
                      className={`info-read-badge ${badgeClassForRow(row)}`}
                      title={row.withdrawn ? 'Withdrawn (read)' : 'Read'}
                    />
                  ) : (
                    <button
                      className={`info-read-badge ${badgeClassForRow(row)}`}
                      title={row.withdrawn ? 'click to conffirm' : (row.valid_from <= today ? 'Unread and valid' : 'Unread and not yet valid')}
                      disabled={model.saving}
                      onClick={() => {
                        void model.markRowRead(row.id);
                      }}
                    />
                  )}
                </td>
                <td className="info-text-col">
                  <div className="info-text-render" dangerouslySetInnerHTML={{ __html: row.text }} />
                </td>
                <td className="info-valid-from-col">{formatDateDdMmYyyy(row.valid_from)}</td>
                <td className="info-author-col">{row.author?.name ?? `#${row.author_id}`}</td>
                <td>{row.context?.name_default ?? 'General'}</td>
                <td className="detail-ci-actions">
                  {canManageRow(row) ? (
                    row.withdrawn ? (
                      <button
                        className="ci-edit-inline"
                        onClick={() => {
                          setConfirmingDeleteId(null);
                          model.startEdit(row);
                        }}
                        title="Edit"
                      >
                        ✎
                      </button>
                    ) : (
                      <InlineDeleteActions
                        confirming={confirmingDeleteId === row.id}
                        deleting={model.saving}
                        onEdit={() => {
                          setConfirmingDeleteId(null);
                          model.startEdit(row);
                        }}
                        onRequestDelete={() => {
                          if (row.has_reads) {
                            setConfirmingDeleteId(null);
                            setPendingWithdrawId(row.id);
                            model.startEdit(row);
                            return;
                          }
                          setConfirmingDeleteId(row.id);
                        }}
                        onConfirmDelete={() => {
                          setConfirmingDeleteId(null);
                          void model.deleteRow(row.id);
                        }}
                        onCancelDelete={() => setConfirmingDeleteId(null)}
                      />
                    )
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
