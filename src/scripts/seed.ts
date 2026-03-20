import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'beingrg556@gmail.com';
  const password = 'password123'; // Default password for the user

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (!existingUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: 'System Admin',
        role: 'ADMIN',
      },
    });
    console.log(`Admin user created: ${email} / ${password}`);
  } else {
    console.log(`Admin user already exists: ${email}`);
    // Ensure they are admin
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });