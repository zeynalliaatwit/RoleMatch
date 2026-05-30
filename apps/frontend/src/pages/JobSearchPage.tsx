import { Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobs } from '../data/mockData';
import { JobCard } from '../components/JobCard';
import { useSavedJobs } from '../hooks/useSavedJobs';

const sourceOptions = ['All sources', ...Array.from(new Set(jobs.map((job) => job.source)))];
const levelOptions = ['All levels', ...Array.from(new Set(jobs.map((job) => job.level)))];

function salaryHighPoint(salary: string) {
  const values = salary.match(/\d+/g)?.map(Number) ?? [];

  if (values.length === 0) {
    return 0;
  }

  return Math.max(...values);
}

export function JobSearchPage() {
  const navigate = useNavigate();
  const { jobsWithSavedState, toggleSavedJob } = useSavedJobs();
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('All sources');
  const [level, setLevel] = useState('All levels');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minimumMatch, setMinimumMatch] = useState(75);
  const [minimumSalary, setMinimumSalary] = useState(60);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return jobsWithSavedState.filter((job) => {
      const matchesQuery = !normalizedQuery
        || [job.title, job.company, job.location, job.summary, ...job.tags].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesSource = source === 'All sources' || job.source === source;
      const matchesLevel = level === 'All levels' || job.level === level;
      const matchesRemote = !remoteOnly || job.remote;
      const matchesScore = job.matchScore >= minimumMatch;
      const matchesSalary = salaryHighPoint(job.salary) >= minimumSalary;

      return matchesQuery && matchesSource && matchesLevel && matchesRemote && matchesScore && matchesSalary;
    });
  }, [jobsWithSavedState, level, minimumMatch, minimumSalary, query, remoteOnly, source]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Jobs</span>
          <h1>Job search</h1>
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

        <button
          className={`icon-button${showAdvancedFilters ? ' active' : ''}`}
          type="button"
          aria-label="More filters"
          title="More filters"
          onClick={() => setShowAdvancedFilters((currentValue) => !currentValue)}
        >
          <Filter size={18} aria-hidden="true" />
        </button>
      </section>

      {showAdvancedFilters && (
        <section className="advanced-filter-row" aria-label="Advanced job filters">
          <label>
            Level
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              {levelOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Salary floor
            <select value={minimumSalary} onChange={(event) => setMinimumSalary(Number(event.target.value))}>
              <option value={60}>$60k+</option>
              <option value={70}>$70k+</option>
              <option value={80}>$80k+</option>
              <option value={90}>$90k+</option>
            </select>
          </label>
        </section>
      )}

      <section className="job-grid" aria-label="Job results">
        {filteredJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onToggleSaved={toggleSavedJob}
            onPrimaryAction={() => navigate('/applications?filter=submitted')}
          />
        ))}
      </section>
    </div>
  );
}
