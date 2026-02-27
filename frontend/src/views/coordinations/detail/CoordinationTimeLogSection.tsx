import type React from 'react';
import InlineDeleteActions from '../../layout/InlineDeleteActions';
import ErrorBanner from '../../layout/ErrorBanner';
import { formatDateTimeDdMmYyyy } from '../../layout/dateFormat';

interface UserOption {
  id: number;
  name: string;
}

interface TimeLogRow {
  id: number;
  user_id: number;
  user: { id: number; name: string } | null;
  start: string | null;
  end: string | null;
  comment: string;
}

interface TimeLogDraft {
  user_id: number;
  start: string;
  end: string;
  comment: string;
}

interface CoordinationTimeLogSectionProps {
  timeLogs: TimeLogRow[];
  users: UserOption[];
  addingLog: boolean;
  editingLogId: number | null;
  logDraft: TimeLogDraft;
  setLogDraft: React.Dispatch<React.SetStateAction<TimeLogDraft>>;
  logError: string;
  onOpenAddLog: () => void;
  onOpenEditLog: (log: TimeLogRow) => void;
  onCloseLogEditor: () => void;
  onSaveLogDraft: () => void;
  onDeleteLog: (id: number) => void;
  confirmDeleteLogId: number | null;
  setConfirmDeleteLogId: React.Dispatch<React.SetStateAction<number | null>>;
  hasEditorOpen: boolean;
  totalsByUser: [string, number][];
  formatElapsed: (seconds: number) => string;
}

const fmtDateTime = (value: string | null): string => {
  return formatDateTimeDdMmYyyy(value);
};

export default function CoordinationTimeLogSection({
  timeLogs,
  users,
  addingLog,
  editingLogId,
  logDraft,
  setLogDraft,
  logError,
  onOpenAddLog,
  onOpenEditLog,
  onCloseLogEditor,
  onSaveLogDraft,
  onDeleteLog,
  confirmDeleteLogId,
  setConfirmDeleteLogId,
  hasEditorOpen,
  totalsByUser,
  formatElapsed,
}: CoordinationTimeLogSectionProps) {
  return (
    <section className="detail-section ui-panel-section">
      <div className="detail-section-heading">
        <h2>Time log</h2>
        {!hasEditorOpen && (
          <button className="ci-add-btn" onClick={onOpenAddLog}>
            + Add
          </button>
        )}
      </div>
      <div className="coord-time-totals">
        <span className="detail-label">Total time per user</span>
        {totalsByUser.length === 0 ? (
          <p className="detail-empty">No completed time intervals yet.</p>
        ) : (
          <div className="coord-time-total-list">
            {totalsByUser.map(([userName, seconds]) => (
              <div key={userName} className="coord-time-total-row">
                <span>{userName}</span>
                <strong>{formatElapsed(seconds)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="ui-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Start</th>
              <th>End</th>
              <th>Comment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {addingLog && (
              <tr className="ci-editing-row">
                <td>
                  <select
                    className="detail-input ci-inline-input coord-time-user-input"
                    value={logDraft.user_id || ''}
                    onChange={(e) => setLogDraft((prev) => ({ ...prev, user_id: Number(e.target.value) }))}
                  >
                    <option value="">Select user</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    className="detail-input ci-inline-input coord-time-datetime-input"
                    type="datetime-local"
                    step={1}
                    value={logDraft.start}
                    onChange={(e) => setLogDraft((prev) => ({ ...prev, start: e.target.value }))}
                  />
                </td>
                <td>
                  <input
                    className="detail-input ci-inline-input coord-time-datetime-input"
                    type="datetime-local"
                    step={1}
                    value={logDraft.end}
                    onChange={(e) => setLogDraft((prev) => ({ ...prev, end: e.target.value }))}
                  />
                </td>
                <td>
                  <input
                    className="detail-input ci-inline-input"
                    value={logDraft.comment}
                    placeholder="Comment"
                    onChange={(e) => setLogDraft((prev) => ({ ...prev, comment: e.target.value }))}
                  />
                </td>
                <td className="coord-time-actions">
                  <button className="ci-save-inline" onClick={onSaveLogDraft} title="Save" aria-label="Save">
                    ✓
                  </button>
                  <button className="ci-cancel-inline" onClick={onCloseLogEditor} title="Cancel" aria-label="Cancel">
                    ✕
                  </button>
                </td>
              </tr>
            )}
            {timeLogs.length === 0 && !addingLog ? (
              <tr>
                <td colSpan={5} className="status">No time logs found.</td>
              </tr>
            ) : null}
            {timeLogs.map((log) => (
              editingLogId === log.id ? (
                <tr key={log.id} className="ci-editing-row">
                  <td>
                    <select
                      className="detail-input ci-inline-input coord-time-user-input"
                      value={logDraft.user_id || ''}
                      onChange={(e) => setLogDraft((prev) => ({ ...prev, user_id: Number(e.target.value) }))}
                    >
                      <option value="">Select user</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="detail-input ci-inline-input coord-time-datetime-input"
                      type="datetime-local"
                      step={1}
                      value={logDraft.start}
                      onChange={(e) => setLogDraft((prev) => ({ ...prev, start: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      className="detail-input ci-inline-input coord-time-datetime-input"
                      type="datetime-local"
                      step={1}
                      value={logDraft.end}
                      onChange={(e) => setLogDraft((prev) => ({ ...prev, end: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      className="detail-input ci-inline-input"
                      value={logDraft.comment}
                      placeholder="Comment"
                      onChange={(e) => setLogDraft((prev) => ({ ...prev, comment: e.target.value }))}
                    />
                  </td>
                  <td className="coord-time-actions">
                    <button className="ci-save-inline" onClick={onSaveLogDraft} title="Save" aria-label="Save">
                      ✓
                    </button>
                    <button className="ci-cancel-inline" onClick={onCloseLogEditor} title="Cancel" aria-label="Cancel">
                      ✕
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={log.id}>
                  <td>{log.user?.name ?? `#${log.user_id}`}</td>
                  <td>{fmtDateTime(log.start)}</td>
                  <td>{fmtDateTime(log.end)}</td>
                  <td>{log.comment || '–'}</td>
                  <td className="coord-time-actions">
                    <InlineDeleteActions
                      confirming={confirmDeleteLogId === log.id}
                      onEdit={() => onOpenEditLog(log)}
                      onRequestDelete={() => setConfirmDeleteLogId(log.id)}
                      onConfirmDelete={() => {
                        onDeleteLog(log.id);
                        setConfirmDeleteLogId(null);
                      }}
                      onCancelDelete={() => setConfirmDeleteLogId(null)}
                    />
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
      <ErrorBanner message={logError} />
    </section>
  );
}
