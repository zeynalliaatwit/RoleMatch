// apps/backend/src/app.ts
import express from 'express';

const app = express();

// Middleware to parse incoming JSON payloads automatically
app.use(express.json());

// A simple status route to confirm server operation
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoleMatch API is running smoothly' });
});

export default app;