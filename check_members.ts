import prisma from './src/lib/prisma';

async function checkMembers() {
  const members = await prisma.member.findMany();
  console.log('Members count:', members.length);
  if (members.length > 0) {
    console.log('Sample member status:', members[0].status);
  }
}

checkMembers().catch(console.error);
