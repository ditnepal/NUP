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
        issueWhere.orgUnitId = { in: accessibleUnitIds };
        grievanceWhere.orgUnitId = { in: accessibleUnitIds };
        surveyWhere.orgUnitId = { in: accessibleUnitIds };
      }

      const [totalMembers, totalSupporters, totalBooths, activeCampaigns, openIssues, openGrievances, activeSurveys] = await Promise.all([
        prisma.member.count({ where: memberWhere }),
        prisma.supporter.count({ where: supporterWhere }),
        prisma.booth.count({ where: boothWhere }),
        prisma.campaign.count({ where: campaignWhere }),
        prisma.issue.count({ where: issueWhere }),
        prisma.grievance.count({ where: grievanceWhere }),
        prisma.survey.count({ where: surveyWhere })
      ]);

      // Phase 2A: Child-Unit Breakdown
      let childUnitsSummary: any[] = [];
      let parentIdForChildren = req.user?.orgUnitId;
      
      if (!parentIdForChildren) {
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
            
            const [members, supporters, booths, grievances] = await Promise.all([
              prisma.member.count({ where: { orgUnitId: { in: descendantIds }, status: 'ACTIVE' } }),
              prisma.supporter.count({ where: { booth: { orgUnitId: { in: descendantIds } } } }),
              prisma.booth.count({ where: { orgUnitId: { in: descendantIds } } }),
              prisma.grievance.count({ where: { orgUnitId: { in: descendantIds }, status: { not: 'closed' } } })
            ]);
            
            return {
              id: child.id,
              name: child.name,
              level: child.level,
              members,
              supporters,
              booths,
              openGrievances: grievances
            };
          });
          
          childUnitsSummary = await Promise.all(childPromises);
          childUnitsSummary.sort((a, b) => b.members - a.members);
        }
      }

      summary = { ...summary, totalMembers, totalSupporters, totalBooths, activeCampaigns, openIssues, openGrievances, activeSurveys, childUnits: childUnitsSummary };
    } else if (role === 'FINANCE_OFFICER') {
      const transactionWhere: any = {};
      const donationWhere: any = { status: 'COMPLETED' };
      const fundCampaignWhere: any = { status: 'ACTIVE' };

      if (isScoped) {
        transactionWhere.member = { orgUnitId: { in: accessibleUnitIds } };
        donationWhere.campaign = { orgUnitId: { in: accessibleUnitIds } };
        fundCampaignWhere.orgUnitId = { in: accessibleUnitIds };
      }
      
      const [transactions, donations, activeFundCampaigns] = await Promise.all([
        prisma.transaction.findMany({ where: transactionWhere }),
        prisma.donation.findMany({ where: donationWhere }),
        prisma.fundraisingCampaign.count({ where: fundCampaignWhere })
      ]);
      
      const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
      const totalDonations = donations.reduce((acc, curr) => acc + curr.amount, 0);
      
      summary = { ...summary, totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses, transactionCount: transactions.length, totalDonations, activeFundCampaigns };
    } else if (role === 'FIELD_COORDINATOR') {
      const supporterWhere: any = {};
      const campaignWhere: any = { phase: 'ACTIVE' };
      const grievanceWhere: any = { status: { not: 'closed' } };
      
      if (isScoped) {
        supporterWhere.booth = { orgUnitId: { in: accessibleUnitIds } };
        grievanceWhere.orgUnitId = { in: accessibleUnitIds };
      }

      const [totalSupporters, strongSupporters, activeCampaigns, openGrievances] = await Promise.all([
        prisma.supporter.count({ where: supporterWhere }),
        prisma.supporter.count({ where: { ...supporterWhere, supportLevel: 'STRONG' } }),
        prisma.campaign.count({ where: campaignWhere }),
        prisma.grievance.count({ where: grievanceWhere })
      ]);
      summary = { ...summary, totalSupporters, strongSupporters, activeCampaigns, openGrievances };
    } else if (role === 'BOOTH_COORDINATOR') {
      const boothWhere: any = {};
      const supporterWhere: any = {};

      if (isScoped) {
        boothWhere.orgUnitId = { in: accessibleUnitIds };
        supporterWhere.booth = { orgUnitId: { in: accessibleUnitIds } };
      }
      const [totalBooths, readyBooths, criticalBooths, totalSupporters] = await Promise.all([
        prisma.booth.count({ where: boothWhere }),
        prisma.booth.count({ where: { ...boothWhere, status: 'READY' } }),
        prisma.booth.count({ where: { ...boothWhere, status: 'CRITICAL' } }),
        prisma.supporter.count({ where: supporterWhere })
      ]);
      summary = { ...summary, totalBooths, readyBooths, criticalBooths, totalSupporters };
    } else {
      // Regular Member
      const [myIssues, upcomingEvents] = await Promise.all([
        prisma.issue.count({ where: { reporterId: userId } }),
        prisma.event.count({ where: { startDate: { gte: new Date() } } })
      ]);
      summary = { ...summary, myIssues, upcomingEvents };
    }

    res.json(summary);
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
