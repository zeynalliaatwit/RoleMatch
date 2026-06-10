import { API_BASE_URL, authHeaders, readJson } from './client';

export interface UserProfile {
  fullName: string;
  location: string | null;
  education: string | null;
  workExperience: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  gender: string | null;
  race: string | null;
  veteranStatus: string | null;
  disabilityStatus: string | null;
  workAuthorization: string | null;
  skills: string[] | null;
  targetRoles?: string[];
  resumeUrl: string | null;
  stats?: {
    applications: number;
    saved: number;
    interviews: number;
  };
}

export interface UpdateProfileInput {
  fullName: string;
  location: string;
  education: string;
  workExperience: string;
  linkedinUrl: string;
  githubUrl: string;
  workAuthorization: string;
  skills: string[];
}

export async function getProfile(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    headers: authHeaders(),
  });

  return readJson<UserProfile>(response);
}

export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ profile: UserProfile }>(response);

  return data.profile;
}
