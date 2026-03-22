import prisma from './src/lib/prisma';

async function listMembers() {
  const members = await prisma.member.findMany();
  console.log('Members:', JSON.stringify(members, null, 2));
}

listMembers().catch(console.error);
