export interface JobSearchFilters {
  query?: string | undefined;
  location?: string | undefined;
  remote?: boolean | undefined;
  employmentType?: string | undefined;
  experienceLevel?: string | undefined;
  minSalary?: number | undefined;
  source?: string | undefined;
  limit: number;
}

export interface NormalizedJob {
  source: string;
  externalId?: string | undefined;
  company: string;
  title: string;
  normalizedTitle?: string | undefined;
  location: string;
  remote: boolean;
  employmentType?: string | undefined;
  experienceLevel?: string | undefined;
  salaryRange?: string | undefined;
  salaryMin?: number | undefined;
  salaryMax?: number | undefined;
  currency?: string | undefined;
  jobUrl: string;
  description: string;
  requirements: string[];
  tags: string[];
  postedAt?: Date | undefined;
}

export interface JobProviderResult {
  provider: string;
  jobs: NormalizedJob[];
  error?: string | undefined;
}

export interface JobProvider {
  name: string;
  search(filters: JobSearchFilters): Promise<JobProviderResult>;
}
