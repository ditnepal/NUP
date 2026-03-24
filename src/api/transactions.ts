import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';

const router = express.Router();

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.enum(['DONATION', 'MEMBERSHIP_FEE', 'RENEWAL_FEE', 'EVENT_TICKET', 'MERCHANDISE', 'CAMPAIGN_EXPENSE', 'OFFICE_EXPENSE', 'SALARY', 'OTHER']),
  amount: z.number().positive(),
  description: z.string(),
  date: z.string().datetime().optional(),
});

// @route   GET /api/v1/transactions
// @desc    Get all transactions
// @access  Private (Admin/Finance)
router.get('/', authenticate, authorize(['ADMIN', 'FINANCE_OFFICER']), async (req: AuthRequest, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/transactions
// @desc    Create a new transaction
// @access  Private (Admin/Finance)
router.post('/', authenticate, authorize(['ADMIN', 'FINANCE_OFFICER']), async (req: AuthRequest, res) => {
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

export default router;
