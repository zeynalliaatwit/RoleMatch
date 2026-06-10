import { BookmarkCheck, CalendarClock, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getSavedJobs, setJobSaved, type ApiJob } from '../api/jobs';
import { JobCard } from '../components/JobCard';

type SortKey = 'match' | 'salary' | 'location' | 'position';

function salaryValue(job: ApiJob) {
  return job.salaryMax ?? job.salaryMin ?? 0;
}

export function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<ApiJob[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('match');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedJobs = async () => {
      setLoading(true);
      setError('');

      try {
        const jobs = await getSavedJobs();
        setSavedJobs(jobs);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to load saved jobs.');
      } finally {
        setLoading(false);
      }
    };

    void loadSavedJobs();
  }, []);

  const sortedJobs = useMemo(() => {
    return [...savedJobs].sort((first, second) => {
      if (sortKey === 'salary') return salaryValue(second) - salaryValue(first);
      if (sortKey === 'location') return first.location.localeCompare(second.location);
      if (sortKey === 'position') return first.title.localeCompare(second.title);

      return second.matchScore - first.matchScore;
    });
  }, [savedJobs, sortKey]);

  const averageMatch = savedJobs.length > 0
    ? Math.round(savedJobs.reduce((total, job) => total + job.matchScore, 0) / savedJobs.length)
    : 0;

  const handleToggleSaved = async (job: ApiJob) => {
    setPendingJobId(job.id);
    setError('');

    try {
      await setJobSaved(job.id, false);
      setSavedJobs((currentJobs) => currentJobs.filter((currentJob) => currentJob.id !== job.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update saved job.');
    } finally {
      setPendingJobId(null);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Saved jobs</span>
          <h1>Saved jobs</h1>
          <p>{loading ? 'Loading saved roles...' : `${savedJobs.length} roles queued for review`}</p>
        </div>
        <label className="sort-control">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Sort</span>
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
            <option value="match">Match score</option>
            <option value="salary">Salary</option>
            <option value="location">Location</option>
            <option value="position">Position</option>
          </select>
        </label>
      </header>

      <section className="summary-strip" aria-label="Saved job summary">
        <div>
          <BookmarkCheck size={18} aria-hidden="true" />
          <span>{savedJobs.length} saved roles</span>
        </div>
        <div>
          <CalendarClock size={18} aria-hidden="true" />
          <span>{averageMatch}% average match</span>
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="job-grid" aria-label="Saved job list">
        {sortedJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            pending={pendingJobId === job.id}
            onToggleSaved={handleToggleSaved}
          />
        ))}
      </section>

      {!loading && !error && sortedJobs.length === 0 && (
        <section className="empty-state">
          <h2>No saved jobs yet</h2>
          <p>Bookmark roles from job search and they will appear here for later review.</p>
        </section>
      )}
    </div>
  );
}
