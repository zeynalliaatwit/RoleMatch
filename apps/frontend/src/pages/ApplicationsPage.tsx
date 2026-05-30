import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { applications } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';

type TrackerFilter = 'all' | 'blocked' | 'interview' | 'rejected' | 'submitted';

const trackerFilters: Array<{ label: string; value: TrackerFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Interviews', value: 'interview' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Rejected', value: 'rejected' },
];

function isTrackerFilter(value: string | null): value is TrackerFilter {
  return trackerFilters.some((filter) => filter.value === value);
}

export function ApplicationsPage() {
  const [query, setQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFilter = isTrackerFilter(searchParams.get('filter')) ? searchParams.get('filter') : 'all';

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = selectedFilter === 'all'
        || (selectedFilter === 'interview' && application.stage === 'Interview')
        || (selectedFilter !== 'interview' && application.status === selectedFilter);
      const matchesQuery = !normalizedQuery
        || [application.title, application.company, application.source, application.nextStep].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [query, selectedFilter]);

  const handleFilterChange = (filter: TrackerFilter) => {
    const nextParams = new URLSearchParams(searchParams);

    if (filter === 'all') {
      nextParams.delete('filter');
    } else {
      nextParams.set('filter', filter);
    }

    setSearchParams(nextParams);
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Tracker</span>
          <h1>Application tracker</h1>
          <p>{filteredApplications.length} tracked applications in the current workspace</p>
        </div>
      </header>

      <section className="tracker-toolbar" aria-label="Application filters">
        <label className="input-with-icon">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search applications"
          />
        </label>
        <div className="segmented-control" role="group" aria-label="Filter by status">
          {trackerFilters.map((filter) => (
            <button
              className={selectedFilter === filter.value ? 'active' : ''}
              key={filter.value}
              type="button"
              onClick={() => handleFilterChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel table-panel" aria-label="Application tracker">
        <div className="application-table">
          <div className="table-row table-head">
            <span>Role</span>
            <span>Source</span>
            <span>Progress</span>
            <span>Match</span>
            <span>Submitted</span>
            <span>Next step</span>
          </div>
          {filteredApplications.map((application) => (
            <article className="table-row" key={application.id}>
              <div>
                <strong>{application.title}</strong>
                <span>{application.company}</span>
              </div>
              <span>{application.source}</span>
              <StatusBadge status={application.status} stage={application.stage} />
              <span>{application.fitScore}%</span>
              <span>{application.submittedDate}</span>
              <div>
                <span>{application.nextStep}</span>
                {application.blocker && <small>{application.blocker}</small>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
