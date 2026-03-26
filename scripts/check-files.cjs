const fs = require('fs');
const files = ['package.json', 'package-lock.json', '.env', 'prisma/dev.db', 'app/applet/prisma/dev.db', 'src/lib/prisma.ts', 'server.ts', 'start.ts', 'src/api/auth.ts'];
for (const file of files) {
  try {
    const stat = fs.statSync(file);
    console.log(`${file} - ${stat.mtime}`);
  } catch (e) {
    console.log(`${file} - NOT FOUND`);
  }
}
