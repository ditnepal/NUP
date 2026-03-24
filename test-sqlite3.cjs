const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/applet/prisma/dev.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database.');
});
db.serialize(() => {
  db.each("SELECT email FROM User", (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(row.email);
  });
});
db.close();
