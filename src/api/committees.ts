import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';

const router = express.Router();

const committeeSchema = z.object({
  name: z.string().min(2),
  level: z.enum(['CENTRAL', 'PROVINCIAL', 'DISTRICT', 'LOCAL', 'WARD', 'BOOTH']),
  province: z.string().optional(),
  district: z.string().optional(),
  localLevel: z.string().optional(),
  ward: z.number().optional(),
});

// @route   GET /api/v1/committees
// @desc    Get all committees
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const committees = await prisma.committee.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(committees);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/committees
// @desc    Create a new committee
// @access  Private (Admin/Staff)
router.post('/', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = committeeSchema.parse(req.body);

    const committee = await prisma.committee.create({
      data
    });

    res.status(201).json(committee);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
