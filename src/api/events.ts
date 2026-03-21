import express from 'express';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { eventService } from '../services/event.service';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = express.Router();

const eventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.string(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  location: z.string(),
  isVirtual: z.boolean().optional(),
  meetingUrl: z.string().optional(),
  capacity: z.number().int().optional(),
});

const registrationSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

// @route   GET /api/v1/events
// @desc    Get all events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: { select: { registrations: true } },
      },
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/events
// @desc    Create an event
// @access  Private (Admin/Staff)
router.post('/', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = eventSchema.parse(req.body);
    const event = await eventService.createEvent({
      ...data,
      startDate: data.startDate, // Explicitly pass to satisfy TS
      organizerId: req.user?.id,
    });
    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/v1/events/:id
// @desc    Get event details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await eventService.getEventDetails(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/events/:id/register
// @desc    Register for an event
// @access  Public/Private
router.post('/:id/register', async (req: AuthRequest, res) => {
  try {
    const data = registrationSchema.parse(req.body);
    const registration = await eventService.registerForEvent({
      eventId: req.params.id,
      userId: req.user?.id,
      ...data,
    });
    res.status(201).json(registration);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PATCH /api/v1/events/registrations/:id/attendance
// @desc    Mark attendance
// @access  Private (Admin/Staff)
router.patch('/registrations/:id/attendance', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ATTENDED', 'NO_SHOW'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const registration = await eventService.markAttendance(req.params.id, status as 'ATTENDED' | 'NO_SHOW');
    res.json(registration);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
