import prisma from './src/lib/prisma';

async function main() {
  const count = await prisma.notification.count();
  console.log('Notification count:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
