import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';

const router = express.Router();

const candidateSchema = z.object({
  name: z.string().min(2),
  electionType: z.enum(['FEDERAL', 'PROVINCIAL', 'LOCAL']),
  electionYear: z.number(),
  constituency: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  localLevel: z.string().optional(),
  ward: z.number().optional(),
  status: z.enum(['NOMINATED', 'ELECTED', 'DEFEATED', 'WITHDRAWN']).optional(),
});

// @route   GET /api/v1/candidates
// @desc    Get all candidates
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { electionYear: 'desc' },
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/candidates
// @desc    Create a new candidate
// @access  Private (Admin/Staff)
router.post('/', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = candidateSchema.parse(req.body);

    const candidate = await prisma.candidate.create({
      data: {
        ...data,
        status: data.status || 'NOMINATED',
      }
    });

    res.status(201).json(candidate);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
