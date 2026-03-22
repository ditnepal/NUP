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
  mobile: z.string().optional(),
  citizenshipNumber: z.string().min(5).optional(),
  dateOfBirth: z.string().min(1).transform(str => new Date(str)).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  citizenshipDistrict: z.string().optional(),
  citizenshipIssueDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  province: z.string().optional(),
  district: z.string().optional(),
  localLevel: z.string().optional(),
  ward: z.number().optional(),
  tole: z.string().optional(),
  alternateContactName: z.string().optional(),
  alternateContactMobile: z.string().optional(),
  occupation: z.string().optional(),
  applicationMode: z.enum(['FORM', 'VIDEO', 'ASSISTED']).default('FORM'),
  videoUrl: z.string().optional(),
  identityDocumentUrl: z.string().optional(),
  identityDocumentType: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
  helperName: z.string().optional(),
  helperPhone: z.string().optional(),
  helperRole: z.string().optional(),
  declaration: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  orgUnitId: z.string(),
});

// @route   GET /api/v1/members/:id
// @desc    Get member details
// @access  Private (Admin/Staff)
router.get('/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({
      where: { id },
      include: { orgUnit: true, user: { select: { email: true, displayName: true } } }
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
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
      if (!req.user?.orgUnitId) {
        return res.json([]);
      }
      const subUnitIds = await hierarchyService.getSubUnitIds(req.user.orgUnitId);
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
  } catch (error: any) {
    console.error('Detailed error in GET /api/v1/members:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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

import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

// @route   POST /api/v1/members/apply
// @desc    Submit membership application
// @access  Public (or Staff)
router.post('/apply', upload.fields([{ name: 'identityDocument' }, { name: 'profilePhoto' }, { name: 'video' }]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const data = {
      ...req.body,
      ward: req.body.ward ? parseInt(req.body.ward) : undefined,
      declaration: req.body.declaration,
      identityDocumentUrl: files.identityDocument ? `/uploads/${files.identityDocument[0].filename}` : undefined,
      profilePhotoUrl: files.profilePhoto ? `/uploads/${files.profilePhoto[0].filename}` : undefined,
      videoUrl: files.video ? `/uploads/${files.video[0].filename}` : undefined,
    };
    
    // Validate with Zod, but we need to handle the fact that files are now paths
    const validatedData = memberApplySchema.parse(data);
    const member = await membershipService.apply(validatedData as any);
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

// @route   POST /api/v1/members/:id/renew
// @desc    Renew membership
// @access  Private (Admin/Staff)
router.post('/:id/renew', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const member = await membershipService.renew(id);
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/members/:id/reissue-card
// @desc    Reissue membership card
// @access  Private (Admin/Staff)
router.post('/:id/reissue-card', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const member = await membershipService.generateCard(id);
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/members/:id/regenerate-card
// @desc    Regenerate membership card
// @access  Private (Admin/Staff)
router.post('/:id/regenerate-card', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const member = await membershipService.generateCard(id);
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/members/:id/transfer
// @desc    Transfer membership
// @access  Private (Admin)
router.post('/:id/transfer', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { newOrgUnitId } = req.body;
    const member = await membershipService.transfer(id, newOrgUnitId);
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/members/:id/suspend
// @desc    Suspend membership
// @access  Private (Admin/Staff)
router.post('/:id/suspend', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const member = await membershipService.suspend(id, reason);
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/members/:id/terminate
// @desc    Terminate membership
// @access  Private (Admin)
router.post('/:id/terminate', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const member = await membershipService.terminate(id, reason);
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/v1/members/:id
// @desc    Update member
// @access  Private (Admin/Staff)
router.put('/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const member = await prisma.member.update({
      where: { id },
      data: {
        fullName: data.fullName,
        citizenshipNumber: data.citizenshipNumber,
        status: data.status,
      }
    });
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
