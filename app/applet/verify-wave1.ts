import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
  console.log('--- STEP 1: System Config ---');
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: ['PARTY_NAME', 'PARTY_TAGLINE', 'CONTACT_EMAIL', 'CONTACT_PHONE', 'CONTACT_ADDRESS']
      }
    }
  });
  console.log(JSON.stringify(configs, null, 2));

  console.log('\n--- ALL Homepage Sections ---');
  const sections = await prisma.cmsSection.findMany();
  console.log(JSON.stringify(sections, null, 2));
}

verify()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
