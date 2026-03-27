import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const DEFAULT_DB_URL = `file:${path.join(process.cwd(), 'prisma/dev.db')}`;
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
