import prisma from './src/lib/prisma';

async function checkData() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => u.email));
  
  const members = await prisma.member.findMany();
  console.log('Members:', members.map(m => m.fullName));
}

checkData().catch(console.error);
