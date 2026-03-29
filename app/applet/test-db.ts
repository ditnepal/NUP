import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ datasources: { db: { url: 'file:/app/applet/prisma/dev.db' } } });
async function main() {
  const users = await prisma.user.count();
  const members = await prisma.member.count();
  const configs = await prisma.systemConfig.count();
  console.log(`Users: ${users}, Members: ${members}, Configs: ${configs}`);
}
main().finally(() => prisma.$disconnect());
