import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';

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
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const booths = await prisma.booth.findMany({
      orderBy: { ward: 'asc' },
    });
    res.json(booths);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/booths
// @desc    Create a new booth
// @access  Private (Admin/Staff)
router.post('/', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
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
router.put('/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
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
router.delete('/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.booth.delete({ where: { id } });
    res.json({ message: 'Booth deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
