import type { AccessControlMatrix } from '../../../api';

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
      <header>
        <h2>Access Rules</h2>
      </header>
      {loading && <p className="status">Loading access matrix...</p>}
      {error && <p className="status status-error">{error}</p>}
      {status && <p className="status">{status}</p>}

      {!loading && matrix && (
        <div className="table-wrap">
          <div className="filters-row">
            <label>
              <span>Role</span>
              <select
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
              onClick={() => {
                void onSave();
              }}
              disabled={!dirty || saving || !selectedRoleKey}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <table>
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
                    <strong>{permission.name_default}</strong>
                    <br />
                    <span className="status">{permission.key}</span>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPermissionKeys.includes(permission.key)}
                      onChange={() => onTogglePermission(permission.key)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
