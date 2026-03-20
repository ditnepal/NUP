import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from './middleware/auth';

const router = express.Router();

// @route   GET /api/v1/dashboard/summary
// @desc    Get dashboard summary statistics based on role
// @access  Private
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;

    if (!role || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let summary: any = {};

    if (role === 'ADMIN' || role === 'STAFF') {
      const [totalMembers, totalSupporters, totalBooths, activeCampaigns, openIssues] = await Promise.all([
        prisma.member.count({ where: { status: 'ACTIVE' } }),
        prisma.supporter.count(),
        prisma.booth.count(),
        prisma.campaign.count({ where: { phase: 'ACTIVE' } }),
        prisma.issue.count({ where: { status: 'OPEN' } })
      ]);
      summary = { totalMembers, totalSupporters, totalBooths, activeCampaigns, openIssues };
    } else if (role === 'FINANCE_OFFICER') {
      const transactions = await prisma.transaction.findMany();
      const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
      summary = { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses, transactionCount: transactions.length };
    } else if (role === 'FIELD_COORDINATOR') {
      const [totalSupporters, strongSupporters, activeCampaigns] = await Promise.all([
        prisma.supporter.count(),
        prisma.supporter.count({ where: { supportLevel: 'STRONG' } }),
        prisma.campaign.count({ where: { phase: 'ACTIVE' } })
      ]);
      summary = { totalSupporters, strongSupporters, activeCampaigns };
    } else if (role === 'BOOTH_COORDINATOR') {
      const [totalBooths, readyBooths, criticalBooths] = await Promise.all([
        prisma.booth.count(),
        prisma.booth.count({ where: { status: 'READY' } }),
        prisma.booth.count({ where: { status: 'CRITICAL' } })
      ]);
      summary = { totalBooths, readyBooths, criticalBooths };
    } else {
      // Regular Member
      const [myIssues, upcomingEvents] = await Promise.all([
        prisma.issue.count({ where: { reporterId: userId } }),
        prisma.event.count({ where: { date: { gte: new Date() } } })
      ]);
      summary = { myIssues, upcomingEvents };
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
