import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const email = 'admin@nup.org.np';
  const password = 'password'; // Temporary password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: 'Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('Admin user created:', user.email);
}

createAdmin().catch(console.error);
