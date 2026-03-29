process.env.DATABASE_URL = 'file:/app/applet/prisma/dev.db';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.systemConfig.findMany();
    console.log("SystemConfig OK");
  } catch (e: any) {
    console.error("SystemConfig Error:", e.name, e.code, e.meta, e.message);
  }
  try {
    await prisma.survey.findMany();
    console.log("Survey OK");
  } catch (e: any) {
    console.error("Survey Error:", e.name, e.code, e.meta, e.message);
  }
  try {
    await prisma.poll.findMany();
    console.log("Poll OK");
  } catch (e: any) {
    console.error("Poll Error:", e.name, e.code, e.meta, e.message);
  }
}
main().finally(() => prisma.$disconnect());
