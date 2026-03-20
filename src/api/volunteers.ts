import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';
import { volunteerService } from '../services/volunteer.service';
import { auditService } from '../services/audit.service';

const router = express.Router();

const volunteerSchema = z.object({
  memberId: z.string().optional(),
  userId: z.string().optional(),
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  skills: z.string(),
  availability: z.string().optional(),
});

const assignmentSchema = z.object({
  volunteerId: z.string(),
  campaignId: z.string().optional(),
  taskName: z.string().min(2),
  description: z.string().optional(),
});

const reportSchema = z.object({
  assignmentId: z.string(),
  content: z.string().min(10),
  hoursSpent: z.number().optional(),
});

// @route   GET /api/v1/volunteers
// @desc    Get volunteers
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const volunteers = await volunteerService.getActiveVolunteers();
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/volunteers
// @desc    Register as a volunteer
// @access  Private
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = volunteerSchema.parse(req.body);
    const volunteer = await volunteerService.register(data);
    res.status(201).json(volunteer);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/volunteers/assign
// @desc    Assign volunteer to a task
// @access  Private (Staff/Admin)
router.post('/assign', authenticate, authorize(['ADMIN', 'STAFF', 'FIELD_COORDINATOR']), async (req: AuthRequest, res) => {
  try {
    const data = assignmentSchema.parse(req.body);
    const assignment = await volunteerService.assign(data);
    res.status(201).json(assignment);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/volunteers/report
// @desc    Submit volunteer report
// @access  Private
router.post('/report', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = reportSchema.parse(req.body);
    const report = await volunteerService.submitReport(data);
    res.status(201).json(report);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
