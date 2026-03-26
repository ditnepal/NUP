const { PrismaClient } = require('@prisma/client');

async function check() {
  const p1 = new PrismaClient({ datasources: { db: { url: 'file:/app/applet/prisma/dev.db' } } });
  const p2 = new PrismaClient({ datasources: { db: { url: 'file:../prisma/dev.db' } } });

  try {
    const u1 = await p1.grievance.count();
    console.log('app/applet/prisma/dev.db grievances:', u1);
  } catch(e) { console.log('error p1', e.message); }
  
  try {
    const u2 = await p2.grievance.count();
    console.log('prisma/dev.db grievances:', u2);
  } catch(e) { console.log('error p2', e.message); }

  await p1.$disconnect();
  await p2.$disconnect();
}

check().catch(console.error);
