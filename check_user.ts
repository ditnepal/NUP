import prisma from './src/lib/prisma';

async function checkUser() {
  const email = 'admin@nup.org.np';
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log(`User ${email} not found.`);
  } else {
    console.log('User found:', {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      hasPasswordHash: !!user.passwordHash
    });
  }
}

checkUser().catch(console.error);
