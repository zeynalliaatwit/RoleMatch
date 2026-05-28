// apps/backend/src/app.ts
import express from 'express';
import cors from 'cors'; // 1. Import CORS
import { db } from './db/index.js';
import { profiles, users } from './db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();

// 2. Allow your React frontend origin to safely talk to this API
app.use(cors({
  origin: 'http://localhost:5173' 
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoleMatch API is running smoothly' });
});

app.get('/api/profile', async (req, res) => {
  try {
    // For MVP testing, we'll just grab the very first profile in the database.
    // Later, you will filter this by the authenticated user's ID: eq(profiles.userId, req.user.id)
    const allProfiles = await db.select().from(profiles).limit(1);

    if (allProfiles.length === 0) {
      // Fallback mock data if the database is empty so your frontend doesn't break
      return res.json({
        fullName: "Alex Jobseeker",
        major: "B.S. Computer Science",
        location: "Boston, MA",
        bio: "Full-stack developer passionate about building intuitive web applications.",
        skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
        stats: { applications: 12, saved: 8, interviews: 2 }
      });
    }

    // Send the real database data
    res.json({
      ...allProfiles[0],
      stats: { applications: 0, saved: 0, interviews: 0 } // Hardcoded stats for now
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
    const { email, password, firstName, lastName, dob } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Insert into the users table
    const newUserResult = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      authProvider: 'local'
    }).returning();

    // 2. Safely extract the first item and check it directly
    const createdUser = newUserResult[0];

    // If it's undefined, kick out an error
    if (!createdUser) {
      return res.status(500).json({ error: "Failed to create user account." });
    }

    // 3. Create the profile
    // TypeScript now knows 'createdUser' is safely defined
    await db.insert(profiles).values({
      userId: createdUser.id,
      fullName: `${firstName} ${lastName}`.trim(),
      dateOfBirth: dob,
    });

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Email might already exist." });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const userResult = await db.select().from(users).where(eq(users.email, email));

    // Safely assign the user and explicitly check for undefined to satisfy TypeScript
    const user = userResult[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    // Generate token (TypeScript now knows 'user' is 100% defined here)
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, userId: user.id, email: user.email });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

export default app;