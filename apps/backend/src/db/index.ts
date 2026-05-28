// apps/backend/src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a node-postgres connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle ORM with the connection pool
export const db = drizzle(pool);