import { Router } from 'express';
import { z } from 'zod';
import { grievanceService } from '../services/grievance.service';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { checkPermission } from './middleware/permissions';
import { permissionService } from '../services/permission.service';
import prisma from '../lib/prisma';

const router = Router();

// --- Validation Schemas ---
const grievanceSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  categoryId: z.string().uuid(),
  orgUnitId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

const assignmentSchema = z.object({
  userId: z.string().uuid(),
  decisionNote: z.string().max(300).optional(),
  note: z.string().max(300).optional(),
});

const responseSchema = z.object({
  content: z.string().min(1),
  isInternal: z.boolean().optional(),
});

// --- Routes ---

// Categories
router.get('/categories', authenticate, async (req, res) => {
  try {
    const categories = await grievanceService.getCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/staff', authenticate, checkPermission('GRIEVANCES', 'VIEW'), async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] } },
      select: { id: true, displayName: true, email: true, role: true }
    });
    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', authenticate, checkPermission('GRIEVANCES', 'CREATE'), async (req, res) => {
  try {
    const data = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      slaHours: z.number().int().optional(),
    }).parse(req.body);
    const category = await grievanceService.createCategory(data);
    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Grievances
router.get('/', authenticate, checkPermission('GRIEVANCES', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.priority) filters.priority = req.query.priority as string;
    if (req.query.orgUnitId) filters.orgUnitId = req.query.orgUnitId as string;
    if (req.query.reporterId) filters.reporterId = req.query.reporterId as string;

    // Hierarchy Scope Enforcement
    if (req.user?.role !== 'PUBLIC') {
      const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
      filters.orgUnitIds = accessibleUnitIds;
    }

    // Confidentiality: Non-admin/staff can only see their own grievances
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'STAFF') {
      filters.reporterId = req.user?.id;
    }

    let grievances = await grievanceService.getGrievances(filters);
    
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'STAFF') {
      grievances = grievances.map(g => ({
        ...g,
        responses: g.responses?.filter(r => !r.isInternal)
      }));
    }

    res.json(grievances);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, checkPermission('GRIEVANCES', 'CREATE', (req) => req.body.orgUnitId), async (req: AuthRequest, res) => {
  try {
    const data = grievanceSchema.parse(req.body);
    const grievance = await grievanceService.createGrievance({
      ...data,
      reporterId: req.user?.id as string,
    });
    res.status(201).json(grievance);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Assignments
router.post('/:id/assign', authenticate, checkPermission('GRIEVANCES', 'UPDATE', async (req) => {
  const grievance = await prisma.grievance.findUnique({ where: { id: req.params.id } });
  return grievance?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
  try {
    const { userId, decisionNote, note } = assignmentSchema.parse(req.body);
    const assignment = await grievanceService.assignGrievance(
      req.params.id,
      userId,
      req.user?.id as string,
      decisionNote || note
    );
    res.json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Responses
router.post('/:id/responses', authenticate, checkPermission('GRIEVANCES', 'UPDATE', async (req) => {
  const grievance = await prisma.grievance.findUnique({ where: { id: req.params.id } });
  return grievance?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
  try {
    const data = responseSchema.parse(req.body);
    
    // Confidentiality: Check if user is allowed to respond
    // (Admin, Staff, or the original reporter)
    const grievance = await prisma.grievance.findUnique({ where: { id: req.params.id } });
    if (!grievance) return res.status(404).json({ error: 'Grievance not found' });
    
    const isReporter = grievance.reporterId === req.user?.id;
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'STAFF';
    
    if (!isReporter && !isStaff) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const response = await grievanceService.addResponse({
      grievanceId: req.params.id,
      userId: req.user?.id as string,
      ...data,
    });
    res.status(201).json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actions
router.post('/:id/resolve', authenticate, checkPermission('GRIEVANCES', 'UPDATE', async (req) => {
  const grievance = await prisma.grievance.findUnique({ where: { id: req.params.id } });
  return grievance?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
  try {
    const { note, decisionNote } = req.body;
    const grievance = await grievanceService.resolveGrievance(req.params.id, req.user?.id as string, decisionNote || note);
    res.json(grievance);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/escalate', authenticate, checkPermission('GRIEVANCES', 'ESCALATE', async (req) => {
  const grievance = await prisma.grievance.findUnique({ where: { id: req.params.id } });
  return grievance?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
  try {
    const { note, decisionNote } = req.body;
    const grievance = await grievanceService.escalateGrievance(req.params.id, req.user?.id as string, decisionNote || note);
    res.json(grievance);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
