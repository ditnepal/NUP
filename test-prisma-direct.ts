import { PrismaClient } from '@prisma/client';
import path from 'path';

async function test() {
  const dbPath = path.resolve('prisma/dev.db');
  const dbUrl = `file:${dbPath}`;
  console.log('DATABASE_URL:', dbUrl);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });
  try {
    await prisma.$connect();
    console.log('Connected to Prisma');
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    const configCount = await prisma.systemConfig.count();
    console.log('SystemConfig count:', configCount);
  } catch (error) {
    console.error('Prisma Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
