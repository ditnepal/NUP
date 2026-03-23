import express from 'express';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = express.Router();

const appEventSchema = z.object({
  title: z.string().min(2),
  summary: z.string().optional(),
  description: z.string(),
  audience: z.enum(['PUBLIC', 'MEMBERS']),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  isPinned: z.boolean().default(false),
  eventDate: z.string().transform(val => new Date(val)),
  startAt: z.string(),
  endAt: z.string().optional(),
  location: z.string(),
  coverImageUrl: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

// @route   GET /api/v1/app-events/public
// @desc    Get published public events
router.get('/public', async (req, res) => {
  try {
    const events = await prisma.appEvent.findMany({
      where: { audience: 'PUBLIC', status: 'PUBLISHED' },
      orderBy: [{ isPinned: 'desc' }, { eventDate: 'asc' }],
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/app-events/members
// @desc    Get published member events
router.get('/members', authenticate, async (req: AuthRequest, res) => {
  try {
    // Assuming approval check is done via membership status
    const member = await prisma.member.findUnique({ where: { userId: req.user?.id } });
    if (!member || member.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const events = await prisma.appEvent.findMany({
      where: { audience: 'MEMBERS', status: 'PUBLISHED' },
      orderBy: [{ isPinned: 'desc' }, { eventDate: 'asc' }],
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/app-events
// @desc    Get all events (Admin)
router.get('/', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const events = await prisma.appEvent.findMany({
      orderBy: [{ eventDate: 'desc' }],
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/app-events
// @desc    Create an event
router.post('/', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = appEventSchema.parse(req.body);
    const event = await prisma.appEvent.create({
      data: { ...data, eventDate: data.eventDate, author: { connect: { id: req.user!.id } } },
    });
    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PATCH /api/v1/app-events/:id
// @desc    Update an event
router.patch('/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = appEventSchema.partial().parse(req.body);
    const event = await prisma.appEvent.update({
      where: { id: req.params.id },
      data,
    });
    res.json(event);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
