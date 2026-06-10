import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { applications, type ApplicationStatus } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';

const statusFilters: Array<ApplicationStatus | 'all'> = ['all', 'submitted', 'interview', 'blocked', 'rejected', 'offer'];

function parseStatus(value: string | null): ApplicationStatus | 'all' {
  return statusFilters.includes(value as ApplicationStatus | 'all') ? value as ApplicationStatus | 'all' : 'all';
}

export function ApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const status = parseStatus(searchParams.get('status'));

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = status === 'all' || application.status === status;
      const matchesQuery = !normalizedQuery
        || [application.title, application.company, application.source, application.nextStep].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [query, status]);

  const updateStatus = (nextStatus: ApplicationStatus | 'all') => {
    setSearchParams(nextStatus === 'all' ? {} : { status: nextStatus });
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Tracker</span>
          <h1>Application tracker</h1>
          <p>{filteredApplications.length} application records in the current workspace</p>
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
          {statusFilters.map((filter) => (
            <button
              className={status === filter ? 'active' : ''}
              key={filter}
              type="button"
              onClick={() => updateStatus(filter)}
            >
              {filter === 'all' ? 'All' : filter[0].toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="panel table-panel" aria-label="Application tracker">
        <div className="application-table">
          <div className="table-row table-head">
            <span>Role</span>
            <span>Source</span>
            <span>Status</span>
            <span>Match</span>
            <span>Last update</span>
            <span>Next step</span>
          </div>
          {filteredApplications.map((application) => (
            <article className="table-row" key={application.id}>
              <div>
                <strong>{application.title}</strong>
                <span>{application.company}</span>
              </div>
              <span>{application.source}</span>
              <StatusBadge status={application.status} />
              <span>{application.fitScore}%</span>
              <span>{application.lastUpdate}</span>
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
