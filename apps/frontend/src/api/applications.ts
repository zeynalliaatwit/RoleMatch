import { API_BASE_URL, authHeaders, buildQuery, readJson } from './client';

export type ApplicationStatus = 'blocked' | 'interview' | 'offer' | 'rejected' | 'submitted';

export interface ApiApplication {
  id: string;
  jobId: string;
  title: string;
  company: string;
  source: string;
  status: ApplicationStatus;
  matchScore: number | null;
  submittedAt: string | null;
  lastUpdate: string | null;
  nextStep: string;
  blocker: string | null;
  jobUrl: string;
}

export interface CreateApplicationInput {
  jobId?: string;
  title?: string;
  company?: string;
  source?: string;
  jobUrl?: string;
  location?: string;
  status?: ApplicationStatus;
  evidenceNotes?: string;
}

export async function getApplications(status?: ApplicationStatus | 'all'): Promise<ApiApplication[]> {
  const query = buildQuery({ status: status === 'all' ? undefined : status });
  const response = await fetch(`${API_BASE_URL}/api/applications?${query}`, {
    headers: authHeaders(),
  });
  const data = await readJson<{ applications: ApiApplication[] }>(response);

  return data.applications;
}

export async function createApplication(input: CreateApplicationInput): Promise<ApiApplication> {
  const response = await fetch(`${API_BASE_URL}/api/applications`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ application: ApiApplication }>(response);

  return data.application;
}

export function formatApplicationDate(value: string | null) {
  if (!value) return 'Not recorded';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}
