import type { JobSearchFilters, NormalizedJob } from './types.js';

const stopWords = new Set(['and', 'the', 'with', 'for', 'from', 'that', 'this', 'you', 'your', 'our', 'are']);

export function stripHtml(value?: string | null) {
  if (!value) return '';

  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3).trim()}...` : value;
}

export function normalizeText(value?: string | null) {
  return (value ?? '').toLowerCase().trim();
}

function normalizedLocation(value?: string | null) {
  return normalizeText(value)
    .replace(/\bu\.s\.a?\b/g, 'united states')
    .replace(/\busa\b/g, 'united states')
    .replace(/\bu\.s\.\b/g, 'united states')
    .replace(/\s+/g, ' ');
}

function isBroadRemoteLocation(value: string) {
  const location = normalizedLocation(value);

  if (!location) return true;
  if (/^(remote|anywhere|worldwide|global)$/.test(location)) return true;
  if (/remote.*(united states|us only|usa|north america|americas)/.test(location)) return true;
  if (/(united states|north america|americas)/.test(location) && !/(brazil|germany|europe|india|portugal|spain|france|poland|romania|canada|mexico|argentina|colombia|chile|peru)/.test(location)) return true;

  return false;
}

export function matchesLocation(job: NormalizedJob, filters: JobSearchFilters) {
  if (!filters.location) {
    return !filters.remote || job.remote;
  }

  const queryLocation = normalizedLocation(filters.location);
  const jobLocation = normalizedLocation(job.location);

  if (jobLocation.includes(queryLocation)) return true;

  if (/\bboston\b/.test(queryLocation) && /\b(boston|cambridge|massachusetts|ma)\b/.test(jobLocation)) {
    return true;
  }

  if (filters.remote && job.remote) {
    return isBroadRemoteLocation(jobLocation);
  }

  return false;
}

export function inferRemote(location?: string | null, remoteValue?: boolean | string | number | null) {
  if (typeof remoteValue === 'boolean') return remoteValue;
  if (typeof remoteValue === 'string' && ['1', 'true', 'yes', 'remote'].includes(remoteValue.toLowerCase())) return true;
  return /remote|anywhere|work from home|worldwide/i.test(location ?? '');
}

export function inferEmploymentType(title: string, description: string, tags: string[] = []) {
  const haystack = `${title} ${description} ${tags.join(' ')}`.toLowerCase();

  if (/internship|intern\b/.test(haystack)) return 'Internship';
  if (/contract|contractor|freelance/.test(haystack)) return 'Contract';
  if (/part[-\s]?time/.test(haystack)) return 'Part time';
  if (/temporary|seasonal/.test(haystack)) return 'Temporary';
  return 'Full time';
}

export function inferExperienceLevel(title: string, description: string) {
  const haystack = `${title} ${description}`.toLowerCase();

  if (/internship|intern\b/.test(haystack)) return 'Internship';
  if (/entry[-\s]?level|junior|jr\.?|new grad|graduate/.test(haystack)) return 'Entry level';
  if (/senior|sr\.?|staff|principal|lead/.test(haystack)) return 'Senior';
  if (/manager|director|head of/.test(haystack)) return 'Leadership';
  return 'Mid level';
}

export function extractTags(title: string, description: string, providedTags: string[] = []) {
  const knownSkills = [
    'TypeScript', 'JavaScript', 'React', 'Node.js', 'Express', 'Python', 'Java', 'C++', 'C#',
    'SQL', 'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'REST',
    'GraphQL', 'Data', 'Machine Learning', 'AI', 'Excel', 'Tableau', 'Power BI',
  ];

  const haystack = `${title} ${description}`.toLowerCase();
  const inferred = knownSkills.filter((skill) => haystack.includes(skill.toLowerCase()));
  const normalizedProvided = providedTags.map((tag) => tag.trim()).filter(Boolean);

  return Array.from(new Set([...normalizedProvided, ...inferred])).slice(0, 10);
}

export function extractRequirements(description: string) {
  const sentences = description
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences
    .filter((sentence) => /require|qualification|experience|degree|bachelor|years|must|proficient/i.test(sentence))
    .map((sentence) => truncate(sentence, 220))
    .slice(0, 5);
}

export function extractSalary(description: string, explicitMin?: number | null, explicitMax?: number | null) {
  if (explicitMin || explicitMax) {
    const salaryMin = explicitMin ?? undefined;
    const salaryMax = explicitMax ?? explicitMin ?? undefined;
    const salaryRange = salaryMin && salaryMax ? `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}` : undefined;

    return { salaryMin, salaryMax, salaryRange, currency: 'USD' };
  }

  const matches = Array.from(description.matchAll(/\$?\s?(\d{2,3})(?:,\d{3})?\s?(k|K|000)?/g))
    .map((match) => {
      const base = Number(match[1]);
      if (Number.isNaN(base)) return undefined;
      return match[2] ? base * 1000 : base >= 1000 ? base : undefined;
    })
    .filter((value): value is number => Boolean(value && value >= 30000 && value <= 300000));

  if (matches.length === 0) {
    return {};
  }

  const salaryMin = Math.min(...matches);
  const salaryMax = Math.max(...matches);

  return {
    salaryMin,
    salaryMax,
    salaryRange: salaryMin === salaryMax ? `$${salaryMin.toLocaleString()}` : `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`,
    currency: 'USD',
  };
}

export function calculateMatchScore(job: NormalizedJob, filters: JobSearchFilters) {
  let score = 55;
  const queryTerms = (filters.query ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stopWords.has(term));
  const haystack = `${job.title} ${job.company} ${job.description} ${job.tags.join(' ')}`.toLowerCase();

  if (queryTerms.length > 0) {
    const matchedTerms = queryTerms.filter((term) => haystack.includes(term)).length;
    score += Math.round((matchedTerms / queryTerms.length) * 25);
  }

  if (filters.location && matchesLocation(job, filters)) score += 8;
  if (filters.remote && job.remote) score += 10;
  if (filters.employmentType && filters.employmentType === job.employmentType) score += 7;
  if (filters.experienceLevel && filters.experienceLevel === job.experienceLevel) score += 7;
  if (filters.minSalary && job.salaryMax && job.salaryMax >= filters.minSalary) score += 6;

  return Math.max(0, Math.min(score, 99));
}

export function matchesFilters(job: NormalizedJob, filters: JobSearchFilters) {
  const query = filters.query?.trim().toLowerCase();

  if (query) {
    const terms = query.split(/\s+/).filter(Boolean);
    const haystack = `${job.title} ${job.company} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
    if (!terms.every((term) => haystack.includes(term))) return false;
  }

  if (!matchesLocation(job, filters)) return false;
  if (filters.source && filters.source !== 'All sources' && normalizeText(job.source) !== normalizeText(filters.source)) return false;
  if (filters.employmentType && filters.employmentType !== 'Any' && job.employmentType !== filters.employmentType) return false;
  if (filters.experienceLevel && filters.experienceLevel !== 'Any' && job.experienceLevel !== filters.experienceLevel) return false;
  if (filters.minSalary && (!job.salaryMax || job.salaryMax < filters.minSalary)) return false;

  return true;
}
