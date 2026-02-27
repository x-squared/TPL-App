import type { AccessControlMatrix } from '../../../api';
import ErrorBanner from '../../layout/ErrorBanner';

interface AdminAccessRulesTabProps {
  matrix: AccessControlMatrix | null;
  selectedRoleKey: string;
  selectedPermissionKeys: string[];
  loading: boolean;
  saving: boolean;
  error: string;
  status: string;
  dirty: boolean;
  onSelectRole: (roleKey: string) => void;
  onTogglePermission: (permissionKey: string) => void;
  onSave: () => Promise<void>;
}

export default function AdminAccessRulesTab({
  matrix,
  selectedRoleKey,
  selectedPermissionKeys,
  loading,
  saving,
  error,
  status,
  dirty,
  onSelectRole,
  onTogglePermission,
  onSave,
}: AdminAccessRulesTabProps) {
  return (
    <section className="detail-section ui-panel-section">
      <div className="detail-section-heading">
        <h2>Access Rules</h2>
      </div>
      {loading && <p className="status">Loading access matrix...</p>}
      {error && <ErrorBanner message={error} />}
      {status && <p className="status">{status}</p>}

      {!loading && matrix && (
        <div className="admin-people-card">
          <div className="admin-access-controls">
            <label className="admin-access-role-field">
              <span>Role</span>
              <select
                className="detail-input"
                value={selectedRoleKey}
                onChange={(e) => onSelectRole(e.target.value)}
              >
                {matrix.roles.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.name_default || role.key}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="patients-save-btn"
              onClick={() => {
                void onSave();
              }}
              disabled={!dirty || saving || !selectedRoleKey}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="patients-table-wrap ui-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Permission</th>
                  <th>Allowed</th>
                </tr>
              </thead>
              <tbody>
                {matrix.permissions.map((permission) => (
                  <tr key={permission.key}>
                    <td>
                      <span className="admin-access-permission-line">
                        <strong>{permission.name_default}</strong>
                        <span className="admin-access-permission-key">{permission.key}</span>
                      </span>
                    </td>
                    <td className="admin-access-allowed-cell">
                      <label className="admin-access-checkbox-wrap">
                        <input
                          type="checkbox"
                          checked={selectedPermissionKeys.includes(permission.key)}
                          onChange={() => onTogglePermission(permission.key)}
                          aria-label={`Toggle ${permission.key}`}
                        />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
