import fs from 'fs';
import path from 'path';

const API_DIR = path.join(process.cwd(), 'src/api');

async function auditSecurity() {
  console.log('--- Starting Security Audit of API Routes ---');
  const files = fs.readdirSync(API_DIR).filter(f => f.endsWith('.ts'));
  
  let issues = 0;
  
  for (const file of files) {
    if (file === 'public.ts' || file === 'auth.ts') continue;
    
    const content = fs.readFileSync(path.join(API_DIR, file), 'utf-8');
    
    // Check if 'authenticate' middleware is imported and used
    if (!content.includes('authenticate')) {
      console.warn(`[SECURITY WARNING] File ${file} might be missing 'authenticate' middleware.`);
      issues++;
    }
    
    // Check for direct prisma usage without service abstraction (optional but good for consistency)
    if (content.includes('prisma.') && !content.includes('Service')) {
      // console.log(`[INFO] File ${file} uses prisma directly.`);
    }
  }
  
  if (issues === 0) {
    console.log('--- Security Audit Passed: All non-public routes seem to use authentication. ---');
  } else {
    console.log(`--- Security Audit Finished with ${issues} potential issues. ---`);
  }
}

auditSecurity().catch(console.error);
