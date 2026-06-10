import { Filter, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { JobCard } from '../components/JobCard';
import { searchJobs, setJobSaved, type ApiJob, type JobSearchParams, type ProviderStatus } from '../api/jobs';

const sourceOptions = ['All sources', 'Remotive', 'Arbeitnow', 'RemoteOK', 'Lever', 'Greenhouse', 'USAJOBS'];
const employmentOptions = ['Any', 'Full time', 'Part time', 'Internship', 'Contract', 'Temporary'];
const experienceOptions = ['Any', 'Internship', 'Entry level', 'Mid level', 'Senior', 'Leadership'];
const salaryOptions = [
  { label: 'Any salary', value: 0 },
  { label: '$50,000+', value: 50000 },
  { label: '$60,000+', value: 60000 },
  { label: '$70,000+', value: 70000 },
  { label: '$85,000+', value: 85000 },
  { label: '$100,000+', value: 100000 },
];

export function JobSearchPage() {
  const [query, setQuery] = useState('software engineer');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('All sources');
  const [employmentType, setEmploymentType] = useState('Any');
  const [experienceLevel, setExperienceLevel] = useState('Any');
  const [minSalary, setMinSalary] = useState(0);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [providerResults, setProviderResults] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  const runSearch = useCallback(async (filters: JobSearchParams) => {
    setLoading(true);
    setError('');

    try {
      const result = await searchJobs(filters);
      setJobs(result.jobs);
      setProviderResults(result.providerResults);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to search jobs.');
      setJobs([]);
      setProviderResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runSearch({ query: 'software engineer', limit: 30 });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [runSearch]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch({
      query: query.trim(),
      location: location.trim(),
      remote: remoteOnly,
      source,
      employmentType,
      experienceLevel,
      minSalary: minSalary || undefined,
      limit: 30,
    });
  };

  const handleToggleSaved = async (job: ApiJob) => {
    const nextSaved = !job.saved;
    setPendingJobId(job.id);
    setError('');

    try {
      await setJobSaved(job.id, nextSaved);
      setJobs((currentJobs) => currentJobs.map((currentJob) => (
        currentJob.id === job.id ? { ...currentJob, saved: nextSaved } : currentJob
      )));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update saved job.');
    } finally {
      setPendingJobId(null);
    }
  };

  const unavailableProviders = providerResults.filter((result) => result.error);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Job search</span>
          <h1>Job search</h1>
          <p>{loading ? 'Searching supported sources...' : `${jobs.length} matching roles found`}</p>
        </div>
      </header>

      <form className="search-toolbar search-toolbar-expanded" aria-label="Job filters" onSubmit={handleSearch}>
        <label className="input-with-icon">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, company, skill, or keyword"
          />
        </label>

        <label>
          Location
          <input
            type="search"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Boston, Remote, United States"
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
          Type
          <select value={employmentType} onChange={(event) => setEmploymentType(event.target.value)}>
            {employmentOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Experience
          <select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)}>
            {experienceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Salary
          <select value={minSalary} onChange={(event) => setMinSalary(Number(event.target.value))}>
            {salaryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="checkbox-control">
          <input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} />
          Remote only
        </label>

        <button className="button primary" type="submit" disabled={loading}>
          <Filter size={16} aria-hidden="true" />
          {loading ? 'Searching' : 'Search'}
        </button>
      </form>

      {providerResults.length > 0 && (
        <section className="provider-strip" aria-label="Provider status">
          {providerResults.map((result) => (
            <span className={`provider-pill${result.error ? ' warning' : ''}`} key={result.provider} title={result.error ?? undefined}>
              {result.provider}: {result.error ? 'unavailable' : `${result.count} roles`}
            </span>
          ))}
        </section>
      )}

      {unavailableProviders.length > 0 && (
        <div className="notice-banner">
          Some optional sources need configuration or are temporarily unavailable. Results from working sources are still shown.
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <section className="job-grid" aria-label="Job results">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            pending={pendingJobId === job.id}
            onToggleSaved={handleToggleSaved}
          />
        ))}
      </section>

      {!loading && !error && jobs.length === 0 && (
        <section className="empty-state">
          <h2>No matching jobs yet</h2>
          <p>Try a broader keyword, remove the salary floor, or search without the remote-only filter.</p>
        </section>
      )}
    </div>
  );
}
