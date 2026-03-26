import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from './middleware/auth';
import { checkPermission } from './middleware/permissions';
import { z } from 'zod';
import { hierarchyService } from '../services/hierarchy.service';
import { permissionService } from '../services/permission.service';

const router = express.Router();

const boothSchema = z.object({
  name: z.string().min(2),
  pollingStationId: z.string().nullable().optional().transform(val => val === '' ? null : val),
  ward: z.number(),
  localLevel: z.string(),
  district: z.string(),
  province: z.string().optional(),
  totalVoters: z.number().default(0),
  targetVotes: z.number().default(0),
  status: z.enum(['READY', 'NEEDS_ATTENTION', 'CRITICAL']).optional(),
  readinessNote: z.string().optional(),
});

// @route   GET /api/v1/booths
// @desc    Get all booths
// @access  Private
router.get('/', authenticate, checkPermission('BOOTHS', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const where: any = {};
    
    // Hierarchy Scoping
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    if (accessibleUnitIds) {
      where.orgUnitId = { in: accessibleUnitIds };
    }

    const booths = await prisma.booth.findMany({
      where,
      orderBy: { ward: 'asc' },
    });
    res.json(booths);
  } catch (error) {
    console.error('Booths fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/booths
// @desc    Create a new booth
// @access  Private (Admin/Staff)
router.post('/', authenticate, checkPermission('BOOTHS', 'CREATE'), async (req: AuthRequest, res) => {
  try {
    const data = boothSchema.parse(req.body);
    const coordinatorId = req.user?.id;

    if (!coordinatorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const booth = await prisma.booth.create({
      data: {
        ...data,
        coordinatorId,
        status: data.status || 'NEEDS_ATTENTION',
      }
    });

    res.status(201).json(booth);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/v1/booths/:id
// @desc    Update a booth
// @access  Private (Admin/Staff)
router.put('/:id', authenticate, checkPermission('BOOTHS', 'UPDATE'), async (req: AuthRequest, res) => {
  try {
    const data = boothSchema.parse(req.body);
    const { id } = req.params;

    const booth = await prisma.booth.update({
      where: { id },
      data: {
        ...data,
        status: data.status || 'NEEDS_ATTENTION',
      }
    });

    res.json(booth);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/v1/booths/:id
// @desc    Delete a booth
// @access  Private (Admin/Staff)
router.delete('/:id', authenticate, checkPermission('BOOTHS', 'DELETE'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.booth.delete({ where: { id } });
    res.json({ message: 'Booth deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
