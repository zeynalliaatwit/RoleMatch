import { boolean, integer, pgTable, uniqueIndex, uuid, varchar, text, timestamp, date } from 'drizzle-orm/pg-core';

// 1. Users Identity Table (Matches Auth Design)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  authProvider: varchar('auth_provider', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

// 2. Job Postings Table (Normalized Data gathered from Scrapers)
export const jobPostings = pgTable('job_postings', {
  id: uuid('id').defaultRandom().primaryKey(),
  source: varchar('source', { length: 100 }).notNull(), // Greenhouse, Lever, etc.
  externalId: varchar('external_id', { length: 255 }),
  company: varchar('company', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  normalizedTitle: varchar('normalized_title', { length: 255 }),
  location: varchar('location', { length: 255 }).notNull(),
  remote: boolean('remote').default(false).notNull(),
  employmentType: varchar('employment_type', { length: 100 }),
  experienceLevel: varchar('experience_level', { length: 100 }),
  salaryRange: varchar('salary_range', { length: 100 }),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  currency: varchar('currency', { length: 10 }),
  jobUrl: text('job_url').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements').array(),
  tags: text('tags').array(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  postedAt: timestamp('posted_at'),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  jobUrlUnique: uniqueIndex('job_postings_job_url_unique').on(table.jobUrl),
}));

// 3. Applications Tracker Table (The center of RoleMatch)
export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  jobId: uuid('job_id').references(() => jobPostings.id).notNull(),
  status: varchar('status', { length: 50 }).default('submitted').notNull(), // e.g., submitted, interview, blocked
  submittedAt: timestamp('submitted_at').defaultNow(),
  evidenceNotes: text('evidence_notes'),
});

// 4. Per-user saved jobs. A saved job is not an application until the user chooses to apply.
export const savedJobs = pgTable('saved_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  jobId: uuid('job_id').references(() => jobPostings.id, { onDelete: 'cascade' }).notNull(),
  savedAt: timestamp('saved_at').defaultNow().notNull(),
}, (table) => ({
  userJobUnique: uniqueIndex('saved_jobs_user_id_job_id_unique').on(table.userId, table.jobId),
}));

// 5. User Profiles Table
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  dateOfBirth: date('date_of_birth'),
  location: varchar('location', { length: 255 }),
  education: text('education'),
  workExperience: text('work_experience'),
  linkedinUrl: text('linkedin_url'),
  githubUrl: text('github_url'),
  gender: varchar('gender', { length: 50 }),
  race: varchar('race', { length: 100 }),
  veteranStatus: varchar('veteran_status', { length: 100 }),
  disabilityStatus: varchar('disability_status', { length: 100 }),
  workAuthorization: text('work_authorization'),
  resumeUrl: text('resume_url'),

  // Existing system fields
  major: varchar('major', { length: 255 }),
  bio: text('bio'),
  skills: text('skills').array(),
  preferredLocations: text('preferred_locations').array(),
  salaryMinimum: varchar('salary_minimum', { length: 50 }),
  portfolioLinks: text('portfolio_links').array(),
});
