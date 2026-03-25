import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';
import { hierarchyService } from '../services/hierarchy.service';
import { auditService } from '../services/audit.service';

const router = express.Router();

const unitSchema = z.object({
  name: z.string().min(2),
  level: z.enum(['NATIONAL', 'PROVINCE', 'DISTRICT', 'CONSTITUENCY', 'MUNICIPALITY', 'WARD', 'BOOTH']),
  code: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
});

const committeeSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const bearerSchema = z.object({
  fullName: z.string().min(2),
  position: z.string().min(2),
  userId: z.string().optional().nullable(),
  termStart: z.string().datetime(),
  termEnd: z.string().datetime().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

// @route   GET /api/v1/hierarchy
// @desc    Get full hierarchy tree (Admin or Scoped Staff)
// @access  Private
router.get('/', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const accessibleIds = await hierarchyService.getAccessibleUnitIds(req.user!);
    
    let units;
    if (accessibleIds === null) {
      // Admin: Get all units
      units = await prisma.organizationUnit.findMany({
        include: { 
          children: {
            orderBy: { sortOrder: 'asc' }
          },
          offices: true
        },
        orderBy: { sortOrder: 'asc' }
      });
    } else if (accessibleIds.length === 0) {
      // No access
      return res.json([]);
    } else {
      // Scoped access: Get only units in accessibleIds
      units = await prisma.organizationUnit.findMany({
        where: { id: { in: accessibleIds } },
        include: { 
          children: {
            orderBy: { sortOrder: 'asc' }
          },
          offices: true
        },
        orderBy: { sortOrder: 'asc' }
      });
    }
    
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/hierarchy/scoped
// @desc    Get hierarchy units scoped to the current user (tree format)
// @access  Private
router.get('/scoped', authenticate, async (req: AuthRequest, res) => {
  try {
    const accessibleIds = await hierarchyService.getAccessibleUnitIds(req.user!);

    if (accessibleIds === null) {
      // Admin: Get root units
      const units = await prisma.organizationUnit.findMany({
        where: { parentId: null },
        include: { 
          children: {
            orderBy: { sortOrder: 'asc' }
          },
          offices: true
        },
        orderBy: { sortOrder: 'asc' }
      });
      return res.json(units);
    }

    if (accessibleIds.length === 0) {
      return res.json([]);
    }

    // For scoped users, return their root unit (the one assigned to them)
    const unit = await prisma.organizationUnit.findUnique({
      where: { id: req.user?.orgUnitId },
      include: { 
        children: {
          orderBy: { sortOrder: 'asc' }
        },
        offices: true
      }
    });

    res.json(unit ? [unit] : []);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/hierarchy
// @desc    Create a new organization unit
// @access  Private (Admin)
router.post('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const data = unitSchema.parse(req.body);
    const unit = await prisma.organizationUnit.create({
      data
    });

    await auditService.log({
      action: 'HIERARCHY_UNIT_CREATED',
      userId: req.user?.id,
      entityType: 'OrganizationUnit',
      entityId: unit.id,
      details: unit
    });

    res.status(201).json(unit);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/v1/hierarchy/:id
// @desc    Update an organization unit
// @access  Private (Admin)
router.put('/:id', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const data = unitSchema.partial().parse(req.body);
    const unit = await hierarchyService.update(req.params.id, data);

    await auditService.log({
      action: 'HIERARCHY_UNIT_UPDATED',
      userId: req.user?.id,
      entityType: 'OrganizationUnit',
      entityId: unit.id,
      details: unit
    });

    res.json(unit);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// @route   DELETE /api/v1/hierarchy/:id
// @desc    Delete an organization unit
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    await hierarchyService.delete(req.params.id);

    await auditService.log({
      action: 'HIERARCHY_UNIT_DELETED',
      userId: req.user?.id,
      entityType: 'OrganizationUnit',
      entityId: req.params.id
    });

    res.json({ message: 'Unit deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Server error' });
  }
});

// --- Committee Endpoints ---

// @route   GET /api/v1/hierarchy/:unitId/committees
// @desc    Get committees for a unit
// @access  Private
router.get('/:unitId/committees', authenticate, async (req: AuthRequest, res) => {
  try {
    const committees = await prisma.committee.findMany({
      where: { orgUnitId: req.params.unitId },
      include: { bearers: { include: { user: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(committees);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/hierarchy/:unitId/committees
// @desc    Create a committee for a unit
// @access  Private (Admin)
router.post('/:unitId/committees', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const data = committeeSchema.parse(req.body);
    const committee = await prisma.committee.create({
      data: {
        ...data,
        orgUnitId: req.params.unitId
      }
    });

    await auditService.log({
      action: 'COMMITTEE_CREATED',
      userId: req.user?.id,
      entityType: 'Committee',
      entityId: committee.id,
      details: committee
    });

    res.status(201).json(committee);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/v1/hierarchy/committees/:id
// @desc    Update a committee
// @access  Private (Admin)
router.put('/committees/:id', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const data = committeeSchema.partial().parse(req.body);
    const committee = await prisma.committee.update({
      where: { id: req.params.id },
      data
    });

    await auditService.log({
      action: 'COMMITTEE_UPDATED',
      userId: req.user?.id,
      entityType: 'Committee',
      entityId: committee.id,
      details: committee
    });

    res.json(committee);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Office Bearer Endpoints ---

// @route   POST /api/v1/hierarchy/committees/:committeeId/bearers
// @desc    Add an office bearer to a committee
// @access  Private (Admin)
router.post('/committees/:committeeId/bearers', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const data = bearerSchema.parse(req.body);
    const bearer = await prisma.officeBearer.create({
      data: {
        ...data,
        committeeId: req.params.committeeId,
        termStart: new Date(data.termStart),
        termEnd: data.termEnd ? new Date(data.termEnd) : null
      }
    });

    await auditService.log({
      action: 'OFFICE_BEARER_ADDED',
      userId: req.user?.id,
      entityType: 'OfficeBearer',
      entityId: bearer.id,
      details: bearer
    });

    res.status(201).json(bearer);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/v1/hierarchy/bearers/:id
// @desc    Update an office bearer
// @access  Private (Admin)
router.put('/bearers/:id', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const data = bearerSchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.termStart) updateData.termStart = new Date(data.termStart);
    if (data.termEnd) updateData.termEnd = new Date(data.termEnd);

    const bearer = await prisma.officeBearer.update({
      where: { id: req.params.id },
      data: updateData
    });

    await auditService.log({
      action: 'OFFICE_BEARER_UPDATED',
      userId: req.user?.id,
      entityType: 'OfficeBearer',
      entityId: bearer.id,
      details: bearer
    });

    res.json(bearer);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
