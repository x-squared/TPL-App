interface TaskBoardFiltersProps {
  organFilterId: number | 'ALL';
  setOrganFilterId: (value: number | 'ALL') => void;
  assignedToFilterId: number | 'ALL';
  setAssignedToFilterId: (value: number | 'ALL') => void;
  dueBefore: string;
  setDueBefore: (value: string) => void;
  showDoneTasks: boolean;
  setShowDoneTasks: (value: boolean) => void;
  showCancelledTasks: boolean;
  setShowCancelledTasks: (value: boolean) => void;
  showGroupHeadings: boolean;
  setShowGroupHeadings: (value: boolean) => void;
  organOptions: Array<{ id: number; name: string }>;
  assignedToOptions: Array<{ id: number; name: string }>;
}

export default function TaskBoardFilters({
  organFilterId,
  setOrganFilterId,
  assignedToFilterId,
  setAssignedToFilterId,
  dueBefore,
  setDueBefore,
  showDoneTasks,
  setShowDoneTasks,
  showCancelledTasks,
  setShowCancelledTasks,
  showGroupHeadings,
  setShowGroupHeadings,
  organOptions,
  assignedToOptions,
}: TaskBoardFiltersProps) {
  return (
    <div className="ui-filter-bar task-board-filters">
      <label>
        Organ
        <select
          className="ui-filter-input"
          value={organFilterId}
          onChange={(e) => setOrganFilterId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
        >
          <option value="ALL">All</option>
          {organOptions.map((organ) => (
            <option key={organ.id} value={organ.id}>{organ.name}</option>
          ))}
        </select>
      </label>
      <label>
        Assigned To
        <select
          className="ui-filter-input"
          value={assignedToFilterId}
          onChange={(e) => setAssignedToFilterId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
        >
          <option value="ALL">All</option>
          {assignedToOptions.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
      </label>
      <label>
        Due Before
        <input className="ui-filter-input" type="date" value={dueBefore} onChange={(e) => setDueBefore(e.target.value)} />
      </label>
      <label>
        Completed Tasks
        <select
          className="ui-filter-input"
          value={showDoneTasks ? 'show' : 'hide'}
          onChange={(e) => setShowDoneTasks(e.target.value === 'show')}
        >
          <option value="hide">Hide</option>
          <option value="show">Show</option>
        </select>
      </label>
      <label>
        Discarded Tasks
        <select
          className="ui-filter-input"
          value={showCancelledTasks ? 'show' : 'hide'}
          onChange={(e) => setShowCancelledTasks(e.target.value === 'show')}
        >
          <option value="hide">Hide</option>
          <option value="show">Show</option>
        </select>
      </label>
      <label>
        Group Headings
        <select
          className="ui-filter-input"
          value={showGroupHeadings ? 'show' : 'hide'}
          onChange={(e) => setShowGroupHeadings(e.target.value === 'show')}
        >
          <option value="show">Show</option>
          <option value="hide">Hide</option>
        </select>
      </label>
    </div>
  );
}
