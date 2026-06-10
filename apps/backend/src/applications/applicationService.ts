import { and, desc, eq, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { applications, jobPostings } from '../db/schema.js';

export type ApplicationStatus = 'blocked' | 'interview' | 'offer' | 'rejected' | 'submitted';
type JobPostingRow = typeof jobPostings.$inferSelect;

export interface ApiApplication {
  id: string;
  jobId: string;
  title: string;
  company: string;
  source: string;
  status: ApplicationStatus;
  matchScore: number | null;
  submittedAt: Date | null;
  lastUpdate: Date | null;
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

const statuses = new Set<ApplicationStatus>(['blocked', 'interview', 'offer', 'rejected', 'submitted']);

function toApiApplication(application: typeof applications.$inferSelect, job: JobPostingRow): ApiApplication {
  return {
    id: application.id,
    jobId: application.jobId,
    title: job.title,
    company: job.company,
    source: job.source,
    status: application.status as ApplicationStatus,
    matchScore: null,
    submittedAt: application.submittedAt,
    lastUpdate: application.submittedAt,
    nextStep: application.status === 'blocked' ? 'Needs manual completion' : 'Watch for email updates',
    blocker: application.status === 'blocked' ? application.evidenceNotes : null,
    jobUrl: job.jobUrl,
  };
}

function parseStatus(value?: ApplicationStatus) {
  return value && statuses.has(value) ? value : 'submitted';
}

async function resolveJob(input: CreateApplicationInput): Promise<JobPostingRow> {
  if (input.jobId) {
    const existingJob = await db.select().from(jobPostings).where(eq(jobPostings.id, input.jobId)).limit(1);
    if (!existingJob[0]) {
      throw new Error('Job not found.');
    }

    return existingJob[0];
  }

  const title = input.title?.trim();
  const company = input.company?.trim();
  const jobUrl = input.jobUrl?.trim();

  if (!title || !company || !jobUrl) {
    throw new Error('Manual application records need a title, company, and job URL.');
  }

  const existingByUrl = await db.select().from(jobPostings).where(eq(jobPostings.jobUrl, jobUrl)).limit(1);
  if (existingByUrl[0]) {
    return existingByUrl[0];
  }

  const inserted = await db.insert(jobPostings).values({
    source: input.source?.trim() || 'Manual',
    externalId: jobUrl,
    company,
    title,
    normalizedTitle: title.toLowerCase(),
    location: input.location?.trim() || 'Not specified',
    remote: /\bremote\b/i.test(input.location ?? ''),
    employmentType: null,
    experienceLevel: null,
    salaryRange: null,
    salaryMin: null,
    salaryMax: null,
    currency: null,
    jobUrl,
    description: 'Manual application record created from RoleMatch tracker.',
    requirements: null,
    tags: null,
    status: 'active',
    lastSeenAt: new Date(),
  }).returning();

  if (!inserted[0]) {
    throw new Error('Failed to create manual job record.');
  }

  return inserted[0];
}

export async function listApplications(userId: string, status?: ApplicationStatus | undefined): Promise<ApiApplication[]> {
  const conditions: SQL[] = [eq(applications.userId, userId)];

  if (status) {
    conditions.push(eq(applications.status, status));
  }

  const rows = await db.select({ application: applications, job: jobPostings })
    .from(applications)
    .innerJoin(jobPostings, eq(applications.jobId, jobPostings.id))
    .where(and(...conditions))
    .orderBy(desc(applications.submittedAt));

  return rows.map(({ application, job }) => toApiApplication(application, job));
}

export async function createOrUpdateApplication(userId: string, input: CreateApplicationInput): Promise<ApiApplication> {
  const job = await resolveJob(input);
  const status = parseStatus(input.status);
  const existing = await db.select()
    .from(applications)
    .where(and(eq(applications.userId, userId), eq(applications.jobId, job.id)))
    .limit(1);

  if (existing[0]) {
    const updated = await db.update(applications)
      .set({
        status,
        evidenceNotes: input.evidenceNotes?.trim() || existing[0].evidenceNotes,
      })
      .where(eq(applications.id, existing[0].id))
      .returning();

    return toApiApplication(updated[0] ?? existing[0], job);
  }

  const inserted = await db.insert(applications).values({
    userId,
    jobId: job.id,
    status,
    evidenceNotes: input.evidenceNotes?.trim() || null,
  }).returning();

  if (!inserted[0]) {
    throw new Error('Failed to create application record.');
  }

  return toApiApplication(inserted[0], job);
}
