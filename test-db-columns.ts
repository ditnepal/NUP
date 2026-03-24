import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const renewals = await prisma.renewalRequest.findMany({ take: 1 });
    console.log('Renewals fetch success:', renewals);
    const donations = await prisma.donation.findMany({ take: 1 });
    console.log('Donations fetch success:', donations);
  } catch (error) {
    console.error('Fetch failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
