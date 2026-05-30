import { Bookmark, BriefcaseBusiness, ExternalLink, MapPin } from 'lucide-react';
import type { JobListing } from '../data/mockData';

interface JobCardProps {
  job: JobListing;
  compact?: boolean;
  onPrimaryAction?: (job: JobListing) => void;
  onToggleSaved?: (jobId: string) => void;
  primaryActionLabel?: string;
}

export function JobCard({
  job,
  compact = false,
  onPrimaryAction,
  onToggleSaved,
  primaryActionLabel = 'Track application',
}: JobCardProps) {
  return (
    <article className={`job-card${compact ? ' compact' : ''}`}>
      <div className="job-card-main">
        <div>
          <div className="job-card-kicker">
            <span>{job.source}</span>
            <span>{job.posted}</span>
          </div>
          <h3>{job.title}</h3>
          <div className="job-meta">
            <span>
              <BriefcaseBusiness size={15} aria-hidden="true" />
              {job.company}
            </span>
            <span>
              <MapPin size={15} aria-hidden="true" />
              {job.location}
            </span>
          </div>
        </div>

        <div className="match-score" aria-label={`${job.matchScore}% match`}>
          {job.matchScore}%
        </div>
      </div>

      {!compact && <p className="job-summary">{job.summary}</p>}

      <div className="tag-row">
        {job.tags.map((tag) => (
          <span className="tag" key={`${job.id}-${tag}`}>
            {tag}
          </span>
        ))}
      </div>

      <div className="job-card-footer">
        <span>{job.salary}</span>
        <div className="button-row">
          <button
            className="icon-button"
            type="button"
            aria-label={job.saved ? 'Remove saved job' : 'Save job'}
            title={job.saved ? 'Remove saved job' : 'Save job'}
            onClick={() => onToggleSaved?.(job.id)}
          >
            <Bookmark size={17} fill={job.saved ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
          <button className="button secondary" type="button" onClick={() => onPrimaryAction?.(job)}>
            <ExternalLink size={16} aria-hidden="true" />
            {primaryActionLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
