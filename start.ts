import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const dbUrl = process.env.DATABASE_URL || 'file:/app/applet/prisma/dev.db';
process.env.DATABASE_URL = dbUrl;

console.log(`[START] Using DATABASE_URL: ${dbUrl}`);

try {
  console.log('[START] Running prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('[START] Starting server...');
  import('./server.ts').catch(err => {
    console.error('[START] Failed to load server.ts:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('[START] Error during startup:', err);
  process.exit(1);
}
