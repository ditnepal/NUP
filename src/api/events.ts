import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';

const router = express.Router();

const eventSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  date: z.string().datetime(),
  location: z.string(),
  type: z.enum(['PUBLIC', 'INTERNAL', 'CAMPAIGN', 'MEETING']),
});

// @route   GET /api/v1/events
// @desc    Get all events
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/events
// @desc    Create a new event
// @access  Private (Admin/Staff)
router.post('/', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = eventSchema.parse(req.body);
    const organizerId = req.user?.id;

    if (!organizerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const event = await prisma.event.create({
      data: {
        ...data,
        organizerId,
        date: new Date(data.date),
      }
    });

    res.status(201).json(event);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
