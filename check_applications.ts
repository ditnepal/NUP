import prisma from './src/lib/prisma';

async function checkApplications() {
  const applications = await prisma.volunteerApplication.findMany();
  console.log('Applications count:', applications.length);
}

checkApplications().catch(console.error);
