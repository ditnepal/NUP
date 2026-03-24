import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || '/app/applet/prisma/dev.db';

/**
 * Maintenance script for Nagarik Unmukti Party OS
 * Use this to reset passwords for critical accounts.
 * 
 * Usage: tsx scripts/maintenance.ts <email> <new_password>
 */

async function resetPassword(email: string, newPass: string) {
  console.log(`[MAINTENANCE] Attempting to reset password for: ${email}`);
  
  const db = new Database(DB_PATH);
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPass, salt);
    
    const stmt = db.prepare('UPDATE User SET passwordHash = ? WHERE email = ?');
    const result = stmt.run(hash, email);
    
    if (result.changes > 0) {
      console.log(`[MAINTENANCE] SUCCESS: Password updated for ${email}`);
    } else {
      console.error(`[MAINTENANCE] ERROR: User with email ${email} not found.`);
    }
  } catch (error) {
    console.error(`[MAINTENANCE] CRITICAL ERROR:`, error);
  } finally {
    db.close();
  }
}

const args = process.argv.slice(2);
if (args.length === 2) {
  resetPassword(args[0], args[1]);
} else {
  console.log('Usage: tsx scripts/maintenance.ts <email> <new_password>');
}
