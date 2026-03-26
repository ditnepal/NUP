import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { checkPermission } from './middleware/permissions';
import { permissionService } from '../services/permission.service';
import { z } from 'zod';

const router = express.Router();

const campaignSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(['ELECTION', 'MEMBERSHIP_DRIVE', 'AWARENESS', 'FUNDRAISING']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  targetAudience: z.string().optional(),
  budget: z.number().optional(),
  orgUnitId: z.string().uuid().optional(),
});

// @route   GET /api/v1/campaigns
// @desc    Get all campaigns
// @access  Private
router.get('/', authenticate, checkPermission('FUNDRAISING', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    const where: any = {};
    if (accessibleUnitIds) {
      where.orgUnitId = { in: accessibleUnitIds };
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/campaigns
// @desc    Create a new campaign
// @access  Private (Admin/Staff)
router.post('/', authenticate, checkPermission('FUNDRAISING', 'CREATE', (req) => req.body.orgUnitId), async (req: AuthRequest, res) => {
  try {
    const data = campaignSchema.parse(req.body);
    const managerId = req.user?.id;

    if (!managerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        managerId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'PLANNED',
        orgUnitId: data.orgUnitId,
      }
    });

    res.status(201).json(campaign);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
