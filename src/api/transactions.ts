import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { checkPermission } from './middleware/permissions';
import { permissionService } from '../services/permission.service';
import { z } from 'zod';

const router = express.Router();

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.enum(['DONATION', 'MEMBERSHIP_FEE', 'RENEWAL_FEE', 'EVENT_TICKET', 'MERCHANDISE', 'CAMPAIGN_EXPENSE', 'OFFICE_EXPENSE', 'SALARY', 'OTHER']),
  amount: z.number().positive(),
  description: z.string(),
  date: z.string().datetime().optional(),
  orgUnitId: z.string().uuid().optional(),
});

// @route   GET /api/v1/transactions
// @desc    Get all transactions
// @access  Private (Admin/Finance)
router.get('/', authenticate, checkPermission('FINANCE', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    const where: any = {};
    if (accessibleUnitIds) {
      where.orgUnitId = { in: accessibleUnitIds };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        recordedBy: { select: { displayName: true } },
        reviewedBy: { select: { displayName: true } },
        donation: {
          include: {
            donor: { select: { fullName: true } },
            campaign: { select: { title: true } },
          }
        },
        member: { select: { fullName: true } },
        renewalRequest: { select: { id: true } },
      }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/transactions
// @desc    Create a new transaction
// @access  Private (Admin/Finance)
router.post('/', authenticate, checkPermission('FINANCE', 'CREATE', (req) => req.body.orgUnitId), async (req: AuthRequest, res) => {
  try {
    const data = transactionSchema.parse(req.body);
    const recordedById = req.user?.id;

    if (!recordedById) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        recordedById,
        date: data.date ? new Date(data.date) : new Date(),
        orgUnitId: data.orgUnitId,
      }
    });

    res.status(201).json(transaction);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/v1/transactions/:id/note
// @desc    Update reconciliation note
// @access  Private (Admin/Finance)
router.patch('/:id/note', authenticate, checkPermission('FINANCE', 'UPDATE', async (req) => {
  const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } });
  return transaction?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
  try {
    const { note } = req.body;
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { reconciliationNote: note }
    });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
