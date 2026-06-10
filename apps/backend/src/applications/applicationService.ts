import { and, desc, eq, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { applications, jobPostings } from '../db/schema.js';

export type ApplicationStatus = 'blocked' | 'interview' | 'offer' | 'rejected' | 'submitted';

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

  return rows.map(({ application, job }) => ({
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
  }));
}
