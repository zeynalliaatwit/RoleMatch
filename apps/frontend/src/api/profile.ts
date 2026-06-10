import { API_BASE_URL, authHeaders, readJson } from './client';

export interface EducationEntry {
  school: string;
  degree: string;
  field: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  notes?: string;
  courses?: string[];
}

export interface WorkHistoryEntry {
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  highlights?: string[];
  skills?: string[];
}

export interface ProjectEntry {
  name: string;
  role?: string;
  url?: string;
  description?: string;
  technologies?: string[];
}

export interface CertificationEntry {
  name: string;
  issuer?: string;
  issuedAt?: string;
  expiresAt?: string;
}

export interface AutofillAnswers {
  authorizedToWork?: string;
  sponsorshipRequired?: string;
  veteranStatus?: string;
  disabilityStatus?: string;
  gender?: string;
  race?: string;
  yearsProfessionalExperience?: string;
  yearsSoftwareExperience?: string;
  yearsReactExperience?: string;
  yearsNodeExperience?: string;
  yearsPythonExperience?: string;
  willingToRelocate?: string;
  desiredSalary?: string;
  earliestStartDate?: string;
}

export interface ProfileDocument {
  id: string;
  label: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  uploadedAt: string;
}

export interface UserProfile {
  fullName: string;
  phone: string | null;
  location: string | null;
  education: string | null;
  workExperience: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  indeedUrl: string | null;
  gender: string | null;
  race: string | null;
  veteranStatus: string | null;
  disabilityStatus: string | null;
  workAuthorization: string | null;
  skills: string[] | null;
  targetRoles: string[] | null;
  relevantCourses: string[] | null;
  preferredLocations: string[] | null;
  salaryMinimum: string | null;
  portfolioLinks: string[] | null;
  educationHistory: EducationEntry[] | null;
  workHistory: WorkHistoryEntry[] | null;
  projectHistory: ProjectEntry[] | null;
  certifications: CertificationEntry[] | null;
  autofillAnswers: AutofillAnswers | null;
  documents: ProfileDocument[];
  resumeUrl: string | null;
  stats?: {
    applications: number;
    saved: number;
    interviews: number;
  };
}

export interface UpdateProfileInput {
  fullName: string;
  phone: string;
  location: string;
  education: string;
  workExperience: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  indeedUrl: string;
  workAuthorization: string;
  veteranStatus: string;
  disabilityStatus: string;
  gender: string;
  race: string;
  salaryMinimum: string;
  skills: string[];
  targetRoles: string[];
  preferredLocations: string[];
  relevantCourses: string[];
  portfolioLinks: string[];
  educationHistory: EducationEntry[];
  workHistory: WorkHistoryEntry[];
  projectHistory: ProjectEntry[];
  certifications: CertificationEntry[];
  autofillAnswers: AutofillAnswers;
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

export async function uploadProfileDocument(file: File, documentType: string, label: string): Promise<ProfileDocument> {
  const body = new FormData();
  body.append('document', file);
  body.append('documentType', documentType);
  body.append('label', label || file.name);

  const response = await fetch(`${API_BASE_URL}/api/profile/documents`, {
    method: 'POST',
    headers: authHeaders(),
    body,
  });
  const data = await readJson<{ document: ProfileDocument }>(response);

  return data.document;
}
