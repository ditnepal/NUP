import { PrismaClient } from '@prisma/client';
process.env.DATABASE_URL = "file:./dev.db";
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.member.groupBy({ by: ['status'], _count: { id: true } });
    console.log('Member OK');
  } catch (e) { console.error('Member Error', e); }

  try {
    await prisma.volunteer.count();
    console.log('Volunteer OK');
  } catch (e) { console.error('Volunteer Error', e); }

  try {
    await prisma.fundraisingCampaign.findMany({ select: { title: true, goalAmount: true, currentAmount: true, status: true } });
    console.log('FundraisingCampaign OK');
  } catch (e) { console.error('FundraisingCampaign Error', e); }

  try {
    await prisma.grievance.groupBy({ by: ['status', 'priority'], _count: { id: true } });
    console.log('Grievance OK');
  } catch (e) { console.error('Grievance Error', e); }

  try {
    await prisma.survey.findMany({ include: { _count: { select: { responses: true } } } });
    console.log('Survey OK');
  } catch (e) { console.error('Survey Error', e); }

  try {
    await prisma.booth.groupBy({ by: ['status'], _count: { id: true } });
    console.log('Booth OK');
  } catch (e) { console.error('Booth Error', e); }

  try {
    await prisma.groundIntelligenceReport.findMany({ take: 50, orderBy: { createdAt: 'desc' }, select: { type: true, content: true, sentimentScore: true, createdAt: true } });
    console.log('GroundIntelligenceReport OK');
  } catch (e) { console.error('GroundIntelligenceReport Error', e); }

  try {
    await prisma.electionIncident.groupBy({ by: ['severity', 'status'], _count: { id: true } });
    console.log('ElectionIncident OK');
  } catch (e) { console.error('ElectionIncident Error', e); }

  try {
    await prisma.areaStrengthScore.findMany({ include: { orgUnit: { select: { name: true, level: true } } } });
    console.log('AreaStrengthScore OK');
  } catch (e) { console.error('AreaStrengthScore Error', e); }
}

main().finally(() => prisma.$disconnect());
