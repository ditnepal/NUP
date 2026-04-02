import Database from 'better-sqlite3';

try {
  const db = new Database('prisma/dev.db', { verbose: console.log });
  console.log('Opened database');
  const userCount = db.prepare('SELECT count(*) as count FROM User').get();
  console.log('User count:', userCount);
  db.close();
} catch (error) {
  console.error('SQLite Error:', error);
}
