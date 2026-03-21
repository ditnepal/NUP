import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';
import { membershipService } from '../services/membership.service';
import { auditService } from '../services/audit.service';
import { hierarchyService } from '../services/hierarchy.service';

const router = express.Router();

const memberApplySchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  citizenshipNumber: z.string().min(5),
  dateOfBirth: z.string().min(1).transform(str => new Date(str)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().optional(),
  province: z.string(),
  district: z.string(),
  localLevel: z.string(),
  ward: z.number(),
  orgUnitId: z.string(),
});

// @route   GET /api/v1/members
// @desc    Get members (Scoped)
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, unitId } = req.query;
    const query: any = {};
    if (status) query.status = status;
    
    // Hierarchy Scoping
    if (unitId) {
      const hasAccess = await hierarchyService.hasAccess(req.user?.id!, unitId as string);
      if (!hasAccess) return res.status(403).json({ error: 'Access denied to this unit' });
      
      const subUnitIds = await hierarchyService.getSubUnitIds(unitId as string);
      query.orgUnitId = { in: subUnitIds };
    } else if (req.user?.role !== 'ADMIN') {
      const subUnitIds = await hierarchyService.getSubUnitIds(req.user?.orgUnitId!);
      query.orgUnitId = { in: subUnitIds };
    }

    const members = await prisma.member.findMany({
      where: query,
      include: {
        orgUnit: { select: { name: true, level: true } },
        user: { select: { email: true, displayName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/members/me
// @desc    Get current user's member profile
// @access  Private
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { userId: req.user?.id },
      include: { 
        orgUnit: true,
        user: { select: { email: true, displayName: true } }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member profile not found' });
    }

    // Fetch some stats for the dashboard
    const [donorProfile, eventsAttended, volunteerStats, activeGrievances, pendingTasks, upcomingEvents] = await Promise.all([
      prisma.donorProfile.findUnique({
        where: { userId: req.user?.id }
      }),
      prisma.eventRegistration.count({
        where: { userId: req.user?.id, status: 'ATTENDED' }
      }),
      prisma.volunteerReport.aggregate({
        where: {
          assignment: {
            volunteer: {
              userId: req.user?.id
            }
          }
        },
        _sum: { hoursSpent: true }
      }),
      prisma.grievance.count({
        where: { reporterId: req.user?.id, status: { not: 'RESOLVED' } }
      }),
      prisma.volunteerAssignment.count({
        where: {
          volunteer: { userId: req.user?.id },
          status: 'PENDING'
        }
      }),
      prisma.eventRegistration.count({
        where: {
          userId: req.user?.id,
          event: { startDate: { gte: new Date() } }
        }
      })
    ]);

    res.json({
      ...member,
      stats: {
        totalDonated: donorProfile?.totalDonated || 0,
        eventsAttended,
        volunteerHours: volunteerStats._sum.hoursSpent || 0,
        activeGrievances,
        pendingTasks,
        upcomingEvents
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/members/apply
// @desc    Submit membership application
// @access  Public (or Staff)
router.post('/apply', async (req, res) => {
  try {
    const data = memberApplySchema.parse(req.body) as any;
    const member = await membershipService.apply(data);
    res.status(201).json(member);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/members/:id/verify
// @desc    Verify membership (Local Unit)
// @access  Private (Staff/Admin)
router.post('/:id/verify', authenticate, authorize(['ADMIN', 'STAFF', 'FIELD_COORDINATOR']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const member = await membershipService.verify(id, req.user?.id!);
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/members/:id/approve
// @desc    Approve membership (Higher Unit)
// @access  Private (Admin/Staff)
router.post('/:id/approve', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const member = await membershipService.approve(id, req.user?.id!);
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/v1/members/:id/card
// @desc    Get digital membership card data
// @access  Private
router.get('/:id/card', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({
      where: { id },
      include: { orgUnit: true }
    });

    if (!member || member.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Active membership not found' });
    }

    // Security: Only owner or authorized staff can view card
    if (member.userId !== req.user?.id && req.user?.role === 'MEMBER') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      membershipId: member.membershipId,
      fullName: member.fullName,
      joinedDate: member.joinedDate,
      expiryDate: member.expiryDate,
      orgUnit: member.orgUnit?.name,
      level: member.orgUnit?.level,
      qrCode: member.qrCodeData
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
