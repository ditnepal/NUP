import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from './middleware/auth';
import { checkPermission } from './middleware/permissions';
import { z } from 'zod';
import { hierarchyService } from '../services/hierarchy.service';
import { permissionService } from '../services/permission.service';

const router = express.Router();

const supporterSchema = z.object({
  fullName: z.string().min(2),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  province: z.string(),
  district: z.string(),
  localLevel: z.string(),
  ward: z.number().int().positive(),
  boothId: z.string().optional(),
  supportLevel: z.enum(['STRONG', 'LEANING', 'NEUTRAL', 'UNDECIDED', 'VOLUNTEER', 'DONOR']).optional(),
  issues: z.string().optional(),
  notes: z.string().optional(),
});

// @route   GET /api/v1/supporters
// @desc    Get all supporters (with pagination and filtering)
// @access  Private (Staff, Field Coordinator, Booth Coordinator)
router.get('/', authenticate, checkPermission('SUPPORTERS', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { province, district, localLevel, ward, supportLevel, boothId } = req.query;

    const where: any = {};
    if (province) where.province = province;
    if (district) where.district = district;
    if (localLevel) where.localLevel = localLevel;
    if (ward) where.ward = parseInt(ward as string);
    if (supportLevel) where.supportLevel = supportLevel;
    if (boothId) where.boothId = boothId;

    // Hierarchy Scoping
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    if (accessibleUnitIds) {
      where.booth = { orgUnitId: { in: accessibleUnitIds } };
    }

    const [supporters, total] = await Promise.all([
      prisma.supporter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { 
          booth: { select: { name: true, code: true } },
          interactions: { orderBy: { date: 'desc' }, take: 5 }
        }
      }),
      prisma.supporter.count({ where })
    ]);

    res.json({
      data: supporters,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Supporters fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/supporters
// @desc    Create a new supporter
// @access  Private
router.post('/', authenticate, checkPermission('SUPPORTERS', 'CREATE'), async (req: AuthRequest, res) => {
  try {
    const data = supporterSchema.parse(req.body);

    const supporter = await prisma.supporter.create({
      data: {
        ...data,
        supportLevel: data.supportLevel || 'NEUTRAL',
      }
    });

    res.status(201).json(supporter);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error', details: error });
  }
});

// @route   PUT /api/v1/supporters/:id
// @desc    Update supporter profile
// @access  Private
router.put('/:id', authenticate, checkPermission('SUPPORTERS', 'UPDATE'), async (req: AuthRequest, res) => {
  try {
    const data = supporterSchema.partial().parse(req.body);
    
    const supporter = await prisma.supporter.findUnique({ where: { id: req.params.id } });
    if (!supporter) {
      return res.status(404).json({ error: 'Supporter not found' });
    }

    const updatedSupporter = await prisma.supporter.update({
      where: { id: req.params.id },
      data
    });

    res.json(updatedSupporter);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/v1/supporters/:id
// @desc    Delete a supporter
// @access  Private (Admin, Staff)
router.delete('/:id', authenticate, checkPermission('SUPPORTERS', 'DELETE'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const supporter = await prisma.supporter.findUnique({ where: { id } });
    if (!supporter) {
      return res.status(404).json({ error: 'Supporter not found' });
    }

    await prisma.supporter.delete({ where: { id } });
    
    res.json({ message: 'Supporter deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting supporter' });
  }
});

// @route   POST /api/v1/supporters/:id/interactions
// @desc    Log an interaction with a supporter
// @access  Private
router.post('/:id/interactions', authenticate, checkPermission('SUPPORTERS', 'UPDATE'), async (req: AuthRequest, res) => {
  try {
    const { type, notes } = req.body;
    const supporterId = req.params.id;
    const handledBy = req.user?.id;

    if (!type || !handledBy) {
      return res.status(400).json({ error: 'Type and handledBy are required' });
    }

    const interaction = await prisma.interaction.create({
      data: {
        supporterId,
        type,
        notes,
        handledBy,
      }
    });

    res.status(201).json(interaction);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
