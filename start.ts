import { execSync } from 'child_process';

const isProd = process.env.NODE_ENV === 'production';
const dbUrl = isProd ? 'file:/tmp/dev.db' : 'file:./prisma/dev.db';
process.env.DATABASE_URL = dbUrl;

console.log(`[START] Using DATABASE_URL: ${dbUrl}`);

try {
  console.log('[START] Running prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('[START] Running prisma db push...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  console.log('[START] Running seed.ts...');
  execSync('npx tsx seed.ts', { stdio: 'inherit' });
  
  console.log('[START] Starting server...');
  import('./server.ts').catch(err => {
    console.error('[START] Failed to load server.ts:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('[START] Error during startup:', err);
  process.exit(1);
}
