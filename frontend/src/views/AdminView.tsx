import { useState } from 'react';

import { useAdminAccessRules } from './admin/hooks/useAdminAccessRules';
import AdminOverviewTab from './admin/tabs/AdminOverviewTab';
import AdminAccessRulesTab from './admin/tabs/AdminAccessRulesTab';

type AdminTabKey = 'overview' | 'access-rules';

export default function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTabKey>('overview');
  const accessRules = useAdminAccessRules();

  return (
    <>
      <header className="patients-header">
        <h1>Admin</h1>
      </header>

      <nav className="detail-tabs">
        <button
          className={`detail-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          type="button"
        >
          Overview
        </button>
        <button
          className={`detail-tab ${activeTab === 'access-rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('access-rules')}
          type="button"
        >
          Access Rules
        </button>
      </nav>

      {activeTab === 'overview' && <AdminOverviewTab />}
      {activeTab === 'access-rules' && (
        <AdminAccessRulesTab
          matrix={accessRules.matrix}
          selectedRoleKey={accessRules.selectedRoleKey}
          selectedPermissionKeys={accessRules.selectedPermissionKeys}
          loading={accessRules.loading}
          saving={accessRules.saving}
          error={accessRules.error}
          status={accessRules.status}
          dirty={accessRules.dirty}
          onSelectRole={accessRules.selectRole}
          onTogglePermission={accessRules.togglePermission}
          onSave={accessRules.savePermissions}
        />
      )}
    </>
  );
}
