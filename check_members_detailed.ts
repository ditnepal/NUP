import prisma from './src/lib/prisma';

async function checkMembers() {
  const count = await prisma.member.count();
  const members = await prisma.member.findMany({ take: 3 });
  
  console.log('Count:', count);
  console.log('Sample:', JSON.stringify(members, null, 2));
}

checkMembers().catch(console.error);
