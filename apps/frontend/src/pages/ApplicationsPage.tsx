import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createApplication, formatApplicationDate, getApplications, type ApiApplication, type ApplicationStatus } from '../api/applications';
import { StatusBadge } from '../components/StatusBadge';

const statusFilters: Array<ApplicationStatus | 'all'> = ['all', 'submitted', 'interview', 'blocked', 'rejected', 'offer'];
const applicationStatuses: ApplicationStatus[] = ['submitted', 'interview', 'blocked', 'rejected', 'offer'];

function parseStatus(value: string | null): ApplicationStatus | 'all' {
  return statusFilters.includes(value as ApplicationStatus | 'all') ? value as ApplicationStatus | 'all' : 'all';
}

export function ApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [query, setQuery] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [manualApplication, setManualApplication] = useState({
    title: '',
    company: '',
    source: 'Manual',
    jobUrl: '',
    location: '',
    status: 'submitted' as ApplicationStatus,
    evidenceNotes: '',
  });
  const status = parseStatus(searchParams.get('status'));

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      setError('');

      try {
        const rows = await getApplications(status);
        setApplications(rows);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to load applications.');
      } finally {
        setLoading(false);
      }
    };

    void loadApplications();
  }, [status]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesQuery = !normalizedQuery
        || [application.title, application.company, application.source, application.nextStep].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesQuery;
    });
  }, [applications, query]);

  const updateStatus = (nextStatus: ApplicationStatus | 'all') => {
    setSearchParams(nextStatus === 'all' ? {} : { status: nextStatus });
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingManual(true);
    setError('');
    setNotice('');

    try {
      const createdApplication = await createApplication(manualApplication);
      setApplications((currentApplications) => {
        const withoutDuplicate = currentApplications.filter((application) => application.id !== createdApplication.id);
        return status === 'all' || status === createdApplication.status
          ? [createdApplication, ...withoutDuplicate]
          : withoutDuplicate;
      });
      setManualApplication({
        title: '',
        company: '',
        source: 'Manual',
        jobUrl: '',
        location: '',
        status: 'submitted',
        evidenceNotes: '',
      });
      setShowManualForm(false);
      setNotice('Application record saved.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save application record.');
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Tracker</span>
          <h1>Application tracker</h1>
          <p>{loading ? 'Loading application records...' : `${filteredApplications.length} application records in the current workspace`}</p>
        </div>
        <button className="button primary" type="button" onClick={() => setShowManualForm((value) => !value)}>
          <Plus size={16} aria-hidden="true" />
          Add record
        </button>
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

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="notice-banner">{notice}</div>}

      {showManualForm && (
        <form className="panel manual-application-form" aria-label="Manual application record" onSubmit={handleManualSubmit}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">Manual entry</span>
              <h2>Add an application record</h2>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Role title
              <input
                value={manualApplication.title}
                onChange={(event) => setManualApplication((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </label>
            <label>
              Company
              <input
                value={manualApplication.company}
                onChange={(event) => setManualApplication((current) => ({ ...current, company: event.target.value }))}
                required
              />
            </label>
            <label>
              Source
              <input
                value={manualApplication.source}
                onChange={(event) => setManualApplication((current) => ({ ...current, source: event.target.value }))}
              />
            </label>
            <label>
              Status
              <select
                value={manualApplication.status}
                onChange={(event) => setManualApplication((current) => ({ ...current, status: event.target.value as ApplicationStatus }))}
              >
                {applicationStatuses.map((option) => (
                  <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>
                ))}
              </select>
            </label>
            <label className="field-full">
              Job URL
              <input
                type="url"
                value={manualApplication.jobUrl}
                onChange={(event) => setManualApplication((current) => ({ ...current, jobUrl: event.target.value }))}
                required
              />
            </label>
            <label>
              Location
              <input
                value={manualApplication.location}
                onChange={(event) => setManualApplication((current) => ({ ...current, location: event.target.value }))}
                placeholder="Boston, Remote, United States"
              />
            </label>
            <label className="field-full">
              Notes
              <textarea
                value={manualApplication.evidenceNotes}
                onChange={(event) => setManualApplication((current) => ({ ...current, evidenceNotes: event.target.value }))}
                placeholder="Confirmation email, blocker, interview date, or next step"
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="button secondary" type="button" onClick={() => setShowManualForm(false)}>
              Cancel
            </button>
            <button className="button primary" type="submit" disabled={savingManual}>
              {savingManual ? 'Saving' : 'Save record'}
            </button>
          </div>
        </form>
      )}

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
              <span>{application.matchScore === null ? 'Not scored' : `${application.matchScore}%`}</span>
              <span>{formatApplicationDate(application.lastUpdate)}</span>
              <div>
                <span>{application.nextStep}</span>
                {application.blocker && <small>{application.blocker}</small>}
              </div>
            </article>
          ))}
        </div>
      </section>

      {!loading && !error && filteredApplications.length === 0 && (
        <section className="empty-state">
          <h2>No applications yet</h2>
          <p>Saved jobs are not counted here. Application records will appear after an apply flow creates them.</p>
        </section>
      )}
    </div>
  );
}
