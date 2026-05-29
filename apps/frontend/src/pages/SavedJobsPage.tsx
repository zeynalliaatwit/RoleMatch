import { BookmarkCheck, CalendarClock, SlidersHorizontal } from 'lucide-react';
import { jobs } from '../data/mockData';
import { JobCard } from '../components/JobCard';

export function SavedJobsPage() {
  const savedJobs = jobs.filter((job) => job.saved);
  const averageMatch = Math.round(savedJobs.reduce((total, job) => total + job.matchScore, 0) / savedJobs.length);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Saved</span>
          <h1>Saved jobs</h1>
          <p>{savedJobs.length} roles queued for resume tailoring and application review</p>
        </div>
        <button className="button secondary" type="button">
          <SlidersHorizontal size={16} aria-hidden="true" />
          Sort
        </button>
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
        {savedJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </section>
    </div>
  );
}
