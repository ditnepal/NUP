import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.systemConfig.findMany();
  console.log('--- ALL System Config ---');
  console.log(JSON.stringify(configs, null, 2));

  const sections = await prisma.cmsSection.findMany();
  console.log('--- ALL Homepage Sections ---');
  console.log(JSON.stringify(sections, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
