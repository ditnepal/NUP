import { PrismaClient } from '@prisma/client';
import { pgisService } from './src/services/pgis.service';

const prisma = new PrismaClient();

async function test() {
  try {
    const [
      membershipTrends,
      volunteerTrends,
      fundraisingTrends,
      grievanceTrends,
      surveyTrends,
      boothReadiness,
      intelReports,
      electionIncidents,
      areaScores,
      recentSignals
    ] = await Promise.all([
      prisma.member.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.volunteer.count(),
      prisma.fundraisingCampaign.findMany({ select: { title: true, goalAmount: true, currentAmount: true, status: true } }),
      prisma.grievance.groupBy({ by: ['status', 'priority'], _count: { id: true } }),
      prisma.survey.findMany({ include: { _count: { select: { responses: true } } } }),
      prisma.booth.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.groundIntelligenceReport.findMany({ take: 50, orderBy: { createdAt: 'desc' }, select: { type: true, content: true, sentimentScore: true, createdAt: true } }),
      prisma.electionIncident.groupBy({ by: ['severity', 'status'], _count: { id: true } }),
      prisma.areaStrengthScore.findMany({ include: { orgUnit: { select: { name: true, level: true } } } }),
      pgisService.getSignals(10)
    ]);
    console.log('All queries succeeded!');
  } catch (e) {
    console.error('Query failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
