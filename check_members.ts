import 'dotenv/config';
import prisma from './src/lib/prisma';

async function main() {
  const members = await prisma.member.findMany();
  console.log('Members:', JSON.stringify(members, null, 2));
}

main().catch(console.error);
