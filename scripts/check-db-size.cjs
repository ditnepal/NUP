const fs = require('fs');
try {
  console.log('prisma/dev.db size:', fs.statSync('prisma/dev.db').size);
} catch (e) { console.log('prisma/dev.db missing'); }
try {
  console.log('app/applet/prisma/dev.db size:', fs.statSync('app/applet/prisma/dev.db').size);
} catch (e) { console.log('app/applet/prisma/dev.db missing'); }
