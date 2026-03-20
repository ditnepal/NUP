import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';

const router = express.Router();

const memberSchema = z.object({
  fullName: z.string().min(2),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  province: z.string(),
  district: z.string(),
  localLevel: z.string(),
  ward: z.number().int().positive(),
  boothId: z.string().optional(),
  committeeLevel: z.string().optional(),
  committeeRole: z.string().optional(),
  status: z.string().optional(),
});

// @route   GET /api/v1/members
// @desc    Get all members (with pagination and filtering)
// @access  Private (Staff, Admin, Field Coordinator)
router.get('/', authenticate, authorize(['STAFF', 'FIELD_COORDINATOR']), async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { province, district, localLevel, ward, status } = req.query;

    const where: any = {};
    if (province) where.province = province;
    if (district) where.district = district;
    if (localLevel) where.localLevel = localLevel;
    if (ward) where.ward = parseInt(ward as string);
    if (status) where.status = status;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joinedDate: 'desc' },
        include: { user: { select: { email: true, phoneNumber: true } }, booth: { select: { name: true, code: true } } }
      }),
      prisma.member.count({ where })
    ]);

    res.json({
      data: members,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/members/:id
// @desc    Get member by ID
// @access  Private
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { email: true, phoneNumber: true } }, booth: true }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Only allow users to see their own profile unless they have elevated privileges
    if (member.userId !== req.user?.id && !['ADMIN', 'STAFF', 'FIELD_COORDINATOR'].includes(req.user?.role || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(member);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/members
// @desc    Create a new member profile (Admin/Staff only)
// @access  Private
router.post('/', authenticate, authorize(['STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = memberSchema.parse(req.body);
    const userId = req.body.userId; // Must provide a valid user ID

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if user already has a profile
    const existingProfile = await prisma.member.findUnique({ where: { userId } });
    if (existingProfile) {
      return res.status(400).json({ error: 'User already has a member profile' });
    }

    // Generate Membership ID (e.g., NUP-YYYY-XXXX)
    const year = new Date().getFullYear();
    const count = await prisma.member.count();
    const membershipId = `NUP-${year}-${String(count + 1).padStart(4, '0')}`;

    const member = await prisma.member.create({
      data: {
        ...data,
        userId,
        membershipId,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      }
    });

    res.status(201).json(member);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error', details: error });
  }
});

// @route   PUT /api/v1/members/:id
// @desc    Update member profile
// @access  Private
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = memberSchema.partial().parse(req.body);
    
    const member = await prisma.member.findUnique({ where: { id: req.params.id } });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Only allow users to update their own profile unless they have elevated privileges
    if (member.userId !== req.user?.id && !['ADMIN', 'STAFF'].includes(req.user?.role || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedMember = await prisma.member.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      }
    });

    res.json(updatedMember);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
