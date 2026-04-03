import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { authenticate, AuthRequest, authorize } from './middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-nup-os-2026';

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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
  phoneNumber: z.string().optional(),
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user & get token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let isTemp = false;
    let hashToCompare = user.passwordHash;
    if (user.passwordHash.startsWith('TEMP_')) {
      isTemp = true;
      hashToCompare = user.passwordHash.replace('TEMP_', '');
    }

    const isMatch = await bcrypt.compare(password, hashToCompare);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, requirePasswordChange: isTemp } });
  } catch (error: any) {
    console.error('[AUTH LOGIN ERROR]', error.code, error.meta, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.issues });
    }
    res.status(500).json({ error: 'Server error', details: error instanceof Error ? error.message : String(error) });
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

// @route   POST /api/v1/auth/change-password
// @desc    Change user password (used for forced change on first login)
// @access  Private
router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      return res.status(404).json({ error: 'User not found' });
    }

    let isTemp = false;
    let hashToCompare = user.passwordHash;
    if (user.passwordHash.startsWith('TEMP_')) {
      isTemp = true;
      hashToCompare = user.passwordHash.replace('TEMP_', '');
    }

    const isMatch = await bcrypt.compare(currentPassword, hashToCompare);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('[AUTH CHANGE PASSWORD ERROR]', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/auth/public-register
// @desc    Register a new public user
// @access  Public
router.post('/public-register', async (req, res) => {
  try {
    const { email, password, displayName, phoneNumber } = registerSchema.parse(req.body);

    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        phoneNumber,
        role: 'PUBLIC', // Assign PUBLIC role
        isActive: true, // Allow immediate login for public users
      },
    });

    const payload = { id: user.id, email: user.email, role: user.role };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            requirePasswordChange: false,
          },
        });
      }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/auth/register
// @desc    Register a new user (admin only)
// @access  Private (Admin)
router.post('/register', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { email, password, displayName, phoneNumber } = registerSchema.parse(req.body);

    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        phoneNumber,
        role: req.body.role || 'MEMBER',
      },
    });

    res.status(201).json({ message: 'User created successfully', user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/auth/me
// @desc    Get current logged in user profile
// @access  Private
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { id: true, email: true, displayName: true, role: true, phoneNumber: true, isActive: true, createdAt: true, passwordHash: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { passwordHash, ...userWithoutPassword } = user;
    const requirePasswordChange = passwordHash.startsWith('TEMP_');
    
    res.json({ ...userWithoutPassword, requirePasswordChange });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/users/verify-me
// @desc    Self-verify a public user
// @access  Private (Public User)
router.post('/verify-me', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'PUBLIC') {
      return res.status(400).json({ error: 'Only public users can self-verify' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { isActive: true },
      select: { id: true, email: true, isActive: true }
    });

    await logAudit(req.user.id, 'SELF_VERIFY', `User ${updatedUser.email} self-verified.`, req.ip || '0.0.0.0');

    res.json(updatedUser);
  } catch (error) {
    console.error('[USER SELF-VERIFY ERROR]', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
