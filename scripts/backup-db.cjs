const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../prisma/dev.db');
const BACKUP_DIR = path.join(__dirname, '../prisma/backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const now = new Date();
const timestamp = now.toISOString()
  .replace(/T/, '-')
  .replace(/\..+/, '')
  .replace(/:/g, '')
  .replace(/-/g, '');

const backupFilename = `dev-${timestamp.substring(0, 8)}-${timestamp.substring(9, 13)}.db`;
const backupPath = path.join(BACKUP_DIR, backupFilename);

try {
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`Successfully backed up database to ${backupPath}`);
  } else {
    console.error(`Database file not found at ${DB_PATH}`);
    process.exit(1);
  }
} catch (err) {
  console.error('Failed to backup database:', err);
  process.exit(1);
}
