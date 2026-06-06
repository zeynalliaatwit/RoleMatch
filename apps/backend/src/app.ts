// apps/backend/src/app.ts
import express from 'express';
import cors from 'cors'; // 1. Import CORS
import { db } from './db/index.js';
import { profiles, users } from './db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();

// 2. Allow your React frontend origin to safely talk to this API
app.use(cors({
  origin: 'http://localhost:5173' 
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoleMatch API is running smoothly' });
});

// GET /api/profile
app.get('/api/profile', async (req, res) => {
  try {
    // 1. Verify the user's token
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Malformed authorization token." });

    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    // 2. Fetch the specific user's profile from the database
    const userProfiles = await db.select()
        .from(profiles)
        .where(eq(profiles.userId, decoded.userId as string))
        .limit(1);

    if (userProfiles.length === 0) {
      return res.status(404).json({ error: "Profile not found." });
    }

    // 3. Send the real database data
    res.json({
      ...userProfiles[0],
      stats: { applications: 0, saved: 0, interviews: 0 } // You can wire these up to the real DB later
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

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

// PUT /api/profile/onboarding
const uploadDir = 'uploads/resumes';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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

export default app;