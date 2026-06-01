import { BookmarkCheck, CalendarClock, SlidersHorizontal } from 'lucide-react';
import { JobCard } from '../components/JobCard';
import { useSavedJobs } from '../hooks/useSavedJobs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type SavedJobSort = 'company' | 'location' | 'match' | 'position' | 'salary';

function salaryMidpoint(salary: string) {
  const values = salary.match(/\d+/g)?.map(Number) ?? [];

  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function SavedJobsPage() {
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<SavedJobSort>('match');
  const { savedJobs, toggleSavedJob } = useSavedJobs();
  const averageMatch = savedJobs.length
    ? Math.round(savedJobs.reduce((total, job) => total + job.matchScore, 0) / savedJobs.length)
    : 0;

  const sortedSavedJobs = useMemo(() => {
    return [...savedJobs].sort((firstJob, secondJob) => {
      if (sortMode === 'match') {
        return secondJob.matchScore - firstJob.matchScore;
      }

      if (sortMode === 'salary') {
        return salaryMidpoint(secondJob.salary) - salaryMidpoint(firstJob.salary);
      }

      if (sortMode === 'location') {
        return firstJob.location.localeCompare(secondJob.location);
      }

      if (sortMode === 'company') {
        return firstJob.company.localeCompare(secondJob.company);
      }

      return firstJob.title.localeCompare(secondJob.title);
    });
  }, [savedJobs, sortMode]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Saved</span>
          <h1>Saved jobs</h1>
          <p>{savedJobs.length} roles queued for resume tailoring and application review</p>
        </div>
        <label className="sort-control">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Sort</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SavedJobSort)}>
            <option value="match">Percent match</option>
            <option value="salary">Salary range</option>
            <option value="location">Location</option>
            <option value="position">Position</option>
            <option value="company">Company</option>
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

      <section className="job-grid" aria-label="Saved job list">
        {sortedSavedJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onToggleSaved={toggleSavedJob}
            onPrimaryAction={() => navigate('/applications?filter=submitted')}
          />
        ))}
        {savedJobs.length === 0 && (
          <div className="empty-state">
            <h2>No saved jobs</h2>
            <p>Save roles from job search to review them here before applying.</p>
          </div>
        )}
      </section>
    </div>
  );
}
