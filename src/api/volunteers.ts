import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';
import { volunteerService } from '../services/volunteer.service';
import { auditService } from '../services/audit.service';

const router = express.Router();

// @route   GET /api/v1/volunteers/me
// @desc    Get current user's volunteer status
// @access  Private
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const volunteer = await volunteerService.getByUserId(req.user!.id);
    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const volunteerSchema = z.object({
  memberId: z.string().optional(),
  userId: z.string().optional(),
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  skills: z.string(),
  availability: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
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
    const volunteer = await volunteerService.register({
      ...data,
      userId: req.user!.id
    });
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

// @route   POST /api/v1/volunteers/apply
// @desc    Apply for volunteering
// @access  Public
router.post('/apply', async (req, res) => {
  try {
    const data = volunteerSchema.pick({ fullName: true, email: true, phone: true, skills: true, availability: true }).parse(req.body);
    const application = await volunteerService.apply({
      ...data,
      email: data.email || '',
      phone: data.phone || '',
      availability: data.availability || ''
    });
    res.status(201).json(application);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/v1/volunteers/applications
// @desc    Get volunteer applications
// @access  Private (Admin)
router.get('/applications', authenticate, authorize(['ADMIN', 'VOLUNTEER_MANAGER']), async (req, res) => {
  try {
    const applications = await volunteerService.getApplications();
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/volunteers/:id/approve
// @desc    Approve volunteer application
// @access  Private (Admin)
router.post('/:id/approve', authenticate, authorize(['ADMIN', 'VOLUNTEER_MANAGER']), async (req, res) => {
  try {
    const volunteer = await volunteerService.approveApplication(req.params.id);
    res.json(volunteer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/volunteers/:id/evaluate
// @desc    Evaluate volunteer performance
// @access  Private (Admin)
router.post('/:id/evaluate', authenticate, authorize(['ADMIN', 'VOLUNTEER_MANAGER']), async (req, res) => {
  try {
    const performance = await volunteerService.evaluatePerformance({ volunteerId: req.params.id, ...req.body });
    res.status(201).json(performance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/v1/volunteers/:id/recognize
// @desc    Recognize volunteer
// @access  Private (Admin)
router.post('/:id/recognize', authenticate, authorize(['ADMIN', 'VOLUNTEER_MANAGER']), async (req, res) => {
  try {
    const recognition = await volunteerService.recognize({ volunteerId: req.params.id, ...req.body });
    res.status(201).json(recognition);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/volunteers/:id
router.get('/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const volunteer = await volunteerService.getById(req.params.id);
    if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });
    res.json(volunteer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/volunteers/:id
router.put('/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = volunteerSchema.partial().parse(req.body);
    const volunteer = await volunteerService.update(req.params.id, data as any);
    res.json(volunteer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/v1/volunteers/:id
router.delete('/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    await volunteerService.delete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
