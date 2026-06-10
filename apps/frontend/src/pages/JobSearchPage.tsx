import { Filter, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { JobCard } from '../components/JobCard';
import { createApplication } from '../api/applications';
import { setJobSaved, streamJobs, type ApiJob, type JobSearchParams, type ProviderStatus } from '../api/jobs';

const sourceOptions = ['All sources', 'The Muse', 'Adzuna', 'Workday', 'Remotive', 'Arbeitnow', 'RemoteOK', 'Lever', 'Greenhouse', 'USAJOBS', 'Indeed', 'LinkedIn'];
const employmentOptions = ['Any', 'Full time', 'Part time', 'Internship', 'Contract', 'Temporary'];
const experienceOptions = ['Any', 'Internship', 'Entry level', 'Mid level', 'Senior', 'Leadership'];
const limitOptions = [200, 300, 400, 500];
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
  const [location, setLocation] = useState('Boston');
  const [source, setSource] = useState('All sources');
  const [employmentType, setEmploymentType] = useState('Any');
  const [experienceLevel, setExperienceLevel] = useState('Any');
  const [minSalary, setMinSalary] = useState(0);
  const [limit, setLimit] = useState(200);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [providerResults, setProviderResults] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [trackingJobId, setTrackingJobId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (filters: JobSearchParams) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');
    setNotice('');
    setJobs([]);
    setProviderResults([]);

    try {
      await streamJobs(filters, (event) => {
        if (event.type === 'provider-start' && event.provider) {
          setProviderResults((current) => {
            const nextStatus: ProviderStatus = { provider: event.provider!, count: 0, status: 'pending' };
            const exists = current.some((result) => result.provider === event.provider);
            return exists
              ? current.map((result) => result.provider === event.provider ? nextStatus : result)
              : [...current, nextStatus];
          });
        }

        if ((event.type === 'provider-result' || event.type === 'local-cache') && event.providerResult) {
          setProviderResults((current) => {
            const nextStatus: ProviderStatus = {
              ...event.providerResult!,
              status: event.providerResult!.error ? 'error' : 'complete',
            };
            const exists = current.some((result) => result.provider === nextStatus.provider);
            return exists
              ? current.map((result) => result.provider === nextStatus.provider ? nextStatus : result)
              : [...current, nextStatus];
          });
        }

        if (event.jobs && event.jobs.length > 0) {
          setJobs((currentJobs) => {
            const jobMap = new Map(currentJobs.map((job) => [job.id, job]));
            event.jobs?.forEach((job) => jobMap.set(job.id, job));

            return Array.from(jobMap.values())
              .sort((first, second) => second.matchScore - first.matchScore)
              .slice(0, filters.limit ?? 500);
          });
        }
      }, controller.signal);
    } catch (err: unknown) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'Unable to search jobs.');
        setJobs([]);
        setProviderResults([]);
      }
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runSearch({ query: 'software engineer', location: 'Boston', limit: 200 });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
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
      limit,
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

  const handleTrackApplication = async (job: ApiJob) => {
    setTrackingJobId(job.id);
    setError('');
    setNotice('');

    try {
      await createApplication({
        jobId: job.id,
        status: 'submitted',
        evidenceNotes: 'Tracked from RoleMatch after opening or completing the external job application.',
      });
      setNotice(`${job.title} at ${job.company} was added to the application tracker.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to track application.');
    } finally {
      setTrackingJobId(null);
    }
  };

  const unavailableProviders = providerResults.filter((result) => result.error);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Job search</span>
          <h1>Job search</h1>
          <p>{loading ? `Streaming live results... ${jobs.length} roles found so far` : `${jobs.length} matching roles found`}</p>
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

        <label>
          Results
          <select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
            {limitOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
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
            <span className={`provider-pill ${result.status ?? ''}${result.error ? ' warning' : ''}`} key={result.provider} title={result.error ?? undefined}>
              {result.provider}: {result.status === 'pending' ? 'searching' : result.error ? 'unavailable' : `${result.count} roles`}
            </span>
          ))}
        </section>
      )}

      {unavailableProviders.length > 0 && (
        <div className="notice-banner">
          Some sources require partner credentials, configured ATS boards, or explicit permission. Results from working live sources continue streaming in.
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="notice-banner">{notice}</div>}

      <section className="job-grid" aria-label="Job results">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            pending={pendingJobId === job.id}
            tracking={trackingJobId === job.id}
            onToggleSaved={handleToggleSaved}
            onTrackApplication={handleTrackApplication}
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
