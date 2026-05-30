import { Bookmark, CheckCircle2, Clock3, FileWarning, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { applications, userProfile } from '../data/mockData';
import { JobCard } from '../components/JobCard';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useSavedJobs } from '../hooks/useSavedJobs';

export function DashboardPage() {
  const navigate = useNavigate();
  const { jobsWithSavedState, savedJobs, toggleSavedJob } = useSavedJobs();
  const submittedApplications = applications.filter((application) => application.status === 'submitted');
  const interviews = applications.filter((application) => application.stage === 'Interview');
  const blockedApplications = applications.filter((application) => application.status === 'blocked');
  const topMatches = jobsWithSavedState.slice(0, 3);
  const recentApplications = applications.filter((application) => application.status !== 'rejected').slice(0, 4);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Home</span>
          <h1>RoleMatch workspace</h1>
          <p>{userProfile.targetRoles.join(', ')} - {userProfile.targetLocation}</p>
        </div>
        <button className="button primary" type="button" onClick={() => navigate('/jobs')}>
          <Search size={16} aria-hidden="true" />
          Search jobs
        </button>
      </header>

      <section className="stat-grid" aria-label="Application summary">
        <StatCard icon={CheckCircle2} label="Submitted applications" value={String(submittedApplications.length)} detail="Applications sent or in progress after submission" to="/applications?filter=submitted" />
        <StatCard icon={Clock3} label="Interviews" value={String(interviews.length)} detail="Submitted applications with interview activity" to="/applications?filter=interview" />
        <StatCard icon={FileWarning} label="Blocked applications" value={String(blockedApplications.length)} detail="Need manual completion before submission" to="/applications?filter=blocked" />
        <StatCard icon={Bookmark} label="Saved jobs" value={String(savedJobs.length)} detail="Roles saved but not yet applied to" to="/saved" />
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
              <JobCard
                key={job.id}
                job={job}
                compact
                onPrimaryAction={() => navigate('/jobs')}
                onToggleSaved={toggleSavedJob}
                primaryActionLabel="Open search"
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Tracker</span>
              <h2>Application tracker snapshot</h2>
            </div>
          </div>
          <div className="compact-list">
            {recentApplications.map((application) => (
              <article className="compact-row" key={application.id}>
                <div>
                  <strong>{application.title}</strong>
                  <span>{application.company} - {application.source}</span>
                </div>
                <StatusBadge status={application.status} stage={application.stage} />
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
