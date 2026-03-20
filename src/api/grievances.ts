import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';

const router = express.Router();

const grievanceSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  localLevel: z.string().optional(),
  contactInfo: z.string().optional(),
});

// @route   GET /api/v1/grievances
// @desc    Get all grievances (Admin/Staff see all, others see their own)
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;

    if (!role || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let grievances;
    if (role === 'ADMIN' || role === 'STAFF') {
      grievances = await prisma.issue.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } else {
      grievances = await prisma.issue.findMany({
        where: { reporterId: userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(grievances);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/grievances
// @desc    Submit a new grievance
// @access  Private
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = grievanceSchema.parse(req.body);
    const reporterId = req.user?.id;

    if (!reporterId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const grievance = await prisma.issue.create({
      data: {
        ...data,
        reporterId,
        status: 'OPEN',
        priority: data.priority || 'MEDIUM',
      }
    });

    res.status(201).json(grievance);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
