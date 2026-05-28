import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users Identity Table (Matches Auth Design)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  authProvider: varchar('auth_provider', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

// 2. Job Postings Table (Normalized Data gathered from Scrapers)
export const jobPostings = pgTable('job_postings', {
  id: uuid('id').defaultRandom().primaryKey(),
  source: varchar('source', { length: 100 }).notNull(), // Greenhouse, Lever, etc.
  company: varchar('company', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  salaryRange: varchar('salary_range', { length: 100 }),
  jobUrl: text('job_url').notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
});

// 3. Applications Tracker Table (The center of RoleMatch)
export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  jobId: uuid('job_id').references(() => jobPostings.id).notNull(),
  status: varchar('status', { length: 50 }).default('submitted').notNull(), // e.g., submitted, interview, blocked
  submittedAt: timestamp('submitted_at').defaultNow(),
  evidenceNotes: text('evidence_notes'),
});