import prisma from './src/lib/prisma';

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  console.log('Admin user:', admin);
}

main().catch(console.error).finally(() => prisma.$disconnect());
