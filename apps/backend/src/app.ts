// apps/backend/src/app.ts
import express from 'express';
import cors from 'cors'; // 1. Import CORS

const app = express();

// 2. Allow your React frontend origin to safely talk to this API
app.use(cors({
  origin: 'http://localhost:5173' 
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoleMatch API is running smoothly' });
});

export default app;