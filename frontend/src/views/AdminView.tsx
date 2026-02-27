import { useState } from 'react';

import { useAdminAccessRules } from './admin/hooks/useAdminAccessRules';
import { useAdminPeopleTeams } from './admin/hooks/useAdminPeopleTeams';
import AdminOverviewTab from './admin/tabs/AdminOverviewTab';
import AdminAccessRulesTab from './admin/tabs/AdminAccessRulesTab';
import AdminPeopleTeamsTab from './admin/tabs/AdminPeopleTeamsTab';
import './AdminView.css';

type AdminTabKey = 'overview' | 'access-rules' | 'people-teams';

export default function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTabKey>('overview');
  const accessRules = useAdminAccessRules();
  const peopleTeams = useAdminPeopleTeams();

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
        <button
          className={`detail-tab ${activeTab === 'people-teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('people-teams')}
          type="button"
        >
          People & Teams
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
      {activeTab === 'people-teams' && (
        <AdminPeopleTeamsTab
          people={peopleTeams.people}
          teams={peopleTeams.teams}
          teamMembersById={peopleTeams.teamMembersById}
          loading={peopleTeams.loading}
          saving={peopleTeams.saving}
          error={peopleTeams.error}
          onCreatePerson={peopleTeams.createPerson}
          onUpdatePerson={peopleTeams.updatePerson}
          onDeletePerson={peopleTeams.deletePerson}
          onCreateTeam={peopleTeams.createTeam}
          onUpdateTeamName={peopleTeams.updateTeamName}
          onDeleteTeam={peopleTeams.deleteTeam}
          onEnsureTeamMembersLoaded={peopleTeams.ensureTeamMembersLoaded}
          onSetTeamMembers={peopleTeams.setTeamMembers}
        />
      )}
    </>
  );
}
