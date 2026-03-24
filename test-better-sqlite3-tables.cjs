const Database = require('better-sqlite3');
try {
  const db = new Database('/app/applet/prisma/prisma/dev.db', { fileMustExist: true });
  const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
  for (const row of stmt.iterate()) {
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM "${row.name}"`);
    const count = countStmt.get().count;
    console.log(`${row.name}: ${count}`);
  }
} catch (err) {
  console.error(err);
}
