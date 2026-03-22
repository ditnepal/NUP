import prisma from './src/lib/prisma';

async function checkSupporters() {
  const count = await prisma.supporter.count();
  console.log('Supporter count:', count);
}

checkSupporters().catch(console.error).finally(() => prisma.$disconnect());
