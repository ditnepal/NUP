import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from './middleware/auth';
import { checkPermission } from './middleware/permissions';
import { z } from 'zod';
import { membershipService } from '../services/membership.service';
import { financeService } from '../services/finance.service';
import { auditService } from '../services/audit.service';
import { hierarchyService } from '../services/hierarchy.service';
import { permissionService } from '../services/permission.service';

const router = express.Router();
console.log('Members router loaded');

// @route   GET /api/v1/members/dashboard/metrics
// @desc    Get membership dashboard metrics
// @access  Private (Admin/Staff)
router.get('/dashboard/metrics', authenticate, checkPermission('MEMBERSHIP', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    // Basic member counts
    const totalPending = await prisma.member.count({ where: { status: 'PENDING' } });
    const totalActive = await prisma.member.count({ where: { status: 'ACTIVE' } });
    const totalInactive = await prisma.member.count({ 
      where: { status: { in: ['REJECTED', 'SUSPENDED', 'TERMINATED'] } } 
    });

    // Renewal counts
    const pendingRenewals = await prisma.renewalRequest.count({ where: { status: 'PENDING' } });
    const processedRenewals = await prisma.renewalRequest.count({ 
      where: { status: { in: ['APPROVED', 'REJECTED', 'COMPLETED'] } } 
    });

    // Financial collections (from transactions)
    const membershipCollections = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { category: 'MEMBERSHIP_FEE', type: 'INCOME', status: 'COMPLETED' }
    });

    const renewalCollections = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { category: 'RENEWAL_FEE', type: 'INCOME', status: 'COMPLETED' }
    });

    res.json({
      totalPending,
      totalActive,
      totalInactive,
      pendingRenewals,
      processedRenewals,
      membershipCollections: membershipCollections._sum.amount || 0,
      renewalCollections: renewalCollections._sum.amount || 0
    });
  } catch (error) {
    console.error('Error fetching membership metrics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/members/:id
// @desc    Get member details
// @access  Private (Admin/Staff)
router.get('/:id', authenticate, checkPermission('MEMBERSHIP', 'VIEW', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({
      where: { id },
      include: { 
        orgUnit: true, 
        user: { select: { email: true, displayName: true, phoneNumber: true } },
        verifiedBy: { select: { displayName: true } },
        approvedBy: { select: { displayName: true } }
      }
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
router.get('/', authenticate, checkPermission('MEMBERSHIP', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const { status, unitId, isEscalated } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (isEscalated === 'true') query.isEscalated = true;
    if (isEscalated === 'false') query.isEscalated = false;
    
    // Hierarchy Scoping
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    
    if (unitId) {
      const hasAccess = await hierarchyService.hasAccess(req.user?.id!, unitId as string);
      if (!hasAccess) return res.status(403).json({ error: 'Access denied to this unit' });
      
      const subUnitIds = await hierarchyService.getSubUnitIds(unitId as string);
      query.orgUnitId = { in: subUnitIds };
    } else if (accessibleUnitIds) {
      query.orgUnitId = { in: accessibleUnitIds };
    }

    const members = await prisma.member.findMany({
      where: query,
      include: {
        orgUnit: { select: { name: true, level: true } },
        user: { select: { email: true, displayName: true, phoneNumber: true } },
        verifiedBy: { select: { displayName: true } },
        approvedBy: { select: { displayName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(members);
  } catch (error: any) {
    console.error('Detailed error in GET /api/v1/members:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message,
      code: error.code 
    });
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
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
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
  paymentMethod: z.string().optional().or(z.literal('')),
});

// @route   POST /api/v1/members/me/photo
// @desc    Update current user's profile photo
// @access  Private
router.post('/me/photo', authenticate, upload.single('photo'), async (req: AuthRequest, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { userId: req.user?.id }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member profile not found' });
    }

    if (member.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Only active members can update their profile photo' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    // Update member record
    const fileUrl = `/uploads/${req.file.filename}`;
    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: { profilePhotoUrl: fileUrl }
    });

    res.json(updatedMember);
  } catch (error: any) {
    console.error('Error updating profile photo:', error);
    res.status(500).json({ error: 'Failed to update profile photo' });
  }
});

// @route   PUT /api/v1/members/me
// @desc    Update current user's member profile (safe fields only)
// @access  Private
router.put('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { userId: req.user?.id }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member profile not found' });
    }

    if (member.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Only active members can update their profile' });
    }

    const {
      email,
      mobile,
      alternateContactName,
      alternateContactMobile,
      province,
      district,
      localLevel,
      ward,
      tole,
      occupation
    } = req.body;

    // Update user record if email or mobile changed
    if (email || mobile) {
      await prisma.user.update({
        where: { id: req.user?.id },
        data: {
          ...(email && { email }),
          ...(mobile && { phoneNumber: mobile })
        }
      });
    }

    // Update member record
    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: {
        email: email || null,
        mobile: mobile || null,
        alternateContactName: alternateContactName || null,
        alternateContactMobile: alternateContactMobile || null,
        province: province || null,
        district: district || null,
        localLevel: localLevel || null,
        ward: ward ? parseInt(ward) : null,
        tole: tole || null,
        occupation: occupation || null
      }
    });

    res.json(updatedMember);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// @route   GET /api/v1/members/me/renewals
// @desc    Get current member's renewal requests
// @access  Private
router.get('/me/renewals', authenticate, async (req: AuthRequest, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { userId: req.user?.id }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member profile not found' });
    }

    const renewals = await prisma.renewalRequest.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(renewals);
  } catch (error: any) {
    console.error('Error fetching renewals:', error);
    res.status(500).json({ error: 'Server error fetching renewals' });
  }
});

// @route   POST /api/v1/members/me/renewals
// @desc    Submit a renewal request
// @access  Private (ACTIVE members only)
router.post('/me/renewals', authenticate, async (req: AuthRequest, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { userId: req.user?.id }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member profile not found' });
    }

    if (member.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Only ACTIVE members can submit renewal requests' });
    }

    // Check for existing pending request
    const existingPending = await prisma.renewalRequest.findFirst({
      where: {
        memberId: member.id,
        status: 'PENDING'
      }
    });

    if (existingPending) {
      return res.status(400).json({ error: 'You already have a pending renewal request' });
    }

    const { memberNote, paymentMethod } = req.body;

    const renewal = await prisma.renewalRequest.create({
      data: {
        memberId: member.id,
        memberNote: memberNote || null,
        paymentMethod: paymentMethod || null,
        status: 'PENDING'
      }
    });

    // Initiate manual payment if applicable
    if (paymentMethod) {
      const integrations = await financeService.listPublicPaymentIntegrations('RENEWALS');
      const selectedMethod = integrations.find(i => i.provider === paymentMethod);
      
      if (selectedMethod && selectedMethod.isManual) {
        // For now, use a default renewal fee if not specified, or fetch it
        // In a real app, we'd look up the fee from MembershipType
        const membershipType = member.membershipTypeId 
          ? await prisma.membershipType.findUnique({ where: { id: member.membershipTypeId } })
          : null;
        const amount = membershipType?.fee || 0;

        await financeService.initiateManualPayment({
          module: 'RENEWALS',
          amount,
          paymentMethod,
          description: `Renewal fee for ${member.fullName} (${member.membershipId})`,
          memberId: member.id,
          renewalRequestId: renewal.id,
          recordedById: req.user?.id,
          orgUnitId: member.orgUnitId,
        });
      }
    }

    res.status(201).json(renewal);
  } catch (error: any) {
    console.error('Error submitting renewal request:', error);
    res.status(500).json({ error: 'Server error submitting renewal request' });
  }
});

// @route   POST /api/v1/members/apply
// @desc    Submit membership application
// @access  Private (or Staff)
router.post('/apply', authenticate, checkPermission('MEMBERSHIP', 'CREATE'), upload.fields([
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
      identityDocumentUrl: identityDocument ? `/uploads/${identityDocument.filename}` : undefined,
      profilePhotoUrl: profilePhoto ? `/uploads/${profilePhoto.filename}` : undefined,
      videoUrl: video ? `/uploads/${video.filename}` : undefined,
    };

    const member = await membershipService.apply(applicationData as any);

    // Initiate manual payment if applicable
    if (validatedData.paymentMethod) {
      const integrations = await financeService.listPublicPaymentIntegrations('MEMBERSHIP');
      const selectedMethod = integrations.find(i => i.provider === validatedData.paymentMethod);
      
      if (selectedMethod && selectedMethod.isManual) {
        // In a real app, we'd fetch the fee from the selected MembershipType
        // For now, we'll use a placeholder or look it up if we had the ID
        await financeService.initiateManualPayment({
          module: 'MEMBERSHIP',
          amount: 0, // Placeholder: Fee should be fetched based on type
          paymentMethod: validatedData.paymentMethod,
          description: `Membership application fee for ${validatedData.fullName}`,
          memberId: member.id,
          orgUnitId: member.orgUnitId,
        });
      }
    }

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
router.post('/:id/reject', authenticate, checkPermission('MEMBERSHIP', 'REJECT', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
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
router.post('/:id/verify', authenticate, checkPermission('MEMBERSHIP', 'VERIFY', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    const updatedMember = await membershipService.verify(id, req.user?.id!, note);
    res.json(updatedMember);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/members/:id/approve
// @desc    Approve membership (Higher Unit)
// @access  Private (Admin/Staff)
router.post('/:id/approve', authenticate, checkPermission('MEMBERSHIP', 'APPROVE', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const updatedMember = await membershipService.approve(id, req.user?.id!, note);
    res.json(updatedMember);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/members/:id/escalate
// @desc    Escalate membership application to parent unit
// @access  Private (Staff/Admin)
router.post('/:id/escalate', authenticate, checkPermission('MEMBERSHIP', 'ESCALATE', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const updatedMember = await membershipService.escalate(id, note);
    res.json(updatedMember);
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
router.post('/:id/renew', authenticate, checkPermission('MEMBERSHIP', 'RENEW', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
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
router.post('/:id/generate-card', authenticate, checkPermission('MEMBERSHIP', 'GENERATE_CARD', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
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
router.post('/:id/reissue-card', authenticate, checkPermission('MEMBERSHIP', 'GENERATE_CARD', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
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
router.post('/:id/regenerate-card', authenticate, checkPermission('MEMBERSHIP', 'GENERATE_CARD', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
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
router.post('/:id/transfer', authenticate, checkPermission('MEMBERSHIP', 'TRANSFER', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
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
router.post('/:id/suspend', authenticate, checkPermission('MEMBERSHIP', 'SUSPEND', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
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
router.post('/:id/terminate', authenticate, checkPermission('MEMBERSHIP', 'TERMINATE', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
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
router.put('/:id', authenticate, checkPermission('MEMBERSHIP', 'UPDATE', async (req) => {
  const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { orgUnitId: true } });
  return member?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const member = await prisma.member.update({
      where: { id },
      data: {
        fullName: data.fullName,
        citizenshipNumber: data.citizenshipNumber,
        paymentMethod: data.paymentMethod,
        status: data.status,
      }
    });
    res.json(member);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
