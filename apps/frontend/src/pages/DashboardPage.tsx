import { Bookmark, CheckCircle2, Clock3, FileWarning, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { applications } from '../data/mockData';
import { getSavedJobs, searchJobs, type ApiJob } from '../api/jobs';
import { JobCard } from '../components/JobCard';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';

export function DashboardPage() {
  const [savedJobs, setSavedJobs] = useState<ApiJob[]>([]);
  const [topMatches, setTopMatches] = useState<ApiJob[]>([]);
  const [jobsError, setJobsError] = useState('');

  const submittedApplications = useMemo(() => applications.filter((application) => application.status === 'submitted'), []);
  const interviews = useMemo(() => applications.filter((application) => application.status === 'interview'), []);
  const blockedApplications = useMemo(() => applications.filter((application) => application.status === 'blocked'), []);
  const recentApplications = applications.slice(0, 4);

  useEffect(() => {
    const loadDashboardJobs = async () => {
      try {
        const [saved, matches] = await Promise.all([
          getSavedJobs(),
          searchJobs({ query: 'software engineer', limit: 3 }),
        ]);

        setSavedJobs(saved);
        setTopMatches(matches.jobs.slice(0, 3));
      } catch (err: unknown) {
        setJobsError(err instanceof Error ? err.message : 'Unable to load live job data.');
      }
    };

    void loadDashboardJobs();
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Home</span>
          <h1>Job search workspace</h1>
          <p>Search roles, save targets, and track submitted applications from one workspace.</p>
        </div>
        <Link className="button primary" to="/jobs">
          <Search size={16} aria-hidden="true" />
          Search jobs
        </Link>
      </header>

      <section className="stat-grid" aria-label="Application summary">
        <Link className="stat-link" to="/applications?status=submitted">
          <StatCard icon={CheckCircle2} label="Submitted applications" value={String(submittedApplications.length)} detail="Applications already sent" />
        </Link>
        <Link className="stat-link" to="/applications?status=interview">
          <StatCard icon={Clock3} label="Interviews" value={String(interviews.length)} detail="Submitted roles with interview activity" />
        </Link>
        <Link className="stat-link" to="/applications?status=blocked">
          <StatCard icon={FileWarning} label="Blocked items" value={String(blockedApplications.length)} detail="Need manual attention" />
        </Link>
        <Link className="stat-link" to="/saved">
          <StatCard icon={Bookmark} label="Saved jobs" value={String(savedJobs.length)} detail="Bookmarked roles not yet applied" />
        </Link>
      </section>

      {jobsError && <div className="notice-banner">{jobsError}</div>}

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Matches</span>
              <h2>Strong job matches</h2>
            </div>
            <Link className="text-link" to="/jobs">View all</Link>
          </div>
          <div className="stack">
            {topMatches.map((job) => (
              <JobCard key={job.id} job={job} compact />
            ))}
            {!jobsError && topMatches.length === 0 && (
              <p className="muted-copy">Search jobs to populate live matches from supported sources.</p>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Tracker</span>
              <h2>Recent applications</h2>
            </div>
            <Link className="text-link" to="/applications">Open tracker</Link>
          </div>
          <div className="compact-list">
            {recentApplications.map((application) => (
              <article className="compact-row" key={application.id}>
                <div>
                  <strong>{application.title}</strong>
                  <span>{application.company} - {application.source}</span>
                </div>
                <StatusBadge status={application.status} />
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
