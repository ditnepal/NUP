import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "file:/app/applet/prisma/dev.db",
    },
  },
});

export default prisma;
