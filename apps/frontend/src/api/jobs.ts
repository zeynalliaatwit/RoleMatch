export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export interface ApiJob {
  id: string;
  source: string;
  company: string;
  title: string;
  location: string;
  remote: boolean;
  employmentType: string | null;
  experienceLevel: string | null;
  salaryRange: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  jobUrl: string;
  description: string;
  requirements: string[];
  tags: string[];
  postedAt: string | null;
  matchScore: number;
  saved: boolean;
}

export interface ProviderStatus {
  provider: string;
  count: number;
  error?: string;
}

export interface JobSearchParams {
  query?: string;
  location?: string;
  remote?: boolean;
  employmentType?: string;
  experienceLevel?: string;
  minSalary?: number;
  source?: string;
  limit?: number;
}

export interface JobSearchResponse {
  jobs: ApiJob[];
  providerResults: ProviderStatus[];
}

function authHeaders() {
  const token = localStorage.getItem('rolematch_token');

  if (!token) {
    throw new Error('You need to log in before searching jobs.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function buildQuery(params: JobSearchParams = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'Any' || value === 'All sources') {
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(data?.error ?? 'Request failed.');
  }

  return data as T;
}

export async function searchJobs(params: JobSearchParams): Promise<JobSearchResponse> {
  const query = buildQuery({ limit: 30, ...params });
  const response = await fetch(`${API_BASE_URL}/api/jobs/search?${query}`, {
    headers: authHeaders(),
  });

  return readJson<JobSearchResponse>(response);
}

export async function getSavedJobs(params: JobSearchParams = {}): Promise<ApiJob[]> {
  const query = buildQuery({ limit: 75, ...params });
  const response = await fetch(`${API_BASE_URL}/api/jobs/saved?${query}`, {
    headers: authHeaders(),
  });
  const data = await readJson<{ jobs: ApiJob[] }>(response);

  return data.jobs;
}

export async function setJobSaved(jobId: string, saved: boolean): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/save`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ saved }),
  });
  const data = await readJson<{ saved: boolean }>(response);

  return data.saved;
}

export function formatPostedAt(postedAt: string | null) {
  if (!postedAt) return 'Recently seen';

  const date = new Date(postedAt);
  if (Number.isNaN(date.getTime())) return 'Recently seen';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatSalary(job: ApiJob) {
  if (job.salaryRange) return job.salaryRange;
  if (job.salaryMin && job.salaryMax) return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
  if (job.salaryMin) return `$${job.salaryMin.toLocaleString()}+`;
  if (job.salaryMax) return `Up to $${job.salaryMax.toLocaleString()}`;

  return 'Salary not listed';
}
