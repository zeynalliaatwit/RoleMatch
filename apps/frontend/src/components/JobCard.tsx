import { Bookmark, BriefcaseBusiness, ClipboardCheck, ExternalLink, MapPin } from 'lucide-react';
import { formatPostedAt, formatSalary, type ApiJob } from '../api/jobs';

interface JobCardProps {
  job: ApiJob;
  compact?: boolean;
  pending?: boolean;
  tracking?: boolean;
  onToggleSaved?: (job: ApiJob) => void;
  onTrackApplication?: (job: ApiJob) => void;
}

function summarize(description: string) {
  if (!description) return 'No summary available from this source yet.';
  return description.length > 210 ? `${description.slice(0, 207).trim()}...` : description;
}

export function JobCard({ job, compact = false, pending = false, tracking = false, onToggleSaved, onTrackApplication }: JobCardProps) {
  const tags = job.tags.length > 0
    ? job.tags.slice(0, compact ? 3 : 6)
    : [job.employmentType, job.experienceLevel, job.remote ? 'Remote' : null].filter((tag): tag is string => Boolean(tag));

  return (
    <article className={`job-card${compact ? ' compact' : ''}`}>
      <div className="job-card-main">
        <div>
          <div className="job-card-kicker">
            <span>{job.source}</span>
            <span>{formatPostedAt(job.postedAt)}</span>
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

      {!compact && <p className="job-summary">{summarize(job.description)}</p>}

      <div className="tag-row">
        {tags.map((tag) => (
          <span className="tag" key={`${job.id}-${tag}`}>
            {tag}
          </span>
        ))}
      </div>

      <div className="job-card-footer">
        <span>{formatSalary(job)}</span>
        <div className="button-row">
          <button
            className="icon-button"
            type="button"
            aria-label={job.saved ? 'Unsave job' : 'Save job'}
            title={job.saved ? 'Unsave job' : 'Save job'}
            disabled={pending || !onToggleSaved}
            onClick={() => onToggleSaved?.(job)}
          >
            <Bookmark size={17} fill={job.saved ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
          <a className="button secondary" href={job.jobUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} aria-hidden="true" />
            Open job
          </a>
          {onTrackApplication && !compact && (
            <button
              className="button secondary"
              type="button"
              disabled={tracking}
              onClick={() => onTrackApplication(job)}
            >
              <ClipboardCheck size={16} aria-hidden="true" />
              {tracking ? 'Tracking' : 'Track applied'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
