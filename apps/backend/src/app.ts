// apps/backend/src/app.ts
import express from 'express';
import cors from 'cors'; // 1. Import CORS
import { db } from './db/index.js';
import { applications, profileDocuments, profiles, savedJobs, users } from './db/schema.js';
import { desc, eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { createOrUpdateApplication, listApplications, type ApplicationStatus, type CreateApplicationInput } from './applications/applicationService.js';
import { listSavedJobs, searchJobs, setSavedJob, streamSearchJobs, type JobSearchStreamEvent } from './jobs/jobService.js';
import type { JobSearchFilters } from './jobs/types.js';

const app = express();

// 2. Allow your React frontend origin to safely talk to this API
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] 
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoleMatch API is running smoothly' });
});

// GET /api/profile
app.get('/api/profile', async (req, res) => {
  try {
    const userId = getUserIdFromAuthHeader(req.headers.authorization);

    // 2. Fetch the specific user's profile from the database
    const userProfiles = await db.select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);

    if (userProfiles.length === 0) {
      return res.status(404).json({ error: "Profile not found." });
    }

    const [applicationRows, savedRows] = await Promise.all([
      db.select({ status: applications.status }).from(applications).where(eq(applications.userId, userId)),
      db.select({ id: savedJobs.id }).from(savedJobs).where(eq(savedJobs.userId, userId)),
    ]);
    const documents = await db.select()
      .from(profileDocuments)
      .where(eq(profileDocuments.userId, userId))
      .orderBy(desc(profileDocuments.uploadedAt));

    // 3. Send the real database data
    res.json({
      ...userProfiles[0],
      documents,
      stats: {
        applications: applicationRows.length,
        saved: savedRows.length,
        interviews: applicationRows.filter((application) => application.status === 'interview').length,
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    const status = message.includes('jwt') || message.includes('token') || message.includes('authorization') ? 401 : 500;
    res.status(status).json({ error: status === 401 ? 'Session expired. Please log in again.' : message });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

function getUserIdFromAuthHeader(authHeader?: string) {
  if (!authHeader) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Malformed authorization token.');
  }

  const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  const userId = decoded.userId;

  if (typeof userId !== 'string') {
    throw new Error('Invalid authorization token.');
  }

  return userId;
}

function parseJobFilters(query: Record<string, unknown>): JobSearchFilters {
  const rawLimit = Number(query.limit ?? 200);
  const rawMinSalary = Number(query.minSalary ?? 0);
  const rawLocation = typeof query.location === 'string' ? query.location.trim() : '';
  const locationIncludesRemote = /\bremote\b/i.test(rawLocation);
  const location = rawLocation
    .replace(/\bremote\b/gi, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/,\s*$/g, '')
    .trim();

  return {
    query: typeof query.query === 'string' ? query.query.trim() : undefined,
    location: location || undefined,
    remote: query.remote === 'true' || locationIncludesRemote,
    employmentType: typeof query.employmentType === 'string' && query.employmentType !== 'Any' ? query.employmentType : undefined,
    experienceLevel: typeof query.experienceLevel === 'string' && query.experienceLevel !== 'Any' ? query.experienceLevel : undefined,
    minSalary: Number.isFinite(rawMinSalary) && rawMinSalary > 0 ? rawMinSalary : undefined,
    source: typeof query.source === 'string' ? query.source : undefined,
    limit: Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 500)) : 200,
  };
}

function writeSse(res: express.Response, event: JobSearchStreamEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    // 1. Removed 'dob'
    const { email, password, firstName, lastName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserResult = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      authProvider: 'local'
    }).returning();

    const createdUser = newUserResult[0];
    if (!createdUser) {
      return res.status(500).json({ error: "Failed to create user account." });
    }

    // 2. Create the base profile
    await db.insert(profiles).values({
      userId: createdUser.id,
      fullName: `${firstName} ${lastName}`.trim(),
    });

    // 3. Auto-generate token so they can proceed directly to onboarding
    const token = jwt.sign({ userId: createdUser.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ message: "User registered successfully!", token });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Email might already exist." });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  // ... (Keep your existing login code exactly as it is)
  try {
    const { email, password } = req.body;
    const userResult = await db.select().from(users).where(eq(users.email, email));
    const user = userResult[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: user.id, email: user.email });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

function parseApplicationStatus(value: unknown): ApplicationStatus | undefined {
  const statuses = new Set<ApplicationStatus>(['blocked', 'interview', 'offer', 'rejected', 'submitted']);
  return typeof value === 'string' && statuses.has(value as ApplicationStatus) ? value as ApplicationStatus : undefined;
}

// GET /api/applications
app.get('/api/applications', async (req, res) => {
  try {
    const userId = getUserIdFromAuthHeader(req.headers.authorization);
    const applications = await listApplications(userId, parseApplicationStatus(req.query.status));

    res.json({ applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load applications.';
    const status = message.includes('Unauthorized') || message.includes('authorization') || message.includes('jwt') || message.includes('token') ? 401 : 500;

    res.status(status).json({ error: status === 401 ? 'Session expired. Please log in again.' : message });
  }
});

// POST /api/applications
app.post('/api/applications', async (req, res) => {
  try {
    const userId = getUserIdFromAuthHeader(req.headers.authorization);
    const application = await createOrUpdateApplication(userId, req.body as CreateApplicationInput);

    res.status(201).json({ application });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create application.';
    const status = message.includes('Unauthorized') || message.includes('authorization') || message.includes('jwt') || message.includes('token')
      ? 401
      : message.includes('not found')
        ? 404
        : message.includes('need')
          ? 400
          : 500;

    res.status(status).json({ error: status === 401 ? 'Session expired. Please log in again.' : message });
  }
});

// GET /api/jobs/search
app.get('/api/jobs/search', async (req, res) => {
  try {
    const userId = getUserIdFromAuthHeader(req.headers.authorization);
    const result = await searchJobs(parseJobFilters(req.query), userId);

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search jobs.';
    const status = message.includes('Unauthorized') || message.includes('authorization') || message.includes('jwt') || message.includes('token') ? 401 : 500;

    res.status(status).json({ error: status === 401 ? 'Session expired. Please log in again.' : message });
  }
});

// GET /api/jobs/search/stream
app.get('/api/jobs/search/stream', async (req, res) => {
  try {
    const userId = getUserIdFromAuthHeader(req.headers.authorization);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    await streamSearchJobs(parseJobFilters(req.query), userId, (event) => writeSse(res, event));
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to stream jobs.';
    if (!res.headersSent) {
      const status = message.includes('Unauthorized') || message.includes('authorization') || message.includes('jwt') || message.includes('token') ? 401 : 500;
      res.status(status).json({ error: status === 401 ? 'Session expired. Please log in again.' : message });
      return;
    }

    writeSse(res, { type: 'provider-result', provider: 'RoleMatch', jobs: [], providerResult: { provider: 'RoleMatch', count: 0, error: message } });
    writeSse(res, { type: 'done', total: 0 });
    res.end();
  }
});

// GET /api/jobs/saved
app.get('/api/jobs/saved', async (req, res) => {
  try {
    const userId = getUserIdFromAuthHeader(req.headers.authorization);
    const jobs = await listSavedJobs(userId, parseJobFilters(req.query));

    res.json({ jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load saved jobs.';
    const status = message.includes('Unauthorized') || message.includes('authorization') || message.includes('jwt') || message.includes('token') ? 401 : 500;

    res.status(status).json({ error: status === 401 ? 'Session expired. Please log in again.' : message });
  }
});

// PUT /api/jobs/:jobId/save
app.put('/api/jobs/:jobId/save', async (req, res) => {
  try {
    const userId = getUserIdFromAuthHeader(req.headers.authorization);
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ error: 'Missing job id.' });
    }

    const saved = await setSavedJob(userId, jobId, Boolean(req.body.saved));

    res.json({ saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update saved job.';
    const status = message.includes('Unauthorized') || message.includes('authorization') || message.includes('jwt') || message.includes('token') ? 401 : message.includes('not found') ? 404 : 500;

    res.status(status).json({ error: status === 401 ? 'Session expired. Please log in again.' : message });
  }
});

// PUT /api/profile
app.put('/api/profile', async (req, res) => {
  try {
    const userId = getUserIdFromAuthHeader(req.headers.authorization);
    const toStringArray = (value: unknown) => Array.isArray(value)
      ? value.map(String).map((item) => item.trim()).filter(Boolean)
      : typeof value === 'string'
        ? value.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
    const toObjectArray = (value: unknown) => Array.isArray(value) ? value : [];
    const autofillAnswers = req.body.autofillAnswers && typeof req.body.autofillAnswers === 'object'
      ? req.body.autofillAnswers
      : {};
    const workAuthorization = String(req.body.workAuthorization ?? req.body.autofillAnswers?.authorizedToWork ?? '').trim();

    const updated = await db.update(profiles)
      .set({
        fullName: String(req.body.fullName ?? '').trim() || 'RoleMatch User',
        phone: String(req.body.phone ?? '').trim() || null,
        location: String(req.body.location ?? '').trim() || null,
        education: String(req.body.education ?? '').trim() || null,
        workExperience: String(req.body.workExperience ?? '').trim() || null,
        linkedinUrl: String(req.body.linkedinUrl ?? '').trim() || null,
        githubUrl: String(req.body.githubUrl ?? '').trim() || null,
        portfolioUrl: String(req.body.portfolioUrl ?? '').trim() || null,
        indeedUrl: String(req.body.indeedUrl ?? '').trim() || null,
        workAuthorization: workAuthorization || null,
        veteranStatus: String(req.body.veteranStatus ?? autofillAnswers.veteranStatus ?? '').trim() || null,
        disabilityStatus: String(req.body.disabilityStatus ?? autofillAnswers.disabilityStatus ?? '').trim() || null,
        gender: String(req.body.gender ?? autofillAnswers.gender ?? '').trim() || null,
        race: String(req.body.race ?? autofillAnswers.race ?? '').trim() || null,
        salaryMinimum: String(req.body.salaryMinimum ?? autofillAnswers.desiredSalary ?? '').trim() || null,
        skills: toStringArray(req.body.skills).length > 0 ? toStringArray(req.body.skills) : null,
        targetRoles: toStringArray(req.body.targetRoles).length > 0 ? toStringArray(req.body.targetRoles) : null,
        preferredLocations: toStringArray(req.body.preferredLocations).length > 0 ? toStringArray(req.body.preferredLocations) : null,
        relevantCourses: toStringArray(req.body.relevantCourses).length > 0 ? toStringArray(req.body.relevantCourses) : null,
        portfolioLinks: toStringArray(req.body.portfolioLinks).length > 0 ? toStringArray(req.body.portfolioLinks) : null,
        educationHistory: toObjectArray(req.body.educationHistory),
        workHistory: toObjectArray(req.body.workHistory),
        projectHistory: toObjectArray(req.body.projectHistory),
        certifications: toObjectArray(req.body.certifications),
        autofillAnswers,
      })
      .where(eq(profiles.userId, userId))
      .returning();

    if (!updated[0]) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    res.json({ profile: updated[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile.';
    const status = message.includes('Unauthorized') || message.includes('authorization') || message.includes('jwt') || message.includes('token') ? 401 : 500;

    res.status(status).json({ error: status === 401 ? 'Session expired. Please log in again.' : message });
  }
});

// PUT /api/profile/onboarding
const uploadDir = 'uploads/resumes';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const documentsDir = 'uploads/profile-documents';
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Configure how and where Multer saves the files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Give the file a unique name to prevent overwriting
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, documentsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const documentUpload = multer({ storage: documentStorage });

// Tell Express to serve the 'uploads' folder statically so the frontend can access the files via URL
app.use('/uploads', express.static('uploads'));

app.put('/api/profile/onboarding', upload.single('resume'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Malformed authorization token." });

    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    // Multer places all the text fields back into req.body
    const {
      dob, education, location, workExperience, linkedinUrl, githubUrl,
      gender, race, workAuthorization, veteranStatus, disabilityStatus
    } = req.body;

    // Multer places the file information into req.file
    // If a file was uploaded, construct the URL path to save in the DB
    const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : null;

    // Update the profiles table
    await db.update(profiles)
        .set({
          dateOfBirth: dob ? (new Date(dob).toISOString().split('T')[0] || null) : null,
          location: location || null,
          education: education || null,
          workExperience: workExperience || null,
          linkedinUrl: linkedinUrl || null,
          githubUrl: githubUrl || null,
          gender: gender || null,
          race: race || null,
          workAuthorization: workAuthorization || null,
          veteranStatus: veteranStatus || null,
          disabilityStatus: disabilityStatus || null,
          // Save the file path to the database
          resumeUrl: resumeUrl
        })
        .where(eq(profiles.userId, decoded.userId as string));

    res.json({ message: "Profile onboarded successfully!", resumeUrl });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ error: "Failed to save profile preferences." });
  }
});

app.post('/api/profile/documents', documentUpload.single('document'), async (req, res) => {
  try {
    const userId = getUserIdFromAuthHeader(req.headers.authorization);
    if (!req.file) {
      return res.status(400).json({ error: 'No document uploaded.' });
    }

    const documentType = String(req.body.documentType ?? 'resume').trim() || 'resume';
    const label = String(req.body.label ?? req.file.originalname).trim() || req.file.originalname;
    const fileUrl = `/uploads/profile-documents/${req.file.filename}`;
    const inserted = await db.insert(profileDocuments).values({
      userId,
      label,
      documentType,
      fileName: req.file.originalname,
      fileUrl,
      mimeType: req.file.mimetype,
    }).returning();

    if (documentType === 'resume') {
      await db.update(profiles).set({ resumeUrl: fileUrl }).where(eq(profiles.userId, userId));
    }

    res.status(201).json({ document: inserted[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload document.';
    const status = message.includes('Unauthorized') || message.includes('authorization') || message.includes('jwt') || message.includes('token') ? 401 : 500;

    res.status(status).json({ error: status === 401 ? 'Session expired. Please log in again.' : message });
  }
});

export default app;
