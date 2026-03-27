import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest, authorize } from './middleware/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const router = express.Router();

const updateScopeSchema = z.object({
  orgUnitId: z.string().nullable(),
  role: z.enum(['ADMIN', 'STAFF', 'MEMBER', 'FIELD_COORDINATOR', 'BOOTH_COORDINATOR', 'FINANCE_OFFICER']).optional(),
  decisionNote: z.string().max(300).optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  phoneNumber: z.string().optional(),
  role: z.enum(['ADMIN', 'STAFF', 'MEMBER', 'FIELD_COORDINATOR', 'BOOTH_COORDINATOR', 'FINANCE_OFFICER']).default('MEMBER'),
  orgUnitId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
  decisionNote: z.string().max(300).optional(),
});

const resetPasswordSchema = z.object({
  decisionNote: z.string().max(300).optional(),
});

// Helper for audit logging
const logAudit = async (userId: string, action: string, details: string, ipAddress: string) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress,
      }
    });
  } catch (e) {
    console.error('[AUDIT LOG ERROR]', e);
  }
};

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
        phoneNumber: true,
        role: true,
        orgUnitId: true,
        isActive: true,
        createdAt: true,
        passwordHash: true,
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
    
    const mappedUsers = users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        requirePasswordChange: passwordHash.startsWith('TEMP_')
      };
    });
    
    res.json(mappedUsers);
  } catch (error) {
    console.error('[USERS GET ERROR]', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/users
// @desc    Create a new user
// @access  Private (Admin)
router.post('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const data = createUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = 'TEMP_' + await bcrypt.hash(tempPassword, salt);

    const user = await prisma.user.create({
      data: {
        ...data,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        orgUnitId: true,
        isActive: true,
      }
    });

    await logAudit(req.user!.id, 'CREATE_USER', `Created user ${user.email} (${user.id}) with role ${user.role}`, req.ip || '0.0.0.0');

    res.status(201).json({ user, tempPassword });
  } catch (error) {
    console.error('[USER CREATE ERROR]', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/v1/users/:id/scope
// @desc    Update user's organization unit scope and role
// @access  Private (Admin)
router.patch('/:id/scope', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { orgUnitId, role, decisionNote } = updateScopeSchema.parse(req.body);

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

    await logAudit(req.user!.id, 'UPDATE_USER_SCOPE', `Updated scope/role for user ${updatedUser.email} (${id}). Role: ${role || 'unchanged'}, OrgUnit: ${orgUnitId || 'none'}. Note: ${decisionNote || 'None'}`, req.ip || '0.0.0.0');

    res.json(updatedUser);
  } catch (error) {
    console.error('[USER SCOPE UPDATE ERROR]', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/v1/users/:id/status
// @desc    Activate or deactivate a user
// @access  Private (Admin)
router.patch('/:id/status', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { isActive, decisionNote } = updateStatusSchema.parse(req.body);

    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, isActive: true }
    });

    await logAudit(req.user!.id, 'UPDATE_USER_STATUS', `Set isActive=${isActive} for user ${updatedUser.email} (${id}). Note: ${decisionNote || 'None'}`, req.ip || '0.0.0.0');

    res.json(updatedUser);
  } catch (error) {
    console.error('[USER STATUS UPDATE ERROR]', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/users/:id/reset-password
// @desc    Reset a user's password to a temporary one
// @access  Private (Admin)
router.post('/:id/reset-password', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { decisionNote } = resetPasswordSchema.parse(req.body);

    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = 'TEMP_' + await bcrypt.hash(tempPassword, salt);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true, email: true }
    });

    await logAudit(req.user!.id, 'RESET_USER_PASSWORD', `Reset password for user ${updatedUser.email} (${id}). Note: ${decisionNote || 'None'}`, req.ip || '0.0.0.0');

    res.json({ message: 'Password reset successfully', tempPassword });
  } catch (error) {
    console.error('[USER PASSWORD RESET ERROR]', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
