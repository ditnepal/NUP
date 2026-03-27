import { PrismaClient } from '@prisma/client';
import path from 'path';

if (!process.env.DATABASE_URL) {
  const defaultUrl = `file:${path.join(process.cwd(), 'prisma/dev.db')}`;
  console.warn(`[WARN] DATABASE_URL environment variable is missing. Using default: ${defaultUrl}`);
  process.env.DATABASE_URL = defaultUrl;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
