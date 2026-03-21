import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest, authorize } from './middleware/auth';

const router = express.Router();

// @route   GET /api/v1/warroom/analytics
// @desc    Get aggregated strategic analytics for the War Room
// @access  Private (ADMIN, NATIONAL_COMMAND)
router.get('/analytics', authenticate, authorize(['ADMIN', 'NATIONAL_COMMAND']), async (req: AuthRequest, res) => {
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
      areaScores
    ] = await Promise.all([
      // Membership Trends (Last 6 months)
      prisma.member.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      // Volunteer Trends
      prisma.volunteer.count(),
      // Fundraising Trends
      prisma.fundraisingCampaign.findMany({
        select: { title: true, goalAmount: true, currentAmount: true, status: true }
      }),
      // Grievance Trends
      prisma.grievance.groupBy({
        by: ['status', 'priority'],
        _count: { id: true }
      }),
      // Survey Trends
      prisma.survey.findMany({
        include: { _count: { select: { responses: true } } }
      }),
      // Booth Readiness
      prisma.booth.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      // Ground Intelligence (Sentiment)
      prisma.groundIntelligenceReport.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: { type: true, content: true, sentimentScore: true, createdAt: true }
      }),
      // Election Incidents
      prisma.electionIncident.groupBy({
        by: ['severity', 'status'],
        _count: { id: true }
      }),
      // Area Strength Scores
      prisma.areaStrengthScore.findMany({
        include: { orgUnit: { select: { name: true, level: true } } }
      })
    ]);

    // Aggregate data for AI analysis
    const aggregatedData = {
      members: membershipTrends,
      volunteers: volunteerTrends,
      fundraising: fundraisingTrends,
      grievances: grievanceTrends,
      surveys: surveyTrends,
      booths: boothReadiness,
      incidents: electionIncidents,
      areaScores: areaScores
    };

    res.json({
      data: aggregatedData,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('War Room Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch strategic analytics' });
  }
});

// @route   GET /api/v1/warroom/sentiment
// @desc    Get ground reports for sentiment analysis
// @access  Private (ADMIN, NATIONAL_COMMAND)
router.get('/sentiment', authenticate, authorize(['ADMIN', 'NATIONAL_COMMAND']), async (req: AuthRequest, res) => {
  try {
    const reports = await prisma.groundIntelligenceReport.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports for sentiment analysis' });
  }
});

export default router;
