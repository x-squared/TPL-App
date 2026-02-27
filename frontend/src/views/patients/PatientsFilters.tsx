import type { Code } from '../../api';

interface Props {
  filterAny: string;
  setFilterAny: (value: string) => void;
  filterPid: string;
  setFilterPid: (value: string) => void;
  filterName: string;
  setFilterName: (value: string) => void;
  filterFirstName: string;
  setFilterFirstName: (value: string) => void;
  filterDob: string;
  setFilterDob: (value: string) => void;
  filterOrgan: string;
  setFilterOrgan: (value: string) => void;
  organCodes: Code[];
  filterOpenOnly: boolean;
  setFilterOpenOnly: (value: boolean) => void;
}

export default function PatientsFilters({
  filterAny,
  setFilterAny,
  filterPid,
  setFilterPid,
  filterName,
  setFilterName,
  filterFirstName,
  setFilterFirstName,
  filterDob,
  setFilterDob,
  filterOrgan,
  setFilterOrgan,
  organCodes,
  filterOpenOnly,
  setFilterOpenOnly,
}: Props) {
  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="Wildcard search (* allowed, across patient + episodes)"
        value={filterAny}
        onChange={(e) => setFilterAny(e.target.value)}
      />
      <input type="text" placeholder="PID" value={filterPid} onChange={(e) => setFilterPid(e.target.value)} />
      <input type="text" placeholder="Name" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
      <input type="text" placeholder="First name" value={filterFirstName} onChange={(e) => setFilterFirstName(e.target.value)} />
      <input type="text" placeholder="Date of birth" value={filterDob} onChange={(e) => setFilterDob(e.target.value)} />
      <div className="filter-episode-filters">
        <select className="filter-select" value={filterOrgan} onChange={(e) => setFilterOrgan(e.target.value)}>
          <option value="">Organ...</option>
          {organCodes.map((c) => <option key={c.id} value={c.id}>{c.name_default}</option>)}
        </select>
        <select className="filter-select" value={filterOpenOnly ? 'open' : ''} onChange={(e) => setFilterOpenOnly(e.target.value === 'open')}>
          <option value="">All episodes</option>
          <option value="open">Open only</option>
        </select>
      </div>
    </div>
  );
}
