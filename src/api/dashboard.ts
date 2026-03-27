import express from 'express';
import fs from 'fs';
import path from 'path';
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

    const userOrgUnit = req.user?.orgUnitId ? await prisma.organizationUnit.findUnique({ where: { id: req.user.orgUnitId } }) : null;
    const scopeName = userOrgUnit ? `${userOrgUnit.name} (${userOrgUnit.level})` : 'National';

    let summary: any = { scopeName };

    if (role === 'ADMIN' || role === 'STAFF') {
      const memberWhere: any = { status: 'ACTIVE' };
      const supporterWhere: any = {};
      const boothWhere: any = {};
      const campaignWhere: any = { phase: 'ACTIVE' };
      const issueWhere: any = { status: 'OPEN' };
      const grievanceWhere: any = { status: { not: 'closed' } };
      const surveyWhere: any = { status: 'ACTIVE' };

      if (isScoped) {
        memberWhere.orgUnitId = { in: accessibleUnitIds };
        supporterWhere.booth = { orgUnitId: { in: accessibleUnitIds } };
        boothWhere.orgUnitId = { in: accessibleUnitIds };
        grievanceWhere.orgUnitId = { in: accessibleUnitIds };
        surveyWhere.orgUnitId = { in: accessibleUnitIds };
      }

      const [totalMembers, totalSupporters, totalBooths, activeCampaigns, openIssues, openGrievances, activeSurveys, recentGrievances, criticalBoothsList] = await Promise.all([
        prisma.member.count({ where: memberWhere }),
        prisma.supporter.count({ where: supporterWhere }),
        prisma.booth.count({ where: boothWhere }),
        prisma.campaign.count({ where: campaignWhere }),
        prisma.issue.count({ where: issueWhere }),
        prisma.grievance.count({ where: grievanceWhere }),
        prisma.survey.count({ where: surveyWhere }),
        prisma.grievance.findMany({ where: grievanceWhere, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, priority: true, status: true, createdAt: true } }),
        prisma.booth.findMany({ where: { ...boothWhere, status: 'CRITICAL' }, orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, name: true, status: true, updatedAt: true } })
      ]);

      const actionQueue = [
        ...recentGrievances.map(g => ({ id: g.id, type: 'GRIEVANCE', title: g.title, priority: g.priority, status: g.status, date: g.createdAt.toISOString() })),
        ...criticalBoothsList.map(b => ({ id: b.id, type: 'BOOTH', title: b.name, status: b.status, date: b.updatedAt?.toISOString() }))
      ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5);

      summary = { ...summary, totalMembers, totalSupporters, totalBooths, activeCampaigns, openIssues, openGrievances, activeSurveys, actionQueue };
    } else if (role === 'FINANCE_OFFICER') {
      const transactionWhere: any = {};
      const donationWhere: any = { status: 'COMPLETED' };
      const fundCampaignWhere: any = { status: 'ACTIVE' };

      if (isScoped) {
        transactionWhere.member = { orgUnitId: { in: accessibleUnitIds } };
        donationWhere.campaign = { orgUnitId: { in: accessibleUnitIds } };
        fundCampaignWhere.orgUnitId = { in: accessibleUnitIds };
      }
      
      const [transactions, donations, activeFundCampaigns, recentTransactions, activeCampaignsList] = await Promise.all([
        prisma.transaction.findMany({ where: transactionWhere }),
        prisma.donation.findMany({ where: donationWhere }),
        prisma.fundraisingCampaign.count({ where: fundCampaignWhere }),
        prisma.transaction.findMany({ where: transactionWhere, orderBy: { date: 'desc' }, take: 5, select: { id: true, description: true, amount: true, status: true, date: true } }),
        prisma.fundraisingCampaign.findMany({ where: fundCampaignWhere, orderBy: { startDate: 'desc' }, take: 5, select: { id: true, title: true, currentAmount: true, goalAmount: true, status: true, startDate: true } })
      ]);
      
      const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
      const totalDonations = donations.reduce((acc, curr) => acc + curr.amount, 0);
      
      const actionQueue = [
        ...recentTransactions.map(t => ({ id: t.id, type: 'TRANSACTION', title: t.description, subtitle: `Amount: ${t.amount}`, status: t.status, date: t.date.toISOString() })),
        ...activeCampaignsList.map(c => ({ id: c.id, type: 'FUNDRAISER', title: c.title, subtitle: `Raised: ${c.currentAmount}/${c.goalAmount}`, status: c.status, date: c.startDate.toISOString() }))
      ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5);

      summary = { ...summary, totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses, transactionCount: transactions.length, totalDonations, activeFundCampaigns, actionQueue };
    } else if (role === 'FIELD_COORDINATOR') {
      const supporterWhere: any = {};
      const campaignWhere: any = { phase: 'ACTIVE' };
      const grievanceWhere: any = { status: { not: 'closed' } };
      
      if (isScoped) {
        supporterWhere.booth = { orgUnitId: { in: accessibleUnitIds } };
        grievanceWhere.orgUnitId = { in: accessibleUnitIds };
      }

      const [totalSupporters, strongSupporters, activeCampaigns, openGrievances, recentGrievances, criticalBoothsList] = await Promise.all([
        prisma.supporter.count({ where: supporterWhere }),
        prisma.supporter.count({ where: { ...supporterWhere, supportLevel: 'STRONG' } }),
        prisma.campaign.count({ where: campaignWhere }),
        prisma.grievance.count({ where: grievanceWhere }),
        prisma.grievance.findMany({ where: grievanceWhere, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, priority: true, status: true, createdAt: true } }),
        prisma.booth.findMany({ where: { orgUnitId: { in: accessibleUnitIds || [] }, status: 'CRITICAL' }, orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, name: true, status: true, updatedAt: true } })
      ]);

      const actionQueue = [
        ...recentGrievances.map(g => ({ id: g.id, type: 'GRIEVANCE', title: g.title, priority: g.priority, status: g.status, date: g.createdAt.toISOString() })),
        ...criticalBoothsList.map(b => ({ id: b.id, type: 'BOOTH', title: b.name, status: b.status, date: b.updatedAt?.toISOString() }))
      ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5);

      summary = { ...summary, totalSupporters, strongSupporters, activeCampaigns, openGrievances, actionQueue };
    } else if (role === 'BOOTH_COORDINATOR') {
      const boothWhere: any = {};
      const supporterWhere: any = {};

      if (isScoped) {
        boothWhere.orgUnitId = { in: accessibleUnitIds };
        supporterWhere.booth = { orgUnitId: { in: accessibleUnitIds } };
      }
      const [totalBooths, readyBooths, criticalBooths, totalSupporters, criticalBoothsList, recentGrievances] = await Promise.all([
        prisma.booth.count({ where: boothWhere }),
        prisma.booth.count({ where: { ...boothWhere, status: 'READY' } }),
        prisma.booth.count({ where: { ...boothWhere, status: 'CRITICAL' } }),
        prisma.supporter.count({ where: supporterWhere }),
        prisma.booth.findMany({ where: { ...boothWhere, status: 'CRITICAL' }, orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, name: true, status: true, updatedAt: true } }),
        prisma.grievance.findMany({ where: { orgUnitId: { in: accessibleUnitIds || [] }, status: { not: 'closed' } }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, priority: true, status: true, createdAt: true } })
      ]);

      const actionQueue = [
        ...criticalBoothsList.map(b => ({ id: b.id, type: 'BOOTH', title: b.name, status: b.status, date: b.updatedAt?.toISOString() })),
        ...recentGrievances.map(g => ({ id: g.id, type: 'GRIEVANCE', title: g.title, priority: g.priority, status: g.status, date: g.createdAt.toISOString() }))
      ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5);

      summary = { ...summary, totalBooths, readyBooths, criticalBooths, totalSupporters, actionQueue };
    } else {
      // Regular Member
      const [myIssues, upcomingEvents, recentIssues, upcomingEventsList] = await Promise.all([
        prisma.issue.count({ where: { reporterId: userId } }),
        prisma.event.count({ where: { startDate: { gte: new Date() } } }),
        prisma.issue.findMany({ where: { reporterId: userId }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, status: true, createdAt: true } }),
        prisma.event.findMany({ where: { startDate: { gte: new Date() } }, orderBy: { startDate: 'asc' }, take: 5, select: { id: true, title: true, startDate: true, location: true } })
      ]);

      const actionQueue = [
        ...recentIssues.map(i => ({ id: i.id, type: 'ISSUE', title: i.title, status: i.status, date: i.createdAt.toISOString() })),
        ...upcomingEventsList.map(e => ({ id: e.id, type: 'EVENT', title: e.title, subtitle: e.location, date: e.startDate.toISOString() }))
      ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5);

      summary = { ...summary, myIssues, upcomingEvents, actionQueue };
    }

    // Phase 2B: Child-Unit Breakdown for all hierarchy-relevant roles
    if (role !== 'MEMBER') {
      let childUnitsSummary: any[] = [];
      let parentIdForChildren = req.user?.orgUnitId;
      
      if (!parentIdForChildren && (role === 'ADMIN' || role === 'STAFF' || role === 'FINANCE_OFFICER')) {
        const nationalUnit = await prisma.organizationUnit.findFirst({ where: { level: 'NATIONAL' } });
        if (nationalUnit) {
          parentIdForChildren = nationalUnit.id;
        }
      }
      
      if (parentIdForChildren) {
        const immediateChildren = await prisma.organizationUnit.findMany({
          where: { parentId: parentIdForChildren, isActive: true },
          select: { id: true, name: true, level: true },
          orderBy: { name: 'asc' }
        });
        
        if (immediateChildren.length > 0) {
          const childPromises = immediateChildren.map(async (child) => {
            const descendantIds = await hierarchyService.getSubUnitIds(child.id);
            
            const [members, supporters, booths, criticalBooths, grievances] = await Promise.all([
              prisma.member.count({ where: { orgUnitId: { in: descendantIds }, status: 'ACTIVE' } }),
              prisma.supporter.count({ where: { booth: { orgUnitId: { in: descendantIds } } } }),
              prisma.booth.count({ where: { orgUnitId: { in: descendantIds } } }),
              prisma.booth.count({ where: { orgUnitId: { in: descendantIds }, status: 'CRITICAL' } }),
              prisma.grievance.count({ where: { orgUnitId: { in: descendantIds }, status: { not: 'closed' } } })
            ]);
            
            return {
              id: child.id,
              name: child.name,
              level: child.level,
              members,
              supporters,
              booths,
              criticalBooths,
              openGrievances: grievances
            };
          });
          
          childUnitsSummary = await Promise.all(childPromises);
          childUnitsSummary.sort((a, b) => b.members - a.members);
        }
      }
      summary.childUnits = childUnitsSummary;
    }

    res.json(summary);
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/dashboard/diagnostics/db
// @desc    Diagnostic info for database (Admin only)
// @access  Private (Admin)
router.get('/diagnostics/db', authenticate, async (req: AuthRequest, res) => {
  try {
    // Extra guard: Only ADMIN or STAFF can see this
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'STAFF') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    const userCount = await prisma.user.count();
    const dbPath = '/app/applet/prisma/dev.db';
    const stats = fs.existsSync(dbPath) ? fs.statSync(dbPath) : null;

    res.json({
      userCount,
      dbFileStats: stats ? { size: stats.size } : 'Not found',
      status: 'Database connection healthy'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
