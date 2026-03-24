const Database = require('better-sqlite3');
try {
  const db = new Database('/app/applet/prisma/prisma/dev.db', { fileMustExist: true });
  const stmt = db.prepare('SELECT email FROM User');
  for (const row of stmt.iterate()) {
    console.log(row.email);
  }
} catch (err) {
  console.error(err);
}
