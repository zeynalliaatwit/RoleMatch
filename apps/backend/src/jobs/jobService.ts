import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { jobPostings, savedJobs } from '../db/schema.js';
import { calculateMatchScore, truncate } from './normalization.js';
import { getConfiguredProviders } from './providers.js';
import type { JobProviderResult, JobSearchFilters, NormalizedJob } from './types.js';

type JobPostingRow = typeof jobPostings.$inferSelect;

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
  postedAt: Date | null;
  matchScore: number;
  saved: boolean;
}

function toApiJob(row: JobPostingRow, filters: JobSearchFilters, savedJobIds: Set<string>): ApiJob {
  return {
    id: row.id,
    source: row.source,
    company: row.company,
    title: row.title,
    location: row.location,
    remote: row.remote,
    employmentType: row.employmentType,
    experienceLevel: row.experienceLevel,
    salaryRange: row.salaryRange,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    currency: row.currency,
    jobUrl: row.jobUrl,
    description: row.description,
    requirements: row.requirements ?? [],
    tags: row.tags ?? [],
    postedAt: row.postedAt,
    matchScore: calculateMatchScore({
      source: row.source,
      externalId: row.externalId ?? undefined,
      company: row.company,
      title: row.title,
      normalizedTitle: row.normalizedTitle ?? undefined,
      location: row.location,
      remote: row.remote,
      employmentType: row.employmentType ?? undefined,
      experienceLevel: row.experienceLevel ?? undefined,
      salaryRange: row.salaryRange ?? undefined,
      salaryMin: row.salaryMin ?? undefined,
      salaryMax: row.salaryMax ?? undefined,
      currency: row.currency ?? undefined,
      jobUrl: row.jobUrl,
      description: row.description,
      requirements: row.requirements ?? [],
      tags: row.tags ?? [],
      postedAt: row.postedAt ?? undefined,
    }, filters),
    saved: savedJobIds.has(row.id),
  };
}

async function saveNormalizedJob(job: NormalizedJob) {
  const existing = await db.select().from(jobPostings).where(eq(jobPostings.jobUrl, job.jobUrl)).limit(1);
  const values: typeof jobPostings.$inferInsert = {
    source: truncate(job.source, 100),
    externalId: job.externalId ? truncate(job.externalId, 255) : null,
    company: truncate(job.company, 255),
    title: truncate(job.title, 255),
    normalizedTitle: job.normalizedTitle ? truncate(job.normalizedTitle, 255) : null,
    location: truncate(job.location, 255),
    remote: job.remote,
    employmentType: job.employmentType ? truncate(job.employmentType, 100) : null,
    experienceLevel: job.experienceLevel ? truncate(job.experienceLevel, 100) : null,
    salaryRange: job.salaryRange ? truncate(job.salaryRange, 100) : null,
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    currency: job.currency ? truncate(job.currency, 10) : null,
    jobUrl: job.jobUrl,
    description: job.description,
    requirements: job.requirements.length > 0 ? job.requirements : null,
    tags: job.tags.length > 0 ? job.tags : null,
    postedAt: job.postedAt ?? null,
    status: 'active',
    lastSeenAt: new Date(),
  };

  if (existing[0]) {
    const updated = await db.update(jobPostings)
      .set(values)
      .where(eq(jobPostings.id, existing[0].id))
      .returning();

    return updated[0] ?? existing[0];
  }

  const inserted = await db.insert(jobPostings).values(values).returning();
  if (!inserted[0]) {
    throw new Error('Failed to save normalized job.');
  }

  return inserted[0];
}

async function getSavedJobIds(userId: string) {
  const rows = await db.select({ jobId: savedJobs.jobId }).from(savedJobs).where(eq(savedJobs.userId, userId));
  return new Set(rows.map((row) => row.jobId));
}

function buildLocalWhere(filters: JobSearchFilters) {
  const conditions: SQL[] = [eq(jobPostings.status, 'active')];

  if (filters.query) {
    const pattern = `%${filters.query}%`;
    conditions.push(or(
      ilike(jobPostings.title, pattern),
      ilike(jobPostings.company, pattern),
      ilike(jobPostings.description, pattern),
    )!);
  }

  if (filters.location) conditions.push(ilike(jobPostings.location, `%${filters.location}%`));
  if (filters.remote) conditions.push(eq(jobPostings.remote, true));
  if (filters.source && filters.source !== 'All sources') conditions.push(eq(jobPostings.source, filters.source));
  if (filters.employmentType && filters.employmentType !== 'Any') conditions.push(eq(jobPostings.employmentType, filters.employmentType));
  if (filters.experienceLevel && filters.experienceLevel !== 'Any') conditions.push(eq(jobPostings.experienceLevel, filters.experienceLevel));
  if (filters.minSalary) conditions.push(sql`${jobPostings.salaryMax} >= ${filters.minSalary}`);

  return and(...conditions);
}

export async function searchJobs(filters: JobSearchFilters, userId: string) {
  const providerResults: JobProviderResult[] = await Promise.all(
    getConfiguredProviders().map(async (provider) => {
      try {
        return await provider.search(filters);
      } catch (error) {
        return {
          provider: provider.name,
          jobs: [],
          error: error instanceof Error ? error.message : 'Provider failed.',
        };
      }
    }),
  );

  const savedRows = (await Promise.all(providerResults.flatMap((result) => result.jobs).map(saveNormalizedJob)))
    .filter((row): row is JobPostingRow => Boolean(row));
  const savedJobIds = await getSavedJobIds(userId);

  const localRows = savedRows.length > 0
    ? savedRows
    : await db.select().from(jobPostings).where(buildLocalWhere(filters)).orderBy(desc(jobPostings.lastSeenAt)).limit(filters.limit);

  const dedupedRows = Array.from(new Map(localRows.filter(Boolean).map((row) => [row.id, row])).values());
  const jobs = dedupedRows
    .map((row) => toApiJob(row, filters, savedJobIds))
    .sort((first, second) => second.matchScore - first.matchScore)
    .slice(0, filters.limit);

  return {
    jobs,
    providerResults: providerResults.map((result) => ({
      provider: result.provider,
      count: result.jobs.length,
      error: result.error,
    })),
  };
}

export async function listSavedJobs(userId: string, filters: JobSearchFilters) {
  const savedRows = await db.select({ job: jobPostings })
    .from(savedJobs)
    .innerJoin(jobPostings, eq(savedJobs.jobId, jobPostings.id))
    .where(eq(savedJobs.userId, userId))
    .orderBy(desc(savedJobs.savedAt));

  const savedJobIds = new Set(savedRows.map((row) => row.job.id));
  return savedRows.map((row) => toApiJob(row.job, filters, savedJobIds));
}

export async function setSavedJob(userId: string, jobId: string, saved: boolean) {
  const job = await db.select().from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);

  if (!job[0]) {
    throw new Error('Job not found.');
  }

  if (!saved) {
    await db.delete(savedJobs).where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)));
    return false;
  }

  const existing = await db.select().from(savedJobs).where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId))).limit(1);
  if (!existing[0]) {
    await db.insert(savedJobs).values({ userId, jobId });
  }

  return true;
}
