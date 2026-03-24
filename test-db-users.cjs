const Database = require('better-sqlite3');
try {
  const db = new Database('/app/applet/prisma/dev.db', { fileMustExist: true });
  const stmt = db.prepare('SELECT * FROM User');
  const users = stmt.all();
  console.log('Users in /app/applet/prisma/dev.db:', users.length);
  if (users.length > 0) {
    console.log(users);
  }
} catch (err) {
  console.error(err);
}
