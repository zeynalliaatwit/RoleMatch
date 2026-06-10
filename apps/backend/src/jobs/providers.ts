import {
  extractRequirements,
  extractSalary,
  extractTags,
  inferEmploymentType,
  inferExperienceLevel,
  inferRemote,
  matchesFilters,
  stripHtml,
  truncate,
} from './normalization.js';
import type { JobProvider, JobProviderResult, JobSearchFilters, NormalizedJob } from './types.js';

async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = 9000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RoleMatch Senior Project (local demo)',
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

function safeDate(value?: string | number | null) {
  if (!value) return undefined;
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function finalizeJob(job: NormalizedJob, filters: JobSearchFilters) {
  const description = stripHtml(job.description);
  const tags = extractTags(job.title, description, job.tags);
  const salary = extractSalary(description, job.salaryMin, job.salaryMax);

  return {
    ...job,
    description: truncate(description || `${job.title} at ${job.company}`, 4000),
    requirements: job.requirements.length > 0 ? job.requirements : extractRequirements(description),
    tags,
    remote: job.remote || inferRemote(job.location),
    employmentType: job.employmentType || inferEmploymentType(job.title, description, tags),
    experienceLevel: job.experienceLevel || inferExperienceLevel(job.title, description),
    normalizedTitle: job.normalizedTitle || job.title.toLowerCase(),
    ...salary,
  };
}

function filterAndLimit(jobs: NormalizedJob[], filters: JobSearchFilters) {
  return jobs
    .map((job) => finalizeJob(job, filters))
    .filter((job) => matchesFilters(job, filters))
    .slice(0, filters.limit);
}

function museLocation(location?: string) {
  const normalized = normalizeLocationLabel(location);
  if (/^boston(,\s*ma|\s+ma)?$/i.test(normalized)) return 'Boston, MA';

  return normalized;
}

function normalizeLocationLabel(location?: string) {
  return (location ?? '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const remotiveProvider: JobProvider = {
  name: 'Remotive',
  async search(filters) {
    const url = new URL('https://remotive.com/api/remote-jobs');
    if (filters.query) url.searchParams.set('search', filters.query);
    if (filters.limit) url.searchParams.set('limit', String(Math.min(filters.limit, 50)));

    const data = await fetchJson<{ jobs?: Array<Record<string, unknown>> }>(url.toString());
    const jobs = (data.jobs ?? []).map((item) => {
      const description = stripHtml(String(item.description ?? ''));
      const title = String(item.title ?? 'Untitled role');
      const company = String(item.company_name ?? 'Unknown company');

      return {
        source: 'Remotive',
        externalId: String(item.id ?? item.url ?? title),
        company,
        title,
        location: String(item.candidate_required_location ?? 'Remote'),
        remote: true,
        jobUrl: String(item.url ?? ''),
        description,
        requirements: extractRequirements(description),
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [String(item.category ?? '')].filter(Boolean),
        postedAt: safeDate(String(item.publication_date ?? '')),
      } satisfies NormalizedJob;
    }).filter((job) => job.jobUrl);

    return { provider: this.name, jobs: filterAndLimit(jobs, filters) };
  },
};

export const museProvider: JobProvider = {
  name: 'The Muse',
  async search(filters) {
    const requestedJobs = Math.min(filters.limit, 100);
    const requestedPages = Math.max(5, Math.ceil(requestedJobs / 3));
    const isSoftwareSearch = /software|engineer|developer|frontend|backend|full\s?stack|data|web/i.test(filters.query ?? '');
    const buildUrl = (page: number) => {
      const url = new URL('https://www.themuse.com/api/public/jobs');
      url.searchParams.set('page', String(page));
      url.searchParams.set('descending', 'true');
      if (filters.location) url.searchParams.set('location', museLocation(filters.location));
      if (isSoftwareSearch) url.searchParams.set('category', 'Software Engineering');

      return url.toString();
    };

    const firstPage = await fetchJson<{ page_count?: number; results?: Array<Record<string, unknown>> }>(buildUrl(1), {}, 12000);
    const pages = Math.max(1, Math.min(firstPage.page_count ?? requestedPages, requestedPages, 30));
    const remainingResponses = pages > 1
      ? await Promise.all(Array.from({ length: pages - 1 }, (_, index) => (
        fetchJson<{ results?: Array<Record<string, unknown>> }>(buildUrl(index + 2), {}, 12000)
      )))
      : [];
    const responses = [firstPage, ...remainingResponses];

    const jobs = responses.flatMap((data) => data.results ?? []).map((item) => {
      const title = String(item.name ?? 'Untitled role');
      const company = item.company && typeof item.company === 'object'
        ? String((item.company as Record<string, unknown>).name ?? 'Unknown company')
        : 'Unknown company';
      const locations = Array.isArray(item.locations) ? item.locations as Array<Record<string, unknown>> : [];
      const levels = Array.isArray(item.levels) ? item.levels as Array<Record<string, unknown>> : [];
      const categories = Array.isArray(item.categories) ? item.categories as Array<Record<string, unknown>> : [];
      const description = stripHtml(String(item.contents ?? ''));
      const location = locations.map((entry) => String(entry.name ?? '')).filter(Boolean).join(', ') || 'Not specified';
      const categoryTags = categories.map((entry) => String(entry.name ?? '')).filter(Boolean);

      return {
        source: 'The Muse',
        externalId: String(item.id ?? item.refs ?? item.url ?? title),
        company,
        title,
        location,
        remote: inferRemote(location),
        employmentType: undefined,
        experienceLevel: levels[0]?.name ? String(levels[0].name) : undefined,
        jobUrl: String(item.refs && typeof item.refs === 'object' ? (item.refs as Record<string, unknown>).landing_page ?? '' : ''),
        description,
        requirements: extractRequirements(description),
        tags: categoryTags.length > 0 ? categoryTags : ['Software Engineering'],
        postedAt: safeDate(String(item.publication_date ?? '')),
      } satisfies NormalizedJob;
    }).filter((job) => job.jobUrl);

    return { provider: this.name, jobs: filterAndLimit(jobs, filters) };
  },
};

export const arbeitnowProvider: JobProvider = {
  name: 'Arbeitnow',
  async search(filters) {
    const data = await fetchJson<{ data?: Array<Record<string, unknown>> }>('https://www.arbeitnow.com/api/job-board-api');
    const jobs = (data.data ?? []).map((item) => {
      const description = stripHtml(String(item.description ?? ''));
      const title = String(item.title ?? 'Untitled role');
      const tags = [
        ...(Array.isArray(item.tags) ? item.tags.map(String) : []),
        ...(Array.isArray(item.job_types) ? item.job_types.map(String) : []),
      ];

      return {
        source: 'Arbeitnow',
        externalId: String(item.slug ?? item.url ?? title),
        company: String(item.company_name ?? 'Unknown company'),
        title,
        location: String(item.location ?? 'Europe / Remote'),
        remote: inferRemote(String(item.location ?? ''), item.remote as boolean | undefined),
        employmentType: Array.isArray(item.job_types) ? String(item.job_types[0] ?? '') || undefined : undefined,
        jobUrl: String(item.url ?? ''),
        description,
        requirements: extractRequirements(description),
        tags,
        postedAt: safeDate(Number(item.created_at ?? 0)),
      } satisfies NormalizedJob;
    }).filter((job) => job.jobUrl);

    return { provider: this.name, jobs: filterAndLimit(jobs, filters) };
  },
};

export const remoteOkProvider: JobProvider = {
  name: 'RemoteOK',
  async search(filters) {
    const data = await fetchJson<Array<Record<string, unknown>>>('https://remoteok.com/api');
    const jobs = data.filter((item) => item && item.id).map((item) => {
      const description = stripHtml(String(item.description ?? ''));
      const title = String(item.position ?? 'Untitled role');
      const salaryMin = Number(item.salary_min ?? 0) || undefined;
      const salaryMax = Number(item.salary_max ?? 0) || undefined;

      return {
        source: 'RemoteOK',
        externalId: String(item.id ?? item.slug ?? item.url ?? title),
        company: String(item.company ?? 'Unknown company'),
        title,
        location: String(item.location ?? 'Remote'),
        remote: true,
        salaryMin,
        salaryMax,
        jobUrl: String(item.url ?? ''),
        description,
        requirements: extractRequirements(description),
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
        postedAt: safeDate(String(item.date ?? '')),
      } satisfies NormalizedJob;
    }).filter((job) => job.jobUrl);

    return { provider: this.name, jobs: filterAndLimit(jobs, filters) };
  },
};

export const adzunaProvider: JobProvider = {
  name: 'Adzuna',
  async search(filters) {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    const country = process.env.ADZUNA_COUNTRY || 'us';

    if (!appId || !appKey) {
      return { provider: this.name, jobs: [], error: 'ADZUNA_APP_ID and ADZUNA_APP_KEY are not configured.' };
    }

    const requestedJobs = Math.min(filters.limit, 100);
    const pages = Math.max(1, Math.min(Math.ceil(requestedJobs / 50), 4));
    const responses = await Promise.all(Array.from({ length: pages }, (_, index) => {
      const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${index + 1}`);
      url.searchParams.set('app_id', appId);
      url.searchParams.set('app_key', appKey);
      url.searchParams.set('content-type', 'application/json');
      url.searchParams.set('results_per_page', String(Math.min(50, requestedJobs)));
      if (filters.query) url.searchParams.set('what', filters.query);
      if (filters.location) url.searchParams.set('where', filters.location);
      if (filters.minSalary) url.searchParams.set('salary_min', String(filters.minSalary));
      if (filters.remote) url.searchParams.set('what_or', 'remote');

      return fetchJson<{ results?: Array<Record<string, unknown>> }>(url.toString(), {}, 12000);
    }));

    const jobs = responses.flatMap((data) => data.results ?? []).map((item) => {
      const title = String(item.title ?? 'Untitled role');
      const location = item.location && typeof item.location === 'object'
        ? String((item.location as Record<string, unknown>).display_name ?? 'Not specified')
        : 'Not specified';
      const category = item.category && typeof item.category === 'object'
        ? String((item.category as Record<string, unknown>).label ?? '')
        : '';
      const description = stripHtml(String(item.description ?? ''));

      return {
        source: 'Adzuna',
        externalId: String(item.id ?? item.redirect_url ?? title),
        company: String(item.company && typeof item.company === 'object' ? (item.company as Record<string, unknown>).display_name ?? 'Unknown company' : 'Unknown company'),
        title,
        location,
        remote: inferRemote(location, filters.remote),
        salaryMin: Number(item.salary_min ?? 0) || undefined,
        salaryMax: Number(item.salary_max ?? 0) || undefined,
        currency: country === 'us' ? 'USD' : undefined,
        jobUrl: String(item.redirect_url ?? ''),
        description,
        requirements: extractRequirements(description),
        tags: [category].filter(Boolean),
        postedAt: safeDate(String(item.created ?? '')),
      } satisfies NormalizedJob;
    }).filter((job) => job.jobUrl);

    return { provider: this.name, jobs: filterAndLimit(jobs, filters) };
  },
};

export function leverProvider(companySlug: string): JobProvider {
  return {
    name: `Lever:${companySlug}`,
    async search(filters) {
      const data = await fetchJson<Array<Record<string, unknown>>>(`https://api.lever.co/v0/postings/${companySlug}?mode=json`);
      const jobs = data.map((item) => {
        const description = stripHtml(String(item.descriptionPlain ?? item.description ?? ''));
        const categories = item.categories as Record<string, unknown> | undefined;
        const title = String(item.text ?? 'Untitled role');

        return {
          source: 'Lever',
          externalId: String(item.id ?? item.hostedUrl ?? title),
          company: companySlug,
          title,
          location: String(categories?.location ?? 'Not specified'),
          remote: inferRemote(String(categories?.location ?? '')),
          employmentType: categories?.commitment ? String(categories.commitment) : undefined,
          jobUrl: String(item.hostedUrl ?? item.applyUrl ?? ''),
          description,
          requirements: extractRequirements(description),
          tags: [String(categories?.team ?? ''), String(categories?.department ?? '')].filter(Boolean),
          postedAt: safeDate(Number(item.createdAt ?? 0) / 1000),
        } satisfies NormalizedJob;
      }).filter((job) => job.jobUrl);

      return { provider: this.name, jobs: filterAndLimit(jobs, filters) };
    },
  };
}

export function greenhouseProvider(boardToken: string): JobProvider {
  return {
    name: `Greenhouse:${boardToken}`,
    async search(filters) {
      const data = await fetchJson<{ jobs?: Array<Record<string, unknown>> }>(`https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`);
      const jobs = (data.jobs ?? []).map((item) => {
        const description = stripHtml(String(item.content ?? ''));
        const offices = Array.isArray(item.offices) ? item.offices as Array<Record<string, unknown>> : [];
        const departments = Array.isArray(item.departments) ? item.departments as Array<Record<string, unknown>> : [];
        const title = String(item.title ?? 'Untitled role');

        return {
          source: 'Greenhouse',
          externalId: String(item.id ?? item.absolute_url ?? title),
          company: boardToken,
          title,
          location: String(item.location && typeof item.location === 'object' ? (item.location as Record<string, unknown>).name ?? 'Not specified' : 'Not specified'),
          remote: inferRemote(JSON.stringify(item.location ?? '')),
          jobUrl: String(item.absolute_url ?? ''),
          description,
          requirements: extractRequirements(description),
          tags: [...offices.map((office) => String(office.name ?? '')), ...departments.map((department) => String(department.name ?? ''))].filter(Boolean),
          postedAt: safeDate(String(item.updated_at ?? '')),
        } satisfies NormalizedJob;
      }).filter((job) => job.jobUrl);

      return { provider: this.name, jobs: filterAndLimit(jobs, filters) };
    },
  };
}

export const usaJobsProvider: JobProvider = {
  name: 'USAJOBS',
  async search(filters) {
    const apiKey = process.env.USAJOBS_API_KEY;
    const userAgent = process.env.USAJOBS_USER_AGENT || process.env.USAJOBS_EMAIL;

    if (!apiKey || !userAgent) {
      return { provider: this.name, jobs: [], error: 'USAJOBS_API_KEY and USAJOBS_USER_AGENT are not configured.' };
    }

    const url = new URL('https://data.usajobs.gov/api/search');
    if (filters.query) url.searchParams.set('Keyword', filters.query);
    if (filters.location) url.searchParams.set('LocationName', filters.location);
    if (filters.remote) url.searchParams.set('RemoteIndicator', 'true');
    url.searchParams.set('ResultsPerPage', String(Math.min(filters.limit, 50)));

    const data = await fetchJson<{ SearchResult?: { SearchResultItems?: Array<Record<string, unknown>> } }>(url.toString(), {
      headers: {
        'Host': 'data.usajobs.gov',
        'User-Agent': userAgent,
        'Authorization-Key': apiKey,
      },
    });

    const jobs = (data.SearchResult?.SearchResultItems ?? []).map((wrapper) => {
      const item = wrapper.MatchedObjectDescriptor as Record<string, unknown> | undefined;
      const userArea = item?.UserArea as Record<string, unknown> | undefined;
      const details = userArea?.Details as Record<string, unknown> | undefined;
      const description = stripHtml(String(item?.QualificationSummary ?? item?.UserArea ?? ''));
      const positionLocation = Array.isArray(item?.PositionLocation) ? item.PositionLocation[0] as Record<string, unknown> : undefined;
      const salary = item?.PositionRemuneration && Array.isArray(item.PositionRemuneration)
        ? item.PositionRemuneration[0] as Record<string, unknown>
        : undefined;
      const jobCategories = Array.isArray(item?.JobCategory) ? item.JobCategory as Array<Record<string, unknown>> : [];

      return {
        source: 'USAJOBS',
        externalId: String(item?.PositionID ?? item?.PositionURI ?? item?.PositionTitle),
        company: String(item?.OrganizationName ?? 'Federal agency'),
        title: String(item?.PositionTitle ?? 'Untitled role'),
        location: String(positionLocation?.LocationName ?? 'United States'),
        remote: inferRemote(String(details?.TeleworkEligible ?? ''), details?.RemoteIndicator as boolean | undefined),
        employmentType: Array.isArray(item?.PositionSchedule) ? String((item.PositionSchedule[0] as Record<string, unknown>).Name ?? '') : undefined,
        salaryMin: salary?.MinimumRange ? Number(salary.MinimumRange) : undefined,
        salaryMax: salary?.MaximumRange ? Number(salary.MaximumRange) : undefined,
        currency: String(salary?.RateIntervalCode ?? 'USD'),
        jobUrl: String(item?.PositionURI ?? ''),
        description,
        requirements: extractRequirements(description),
        tags: ['Federal', String(jobCategories[0]?.Name ?? '')].filter(Boolean),
        postedAt: safeDate(String(item?.PublicationStartDate ?? '')),
      } satisfies NormalizedJob;
    }).filter((job) => job.jobUrl);

    return { provider: this.name, jobs: filterAndLimit(jobs, filters) };
  },
};

export function getConfiguredProviders(): JobProvider[] {
  const providers: JobProvider[] = [museProvider, remotiveProvider, arbeitnowProvider, remoteOkProvider, adzunaProvider];
  const leverCompanies = (process.env.LEVER_COMPANIES ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  const greenhouseBoards = (process.env.GREENHOUSE_BOARDS ?? '').split(',').map((value) => value.trim()).filter(Boolean);

  providers.push(...leverCompanies.map(leverProvider));
  providers.push(...greenhouseBoards.map(greenhouseProvider));
  providers.push(usaJobsProvider);

  return providers;
}
