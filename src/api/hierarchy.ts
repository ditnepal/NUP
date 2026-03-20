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
  code: z.string().optional(),
  parentId: z.string().optional(),
});

// @route   GET /api/v1/hierarchy
// @desc    Get full hierarchy tree (Admin only)
// @access  Private (Admin)
router.get('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const units = await prisma.organizationUnit.findMany({
      include: { children: true }
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/hierarchy/scoped
// @desc    Get hierarchy units scoped to the current user
// @access  Private
router.get('/scoped', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.orgUnitId && req.user?.role !== 'ADMIN') {
      return res.json([]);
    }

    if (req.user?.role === 'ADMIN') {
      const units = await prisma.organizationUnit.findMany({
        where: { parentId: null },
        include: { children: true }
      });
      return res.json(units);
    }

    const unit = await prisma.organizationUnit.findUnique({
      where: { id: req.user?.orgUnitId },
      include: { children: true }
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

export default router;
