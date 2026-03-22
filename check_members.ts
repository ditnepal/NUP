import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const members = await prisma.member.findMany();
  console.log('Members:', JSON.stringify(members, null, 2));
}

main().catch(console.error);
