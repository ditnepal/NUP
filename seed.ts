import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create National Unit
  const nationalUnit = await prisma.organizationUnit.upsert({
    where: { code: 'NAT-001' },
    update: {},
    create: {
      name: 'National Headquarters',
      level: 'NATIONAL',
      code: 'NAT-001',
    },
  });

  // Create Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nup.org.np' },
    update: {
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@nup.org.np',
      passwordHash,
      displayName: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
      orgUnitId: nationalUnit.id,
    },
  });

  console.log('Seeding completed.');
  console.log('Admin User:', adminUser.email);
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
