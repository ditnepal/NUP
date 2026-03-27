import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL || process.env.DATABASE_URL !== 'file:/app/applet/prisma/dev.db') {
  console.error('[FATAL] DATABASE_URL is missing or invalid in .env');
  console.error('[FATAL] Expected: file:/app/applet/prisma/dev.db');
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
