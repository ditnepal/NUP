import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';
import { officeService } from '../services/office.service';
import { auditService } from '../services/audit.service';

const router = express.Router();

const officeSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['HEADQUARTERS', 'REGIONAL', 'CONTACT_POINT']),
  orgUnitId: z.string(),
  address: z.string(),
  contactNumber: z.string().optional(),
  email: z.string().email().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// @route   GET /api/v1/offices
// @desc    Get offices (Scoped)
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { unitId } = req.query;
    if (unitId) {
      const offices = await officeService.getOfficesByUnit(unitId as string);
      return res.json(offices);
    }

    // If no unitId, return all offices (Admin only)
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const offices = await prisma.office.findMany({
      include: { orgUnit: true }
    });
    res.json(offices);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/offices
// @desc    Create a new office
// @access  Private (Admin)
router.post('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const data = officeSchema.parse(req.body);
    const office = await officeService.createOffice(data);

    await auditService.log({
      action: 'OFFICE_CREATED',
      userId: req.user?.id,
      entityType: 'Office',
      entityId: office.id,
      details: office
    });

    res.status(201).json(office);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/offices/public/finder
// @desc    Public office finder
// @access  Public
router.get('/public/finder', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const offices = await officeService.findNearbyOffices(
      parseFloat(lat as string),
      parseFloat(lng as string),
      radius ? parseFloat(radius as string) : undefined
    );

    res.json(offices);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
