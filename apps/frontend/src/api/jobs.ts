import { API_BASE_URL, authHeaders, buildQuery, readJson } from './client';

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
  status?: 'pending' | 'complete' | 'error';
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

export interface JobSearchStreamEvent {
  type: 'provider-start' | 'provider-result' | 'local-cache' | 'done';
  provider?: string;
  jobs?: ApiJob[];
  providerResult?: ProviderStatus;
  total?: number;
}

export async function searchJobs(params: JobSearchParams): Promise<JobSearchResponse> {
  const query = buildQuery({ limit: 30, ...params });
  const response = await fetch(`${API_BASE_URL}/api/jobs/search?${query}`, {
    headers: authHeaders(),
  });

  return readJson<JobSearchResponse>(response);
}

export async function streamJobs(
  params: JobSearchParams,
  onEvent: (event: JobSearchStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const query = buildQuery({ limit: 200, ...params });
  const response = await fetch(`${API_BASE_URL}/api/jobs/search/stream?${query}`, {
    headers: authHeaders(),
    signal,
  });

  if (!response.ok || !response.body) {
    await readJson(response);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    chunks.forEach((chunk) => {
      const dataLine = chunk.split('\n').find((line) => line.startsWith('data: '));
      if (!dataLine) return;

      try {
        onEvent(JSON.parse(dataLine.slice(6)) as JobSearchStreamEvent);
      } catch {
        // Ignore malformed stream chunks and continue reading later events.
      }
    });
  }
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
