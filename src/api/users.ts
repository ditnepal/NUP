import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest, authorize } from './middleware/auth';
import { z } from 'zod';

const router = express.Router();

const updateScopeSchema = z.object({
  orgUnitId: z.string().nullable(),
  role: z.enum(['ADMIN', 'STAFF', 'MEMBER', 'FIELD_COORDINATOR', 'BOOTH_COORDINATOR', 'FINANCE_OFFICER']).optional(),
});

// @route   GET /api/v1/users
// @desc    Get all users with their org unit info
// @access  Private (Admin)
router.get('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { orgUnitId } = req.query;
    const users = await prisma.user.findMany({
      where: {
        ...(orgUnitId && { orgUnitId: orgUnitId as string })
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        orgUnitId: true,
        isActive: true,
        createdAt: true,
        orgUnit: {
          select: {
            id: true,
            name: true,
            level: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('[USERS GET ERROR]', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/v1/users/:id/scope
// @desc    Update user's organization unit scope and role
// @access  Private (Admin)
router.patch('/:id/scope', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { orgUnitId, role } = updateScopeSchema.parse(req.body);

    // Prevent self-demotion or self-unscoping if needed, but for now keep it simple
    // Actually, let's just allow it for admins.

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        orgUnitId,
        ...(role && { role }),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        orgUnitId: true,
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('[USER SCOPE UPDATE ERROR]', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
