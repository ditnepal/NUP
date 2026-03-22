import { PrismaClient } from '@prisma/client';

console.log('[DEBUG] Prisma DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "file:/app/applet/prisma/dev.db",
    },
  },
});

export default prisma;
