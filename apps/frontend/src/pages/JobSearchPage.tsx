import { Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { jobs } from '../data/mockData';
import { JobCard } from '../components/JobCard';

const sourceOptions = ['All sources', ...Array.from(new Set(jobs.map((job) => job.source)))];

export function JobSearchPage() {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('All sources');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minimumMatch, setMinimumMatch] = useState(75);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesQuery = !normalizedQuery
        || [job.title, job.company, job.location, job.summary, ...job.tags].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesSource = source === 'All sources' || job.source === source;
      const matchesRemote = !remoteOnly || job.remote;
      const matchesScore = job.matchScore >= minimumMatch;

      return matchesQuery && matchesSource && matchesRemote && matchesScore;
    });
  }, [minimumMatch, query, remoteOnly, source]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Search</span>
          <h1>Find jobs</h1>
          <p>{filteredJobs.length} matching roles across company and ATS sources</p>
        </div>
      </header>

      <section className="search-toolbar" aria-label="Job filters">
        <label className="input-with-icon">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, company, skill, or location"
          />
        </label>

        <label>
          Source
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            {sourceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Match
          <input
            type="range"
            min="60"
            max="95"
            step="5"
            value={minimumMatch}
            onChange={(event) => setMinimumMatch(Number(event.target.value))}
          />
          <span className="range-value">{minimumMatch}%+</span>
        </label>

        <label className="checkbox-control">
          <input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} />
          Remote only
        </label>

        <button className="icon-button" type="button" aria-label="More filters" title="More filters">
          <Filter size={18} aria-hidden="true" />
        </button>
      </section>

      <section className="job-grid" aria-label="Job results">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </section>
    </div>
  );
}
