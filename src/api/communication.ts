import express from 'express';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { communicationService } from '../services/communication.service';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = express.Router();

const templateSchema = z.object({
  name: z.string().min(2),
  subject: z.string().optional(),
  body: z.string().min(10),
  type: z.enum(['SMS', 'EMAIL', 'PUSH', 'IN_APP']),
  category: z.enum(['TRANSACTIONAL', 'MARKETING', 'ALERT']),
});

const campaignSchema = z.object({
  name: z.string().min(2),
  templateId: z.string().uuid(),
  segmentId: z.string().uuid().optional(),
  scheduledAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

const segmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  criteria: z.string(), // JSON string
});

// @route   GET /api/v1/communication/templates
// @desc    Get all communication templates
// @access  Private (Admin/Staff)
router.get('/templates', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const templates = await prisma.communicationTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/communication/templates
// @desc    Create a communication template
// @access  Private (Admin/Staff)
router.post('/templates', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = templateSchema.parse(req.body);
    const template = await prisma.communicationTemplate.create({ data });
    res.status(201).json(template);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/v1/communication/segments
// @desc    Get all audience segments
// @access  Private (Admin/Staff)
router.get('/segments', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const segments = await prisma.audienceSegment.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(segments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/communication/segments
// @desc    Create an audience segment
// @access  Private (Admin/Staff)
router.post('/segments', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = segmentSchema.parse(req.body);
    const segment = await prisma.audienceSegment.create({ data });
    res.status(201).json(segment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/v1/communication/campaigns
// @desc    Get all communication campaigns
// @access  Private (Admin/Staff)
router.get('/campaigns', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const campaigns = await prisma.communicationCampaign.findMany({
      include: { template: true, segment: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/communication/campaigns
// @desc    Create a communication campaign
// @access  Private (Admin/Staff)
router.post('/campaigns', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = campaignSchema.parse(req.body);
    const campaign = await prisma.communicationCampaign.create({ data });
    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/communication/campaigns/:id/broadcast
// @desc    Broadcast a campaign
// @access  Private (Admin/Staff)
router.post('/campaigns/:id/broadcast', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const result = await communicationService.broadcastCampaign(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/v1/communication/delivery-logs
// @desc    Get delivery logs
// @access  Private (Admin/Staff)
router.get('/delivery-logs', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const logs = await prisma.deliveryLog.findMany({
      include: { campaign: true, user: true },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const noticeSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(5),
  audience: z.enum(['PUBLIC', 'MEMBERS']),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  isPinned: z.boolean().optional(),
  publishAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  expireAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  attachmentUrl: z.string().optional(),
  externalUrl: z.string().optional(),
});

// @route   GET /api/v1/communication/notices
// @desc    Get all notices
// @access  Private (Admin/Staff)
router.get('/notices', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(notices);
  } catch (error: any) {
    console.error('[API ERROR] /notices:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   POST /api/v1/communication/notices
// @desc    Create a notice
// @access  Private (Admin/Staff)
router.post('/notices', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = noticeSchema.parse(req.body);
    const notice = await prisma.notice.create({ 
      data: { ...data, authorId: req.user!.id } 
    });
    res.status(201).json(notice);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PUT /api/v1/communication/notices/:id
// @desc    Update a notice
// @access  Private (Admin/Staff)
router.put('/notices/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = noticeSchema.partial().parse(req.body);
    const notice = await prisma.notice.update({
      where: { id: req.params.id },
      data,
    });
    res.json(notice);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/v1/communication/notices/public
// @desc    Get all public notices
// @access  Public
router.get('/notices/public', async (req, res) => {
  try {
    const notices = await prisma.notice.findMany({
      where: {
        status: 'PUBLISHED',
        audience: 'PUBLIC',
        publishAt: { lte: new Date() },
        OR: [
          { expireAt: null },
          { expireAt: { gte: new Date() } }
        ]
      },
      orderBy: [{ isPinned: 'desc' }, { publishAt: 'desc' }],
    });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/communication/notices/members
// @desc    Get all member notices
// @access  Private (Member/Admin/Staff)
router.get('/notices/members', authenticate, async (req: AuthRequest, res) => {
  try {
    const notices = await prisma.notice.findMany({
      where: {
        status: 'PUBLISHED',
        audience: 'MEMBERS',
        publishAt: { lte: new Date() },
        OR: [
          { expireAt: null },
          { expireAt: { gte: new Date() } }
        ]
      },
      orderBy: [{ isPinned: 'desc' }, { publishAt: 'desc' }],
    });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/v1/communication/notices/:id
// @desc    Delete a notice
// @access  Private (Admin/Staff)
router.delete('/notices/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    await prisma.notice.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Notice deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
