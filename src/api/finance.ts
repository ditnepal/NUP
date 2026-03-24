import express from 'express';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { financeService } from '../services/finance.service';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = express.Router();

const campaignSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  fundraiserType: z.enum(['PARTY_FUND', 'CANDIDATE_FUND', 'CAUSE_FUND', 'RELIEF_FUND', 'PUBLIC_SUPPORT_FUND']).optional(),
  beneficiaryType: z.enum(['PARTY', 'CANDIDATE', 'PUBLIC', 'COMMUNITY']).optional(),
  candidateId: z.string().uuid().optional(),
  goalAmount: z.number().positive(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

const donationSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  amount: z.number().positive(),
  campaignId: z.string().uuid().optional(),
  paymentMethod: z.string(),
  referenceId: z.string(),
});

// @route   GET /api/v1/finance/campaigns
// @desc    Get all fundraising campaigns
// @access  Public
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await prisma.fundraisingCampaign.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: { select: { donations: true } },
      },
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/finance/campaigns
// @desc    Create a fundraising campaign
// @access  Private (Admin/Staff)
router.post('/campaigns', authenticate, authorize(['ADMIN', 'STAFF', 'FINANCE_OFFICER']), async (req: AuthRequest, res) => {
  try {
    const data = campaignSchema.parse(req.body);
    const campaign = await financeService.createFundraisingCampaign({
      ...data,
      startDate: data.startDate, // Explicitly pass to satisfy TS
      fundraiserType: data.fundraiserType || 'PARTY_FUND',
      beneficiaryType: data.beneficiaryType || 'PARTY',
      candidateId: data.candidateId,
    } as any);
    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/finance/donations/initiate
// @desc    Initiate a donation payment with a provider
// @access  Public
router.post('/donations/initiate', async (req, res) => {
  try {
    const { amount, paymentMethod, campaignId, fullName, email, phone, returnUrl } = req.body;
    
    if (!amount || !paymentMethod || !fullName || !email || !returnUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const purchaseOrderId = `DON_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const purchaseOrderName = campaignId ? `Donation for Campaign ${campaignId}` : 'General Donation';

    const result = await financeService.initiatePayment({
      amount,
      paymentMethod,
      purchaseOrderId,
      purchaseOrderName,
      customerInfo: { fullName, email, phone },
      returnUrl,
    });

    res.json({ ...result, purchaseOrderId });
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/finance/donations
// @desc    Process a donation
// @access  Public/Private
router.post('/donations', async (req: AuthRequest, res) => {
  try {
    const data = donationSchema.parse(req.body);
    
    // Check if this is a manual payment method to set isManual flag
    const integrations = await financeService.listPublicPaymentIntegrations('FUNDRAISER');
    const selectedMethod = integrations.find(i => i.provider === data.paymentMethod);
    const isManual = selectedMethod?.instructions ? true : false;

    const donation = await financeService.processDonation({
      donorInfo: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        isAnonymous: data.isAnonymous,
        userId: req.user?.id,
      },
      amount: data.amount,
      campaignId: data.campaignId,
      paymentMethod: data.paymentMethod,
      referenceId: data.referenceId,
      recordedById: req.user?.id,
      isManual,
    });
    res.status(201).json(donation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/finance/donations/:id/refund
// @desc    Refund a donation
// @access  Private (Admin/Staff)
router.post('/donations/:id/refund', authenticate, authorize(['ADMIN', 'STAFF', 'FINANCE_OFFICER']), async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason for refund is required' });
    const result = await financeService.processRefund(req.params.id, reason, req.user?.id!);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/v1/finance/analytics
// @desc    Get financial analytics
// @access  Private (Admin/Staff)
router.get('/analytics', authenticate, authorize(['ADMIN', 'STAFF', 'FINANCE_OFFICER']), async (req, res) => {
  try {
    const analytics = await financeService.getFinanceAnalytics();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/finance/transactions
// @desc    Get all transactions
// @access  Private (Admin/Staff)
router.get('/transactions', authenticate, authorize(['ADMIN', 'STAFF', 'FINANCE_OFFICER']), async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      include: {
        donation: { include: { donor: true, campaign: true } },
        member: true,
        renewalRequest: true,
        recordedBy: true,
      },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/finance/transactions/:id/verify
// @desc    Verify a pending transaction
// @access  Private (Admin/Staff)
router.post('/transactions/:id/verify', authenticate, authorize(['ADMIN', 'STAFF', 'FINANCE_OFFICER']), async (req: AuthRequest, res) => {
  try {
    const result = await financeService.verifyTransaction(req.params.id, req.user?.id!);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/finance/transactions/:id/reject
// @desc    Reject a pending transaction
// @access  Private (Admin/Staff)
router.post('/transactions/:id/reject', authenticate, authorize(['ADMIN', 'STAFF', 'FINANCE_OFFICER']), async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason for rejection is required' });
    const result = await financeService.rejectTransaction(req.params.id, reason, req.user?.id!);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const integrationSchema = z.object({
  provider: z.string(),
  displayName: z.string(),
  region: z.enum(['NEPAL', 'INDIA', 'INTERNATIONAL']),
  enabled: z.boolean().optional(),
  mode: z.enum(['TEST', 'LIVE']).optional(),
  sortOrder: z.number().int().optional(),
  supportedModules: z.array(z.string()),
  instructions: z.string().optional(),
  publicKey: z.string().optional(),
  secretRef: z.string().optional(),
  metadata: z.string().optional(),
});

// @route   GET /api/v1/finance/integrations/public
// @desc    Get public payment integrations (enabled only)
// @access  Public
router.get('/integrations/public', async (req, res) => {
  try {
    const module = req.query.module as string;
    const integrations = await financeService.listPublicPaymentIntegrations(module);
    res.json(integrations);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/finance/integrations
// @desc    Get all payment integrations
// @access  Private (Admin/Staff)
router.get('/integrations', authenticate, authorize(['ADMIN', 'STAFF', 'FINANCE_OFFICER']), async (req, res) => {
  try {
    const integrations = await financeService.listPaymentIntegrations();
    res.json(integrations);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/finance/integrations
// @desc    Create a payment integration
// @access  Private (Admin/Staff)
router.post('/integrations', authenticate, authorize(['ADMIN', 'STAFF', 'FINANCE_OFFICER']), async (req: AuthRequest, res) => {
  try {
    const data = integrationSchema.parse(req.body);
    const integration = await financeService.createPaymentIntegration(data);
    res.status(201).json(integration);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PATCH /api/v1/finance/integrations/:id
// @desc    Update a payment integration
// @access  Private (Admin/Staff)
router.patch('/integrations/:id', authenticate, authorize(['ADMIN', 'STAFF', 'FINANCE_OFFICER']), async (req: AuthRequest, res) => {
  try {
    const data = integrationSchema.partial().parse(req.body);
    const integration = await financeService.updatePaymentIntegration(req.params.id, data);
    res.json(integration);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   DELETE /api/v1/finance/integrations/:id
// @desc    Delete a payment integration
// @access  Private (Admin/Staff)
router.delete('/integrations/:id', authenticate, authorize(['ADMIN', 'STAFF', 'FINANCE_OFFICER']), async (req: AuthRequest, res) => {
  try {
    await financeService.deletePaymentIntegration(req.params.id);
    res.status(204).end();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
