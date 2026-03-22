import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';
import { membershipService } from '../services/membership.service';
import { auditService } from '../services/audit.service';
import { hierarchyService } from '../services/hierarchy.service';

const router = express.Router();
console.log('Members router loaded');

// @route   GET /api/v1/members/:id
// @desc    Get member details
// @access  Private (Admin/Staff)
router.get('/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({
      where: { id },
      include: { orgUnit: true, user: { select: { email: true, displayName: true, phoneNumber: true } } }
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
        user: { select: { email: true, displayName: true, phoneNumber: true } }
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
        user: { select: { email: true, displayName: true, phoneNumber: true } }
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
import multer from 'multer';
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 
      'video/mp4', 'video/quicktime', 'video/x-msvideo',
      'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'));
    }
  }
});

const memberApplySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
  citizenshipNumber: z.string().min(5).optional().or(z.literal('')),
  dateOfBirth: z.preprocess((val) => val ? new Date(val as string) : undefined, z.date().optional()),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  fatherName: z.string().optional().or(z.literal('')),
  motherName: z.string().optional().or(z.literal('')),
  citizenshipDistrict: z.string().optional().or(z.literal('')),
  citizenshipIssueDate: z.preprocess((val) => val ? new Date(val as string) : undefined, z.date().optional()),
  province: z.string().optional().or(z.literal('')),
  district: z.string().optional().or(z.literal('')),
  localLevel: z.string().optional().or(z.literal('')),
  ward: z.preprocess((val) => val ? parseInt(val as string) : undefined, z.number().optional()),
  tole: z.string().optional().or(z.literal('')),
  alternateContactName: z.string().optional().or(z.literal('')),
  alternateContactMobile: z.string().optional().or(z.literal('')),
  occupation: z.string().optional().or(z.literal('')),
  applicationMode: z.enum(['FORM', 'VIDEO', 'ASSISTED']).default('FORM'),
  orgUnitId: z.string().min(1, "Organization Unit is required"),
  identityDocumentType: z.string().optional().or(z.literal('')),
  helperName: z.string().optional().or(z.literal('')),
  helperPhone: z.string().optional().or(z.literal('')),
  helperRole: z.string().optional().or(z.literal('')),
  declaration: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
});

// @route   POST /api/v1/members/apply
// @desc    Submit membership application
// @access  Public (or Staff)
router.post('/apply', upload.fields([
  { name: 'identityDocument', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    // 1. Validate fields with Zod
    const validatedData = memberApplySchema.parse(req.body);
    
    // 2. Extract files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};
    const identityDocument = files['identityDocument']?.[0];
    const profilePhoto = files['profilePhoto']?.[0];
    const video = files['video']?.[0];
    
    // 3. Mode-specific file validation
    if (validatedData.applicationMode === 'FORM') {
      if (!identityDocument) return res.status(400).json({ error: 'Identity document is required for FORM applications' });
      if (!profilePhoto) return res.status(400).json({ error: 'Profile photo is required for FORM applications' });
    } else if (validatedData.applicationMode === 'VIDEO') {
      if (!video) return res.status(400).json({ error: 'Video submission is required for VIDEO applications' });
    } else if (validatedData.applicationMode === 'ASSISTED') {
      if (!identityDocument) return res.status(400).json({ error: 'Identity document is required for ASSISTED applications' });
    }

    // 4. Merge data for service
    const applicationData = {
      ...validatedData,
      identityDocumentUrl: identityDocument?.path,
      profilePhotoUrl: profilePhoto?.path,
      videoUrl: video?.path,
    };

    const member = await membershipService.apply(applicationData as any);
    res.status(201).json({ trackingCode: member.trackingCode });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/members/:id/reject
// @desc    Reject membership application
// @access  Private (Admin/Staff)
router.post('/:id/reject', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const member = await membershipService.reject(id, reason);
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

// @route   POST /api/v1/members/:id/generate-card
// @desc    Generate membership card
// @access  Private (Admin/Staff)
router.post('/:id/generate-card', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const member = await membershipService.generateCard(id);
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
