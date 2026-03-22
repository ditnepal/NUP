import prisma from './src/lib/prisma';

async function listUsers() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, isActive: true }
  });
  console.log('Users:', users);
}

listUsers().catch(console.error);
