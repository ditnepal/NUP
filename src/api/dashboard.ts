import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from './middleware/auth';
import { checkPermission } from './middleware/permissions';
import { hierarchyService } from '../services/hierarchy.service';
import { permissionService } from '../services/permission.service';

const router = express.Router();

// @route   GET /api/v1/dashboard/summary
// @desc    Get dashboard summary statistics based on role and orgUnit scope
// @access  Private
router.get('/summary', authenticate, checkPermission('DASHBOARD', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;

    if (!role || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get accessible unit IDs for scoping
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    const isScoped = accessibleUnitIds !== null;

    let summary: any = {};

    if (role === 'ADMIN' || role === 'STAFF') {
      const memberWhere: any = { status: 'ACTIVE' };
      const supporterWhere: any = {};
      const boothWhere: any = {};
      const campaignWhere: any = { phase: 'ACTIVE' };
      const issueWhere: any = { status: 'OPEN' };

      if (isScoped) {
        memberWhere.orgUnitId = { in: accessibleUnitIds };
        supporterWhere.booth = { orgUnitId: { in: accessibleUnitIds } };
        boothWhere.orgUnitId = { in: accessibleUnitIds };
        issueWhere.orgUnitId = { in: accessibleUnitIds };
        // For campaigns, we could filter by target location, but for Phase 1A we'll keep it simple
      }

      const [totalMembers, totalSupporters, totalBooths, activeCampaigns, openIssues] = await Promise.all([
        prisma.member.count({ where: memberWhere }),
        prisma.supporter.count({ where: supporterWhere }),
        prisma.booth.count({ where: boothWhere }),
        prisma.campaign.count({ where: campaignWhere }),
        prisma.issue.count({ where: issueWhere })
      ]);
      summary = { totalMembers, totalSupporters, totalBooths, activeCampaigns, openIssues };
    } else if (role === 'FINANCE_OFFICER') {
      const transactionWhere: any = {};
      if (isScoped) {
        // Transactions are linked to members, who have orgUnits
        transactionWhere.member = { orgUnitId: { in: accessibleUnitIds } };
      }
      const transactions = await prisma.transaction.findMany({ where: transactionWhere });
      const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
      summary = { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses, transactionCount: transactions.length };
    } else if (role === 'FIELD_COORDINATOR') {
      const supporterWhere: any = {};
      const campaignWhere: any = { phase: 'ACTIVE' };
      
      if (isScoped) {
        supporterWhere.booth = { orgUnitId: { in: accessibleUnitIds } };
      }

      const [totalSupporters, strongSupporters, activeCampaigns] = await Promise.all([
        prisma.supporter.count({ where: supporterWhere }),
        prisma.supporter.count({ where: { ...supporterWhere, supportLevel: 'STRONG' } }),
        prisma.campaign.count({ where: campaignWhere })
      ]);
      summary = { totalSupporters, strongSupporters, activeCampaigns };
    } else if (role === 'BOOTH_COORDINATOR') {
      const boothWhere: any = {};
      if (isScoped) {
        boothWhere.orgUnitId = { in: accessibleUnitIds };
      }
      const [totalBooths, readyBooths, criticalBooths] = await Promise.all([
        prisma.booth.count({ where: boothWhere }),
        prisma.booth.count({ where: { ...boothWhere, status: 'READY' } }),
        prisma.booth.count({ where: { ...boothWhere, status: 'CRITICAL' } })
      ]);
      summary = { totalBooths, readyBooths, criticalBooths };
    } else {
      // Regular Member
      const [myIssues, upcomingEvents] = await Promise.all([
        prisma.issue.count({ where: { reporterId: userId } }),
        prisma.event.count({ where: { startDate: { gte: new Date() } } })
      ]);
      summary = { myIssues, upcomingEvents };
    }

    res.json(summary);
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
