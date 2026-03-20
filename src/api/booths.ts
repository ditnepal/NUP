import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';

const router = express.Router();

const boothSchema = z.object({
  name: z.string().min(2),
  ward: z.number(),
  localLevel: z.string(),
  district: z.string(),
  province: z.string(),
  voterCount: z.number().optional(),
  targetVotes: z.number().optional(),
  status: z.enum(['SAFE', 'COMPETITIVE', 'WEAK']).optional(),
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
        status: data.status || 'COMPETITIVE',
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

export default router;
