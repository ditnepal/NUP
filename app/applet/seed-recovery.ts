import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      displayName: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('Admin user created:', admin.email);

  const memberPasswordHash = await bcrypt.hash('member123', salt);
  const member = await prisma.user.create({
    data: {
      email: 'member@example.com',
      passwordHash: memberPasswordHash,
      displayName: 'Member User',
      role: 'MEMBER',
      isActive: true,
    },
  });
  console.log('Member user created:', member.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
