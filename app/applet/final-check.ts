import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- FINAL VERIFICATION ---');
  const configs = await prisma.systemConfig.findMany();
  console.log('Configs:', JSON.stringify(configs, null, 2));

  const sections = await prisma.cmsSection.findMany();
  console.log('Sections:', JSON.stringify(sections, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
