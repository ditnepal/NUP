import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  const prisma = new PrismaClient();
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
