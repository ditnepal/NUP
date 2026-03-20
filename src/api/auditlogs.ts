import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';

const router = express.Router();

const auditLogSchema = z.object({
  action: z.string(),
  details: z.string(),
});

// @route   GET /api/v1/auditlogs
// @desc    Get all audit logs
// @access  Private (Admin)
router.get('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/auditlogs
// @desc    Create a new audit log
// @access  Private
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = auditLogSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const log = await prisma.auditLog.create({
      data: {
        ...data,
        userId,
        ipAddress: req.ip || '0.0.0.0',
      }
    });

    res.status(201).json(log);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
