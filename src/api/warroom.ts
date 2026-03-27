import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest, authorize } from './middleware/auth';
import { pgisService } from '../services/pgis.service';

const router = express.Router();

// @route   GET /api/v1/warroom/analytics
// @desc    Get aggregated strategic analytics for the War Room
// @access  Private (ADMIN, STAFF)
router.get('/analytics', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const orgUnitId = req.user?.orgUnitId;

    // Fetch all core metrics in parallel
    const [
      membershipTrends,
      volunteerCount,
      fundraisingCampaigns,
      grievanceStats,
      surveyStats,
      boothStats,
      intelReports,
      electionIncidents,
      areaScores,
      pgisOverview,
      orgUnitInfo
    ] = await Promise.all([
      // Membership Stats
      prisma.member.groupBy({
        by: ['status'],
        where: orgUnitId ? { orgUnitId } : {},
        _count: { id: true }
      }),
      // Volunteer Count
      prisma.volunteer.count({
        where: orgUnitId ? { user: { orgUnitId } } : {}
      }),
      // Fundraising
      prisma.fundraisingCampaign.findMany({
        where: orgUnitId ? { orgUnitId } : {},
        select: { title: true, goalAmount: true, currentAmount: true, status: true }
      }),
      // Grievances
      prisma.grievance.groupBy({
        by: ['status'],
        where: orgUnitId ? { orgUnitId } : {},
        _count: { id: true }
      }),
      // Surveys
      prisma.survey.findMany({
        where: orgUnitId ? { orgUnitId } : {},
        include: { _count: { select: { responses: true } } }
      }),
      // Booths
      prisma.booth.groupBy({
        by: ['status'],
        where: orgUnitId ? { orgUnitId } : {},
        _count: { id: true }
      }),
      // Intelligence Reports
      prisma.groundIntelligenceReport.findMany({
        where: orgUnitId ? { orgUnitId } : {},
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { reporter: { select: { displayName: true } } }
      }),
      // Election Incidents
      prisma.electionIncident.groupBy({
        by: ['status', 'severity'],
        where: orgUnitId ? { booth: { orgUnitId } } : {},
        _count: { id: true }
      }),
      // Area Scores
      prisma.areaStrengthScore.findMany({
        where: orgUnitId ? { orgUnitId } : {},
        include: { orgUnit: { select: { name: true, level: true } } }
      }),
      // PGIS Strategic Overview (includes hotspots and attentionNeeded)
      pgisService.getStrategicOverview(orgUnitId),
      // Org Unit Name
      orgUnitId ? prisma.organizationUnit.findUnique({ where: { id: orgUnitId }, select: { name: true } }) : Promise.resolve({ name: 'National Command' })
    ]);

    // Aggregate data for dashboard
    const analytics = {
      scopeName: (orgUnitInfo as any)?.name || 'National Command',
      members: membershipTrends.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count.id }), {}),
      volunteers: volunteerCount,
      fundraising: fundraisingCampaigns,
      grievances: grievanceStats.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count.id }), {}),
      surveys: surveyStats,
      booths: boothStats.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count.id }), {}),
      incidents: electionIncidents.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count.id }), {}),
      recentSignals: intelReports,
      areaScores: areaScores,
      pgisOverview,
      hotspots: pgisOverview.hotspots,
      attentionNeeded: pgisOverview.attentionNeeded,
      lastUpdated: new Date().toISOString()
    };

    res.json(analytics);
  } catch (error) {
    console.error('War Room Analytics Error:', error);
    res.status(500).json({ error: 'Failed to aggregate war room data' });
  }
});

// @route   GET /api/v1/warroom/sentiment
// @desc    Get ground reports for sentiment analysis
// @access  Private (ADMIN, STAFF)
router.get('/sentiment', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const orgUnitId = req.user?.orgUnitId;
    const reports = await prisma.groundIntelligenceReport.findMany({
      where: orgUnitId ? { orgUnitId } : {},
      take: 100,
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports for sentiment analysis' });
  }
});

export default router;
