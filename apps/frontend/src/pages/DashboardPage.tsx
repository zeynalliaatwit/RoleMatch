import { Bookmark, CheckCircle2, Clock3, FileWarning, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { applications, jobs, userProfile } from '../data/mockData';
import { JobCard } from '../components/JobCard';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';

export function DashboardPage() {
  const savedJobs = jobs.filter((job) => job.saved);
  const activeApplications = applications.filter((application) => !['rejected', 'saved'].includes(application.status));
  const interviews = applications.filter((application) => application.status === 'interview');
  const blockedApplications = applications.filter((application) => application.status === 'blocked');
  const topMatches = jobs.slice(0, 3);
  const recentApplications = applications.slice(0, 4);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Home</span>
          <h1>Job search workspace</h1>
          <p>{userProfile.targetRoles.join(', ')} - {userProfile.targetLocation}</p>
        </div>
        <button className="button primary" type="button">
          <Send size={16} aria-hidden="true" />
          New application
        </button>
      </header>

      <section className="stat-grid" aria-label="Application summary">
        <StatCard icon={CheckCircle2} label="Active applications" value={String(activeApplications.length)} detail="Drafts, submitted, and interviews" />
        <StatCard icon={Bookmark} label="Saved jobs" value={String(savedJobs.length)} detail="Ready for review" />
        <StatCard icon={Clock3} label="Interviews" value={String(interviews.length)} detail="Upcoming or in progress" />
        <StatCard icon={FileWarning} label="Blocked items" value={String(blockedApplications.length)} detail="Need manual attention" />
      </section>

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
