import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config();

const dbPath = path.join(process.cwd(), 'prisma/dev.db');
const DEFAULT_DB_URL = `file:${dbPath}`;
if (!process.env.DATABASE_URL) {
  console.warn(`[WARN] DATABASE_URL is missing. Using default: ${DEFAULT_DB_URL}`);
  process.env.DATABASE_URL = DEFAULT_DB_URL;
}

if (process.env.DATABASE_URL !== DEFAULT_DB_URL && process.env.DATABASE_URL !== 'file:/app/applet/prisma/dev.db') {
  console.error('[FATAL] DATABASE_URL is invalid');
  console.error(`[FATAL] Expected: ${DEFAULT_DB_URL} or file:/app/applet/prisma/dev.db`);
  console.error(`[FATAL] Received: ${process.env.DATABASE_URL}`);
  process.exit(1);
}

// Check if database exists and is not empty
try {
  const stats = fs.statSync(dbPath);
  if (stats.size === 0) {
    console.error('[FATAL] Database file exists but is empty (0 bytes).');
    console.error('[FATAL] Please run `npx prisma db push` and `npx tsx seed.ts` manually to initialize it.');
    process.exit(1);
  }
} catch (e) {
  console.error('[FATAL] Database file not found at ' + dbPath);
  console.error('[FATAL] Please run `npx prisma db push` and `npx tsx seed.ts` manually to initialize it.');
  process.exit(1);
}

try {
  console.log('[START] Starting server...');
  import('./server.ts').catch(err => {
    console.error('[START] Failed to load server.ts:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('[START] Error during startup:', err);
  process.exit(1);
}
