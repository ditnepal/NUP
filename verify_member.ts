import prisma from './src/lib/prisma';

async function verifyMember() {
  const member = await prisma.member.findFirst({
    where: { fullName: 'Test User' },
    include: { orgUnit: true }
  });
  
  if (member) {
    console.log('Member found:', JSON.stringify(member, null, 2));
  } else {
    console.log('Member not found');
  }
}

verifyMember().catch(console.error);
