import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('--- STEP 1: System Config ---');
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: ['PARTY_NAME', 'PARTY_TAGLINE', 'CONTACT_EMAIL', 'CONTACT_PHONE', 'CONTACT_ADDRESS']
      }
    }
  });
  console.log(JSON.stringify(configs, null, 2));

  console.log('\n--- ALL System Configs ---');
  const allConfigs = await prisma.systemConfig.findMany();
  console.log(JSON.stringify(allConfigs, null, 2));

  console.log('\n--- ALL CMS Sections ---');
  const allSections = await prisma.cmsSection.findMany();
  console.log(JSON.stringify(allSections, null, 2));
}

verify()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
