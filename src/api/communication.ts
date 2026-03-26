import express from 'express';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { checkPermission } from './middleware/permissions';
import { permissionService } from '../services/permission.service';
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
  orgUnitId: z.string().uuid().optional(),
});

const campaignSchema = z.object({
  name: z.string().min(2),
  templateId: z.string().uuid(),
  segmentId: z.string().uuid().optional().or(z.literal('')),
  scheduledAt: z.string().optional().or(z.literal('')),
  orgUnitId: z.string().uuid().optional(),
}).transform(data => ({
  ...data,
  segmentId: data.segmentId === '' ? null : data.segmentId,
  scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
}));

const segmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  criteria: z.string(), // JSON string
  orgUnitId: z.string().uuid().optional(),
});

// @route   GET /api/v1/communication/templates
// @desc    Get all communication templates
// @access  Private (Admin/Staff)
router.get('/templates', authenticate, checkPermission('COMMUNICATION', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!.id);
    const templates = await prisma.communicationTemplate.findMany({
      where: {
        OR: [
          { orgUnitId: { in: accessibleUnitIds } },
          { orgUnitId: null } // Global templates
        ]
      },
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
router.post('/templates', authenticate, checkPermission('COMMUNICATION', 'CREATE'), async (req: AuthRequest, res) => {
  try {
    const data = templateSchema.parse(req.body);
    
    // Default to user's primary org unit if not provided
    if (!data.orgUnitId) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (user?.orgUnitId) {
        data.orgUnitId = user.orgUnitId;
      }
    } else {
      // Validate provided orgUnitId is within scope
      const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!.id);
      if (!accessibleUnitIds.includes(data.orgUnitId)) {
        return res.status(403).json({ error: 'Cannot create template for an organization unit outside your scope' });
      }
    }

    const template = await prisma.communicationTemplate.create({ data });
    res.status(201).json(template);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PUT /api/v1/communication/templates/:id
// @desc    Update a communication template
// @access  Private (Admin/Staff)
router.put('/templates/:id', authenticate, checkPermission('COMMUNICATION', 'UPDATE', async (req) => {
  const template = await prisma.communicationTemplate.findUnique({ where: { id: req.params.id } });
  return template?.orgUnitId || null;
}), async (req, res) => {
  try {
    const data = templateSchema.partial().parse(req.body);
    const template = await prisma.communicationTemplate.update({
      where: { id: req.params.id },
      data,
    });
    res.json(template);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   DELETE /api/v1/communication/templates/:id
// @desc    Delete a communication template
// @access  Private (Admin/Staff)
router.delete('/templates/:id', authenticate, checkPermission('COMMUNICATION', 'DELETE', async (req) => {
  const template = await prisma.communicationTemplate.findUnique({ where: { id: req.params.id } });
  return template?.orgUnitId || null;
}), async (req, res) => {
  try {
    await prisma.communicationTemplate.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/v1/communication/segments
// @desc    Get all audience segments
// @access  Private (Admin/Staff)
router.get('/segments', authenticate, checkPermission('COMMUNICATION', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!.id);
    const segments = await prisma.audienceSegment.findMany({
      where: {
        OR: [
          { orgUnitId: { in: accessibleUnitIds } },
          { orgUnitId: null }
        ]
      },
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
router.post('/segments', authenticate, checkPermission('COMMUNICATION', 'CREATE'), async (req: AuthRequest, res) => {
  try {
    const data = segmentSchema.parse(req.body);
    
    if (!data.orgUnitId) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (user?.orgUnitId) {
        data.orgUnitId = user.orgUnitId;
      }
    } else {
      const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!.id);
      if (!accessibleUnitIds.includes(data.orgUnitId)) {
        return res.status(403).json({ error: 'Cannot create segment for an organization unit outside your scope' });
      }
    }

    const segment = await prisma.audienceSegment.create({ data });
    res.status(201).json(segment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PUT /api/v1/communication/segments/:id
// @desc    Update an audience segment
// @access  Private (Admin/Staff)
router.put('/segments/:id', authenticate, checkPermission('COMMUNICATION', 'UPDATE', async (req) => {
  const segment = await prisma.audienceSegment.findUnique({ where: { id: req.params.id } });
  return segment?.orgUnitId || null;
}), async (req, res) => {
  try {
    const data = segmentSchema.partial().parse(req.body);
    const segment = await prisma.audienceSegment.update({
      where: { id: req.params.id },
      data,
    });
    res.json(segment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   DELETE /api/v1/communication/segments/:id
// @desc    Delete an audience segment
// @access  Private (Admin/Staff)
router.delete('/segments/:id', authenticate, checkPermission('COMMUNICATION', 'DELETE', async (req) => {
  const segment = await prisma.audienceSegment.findUnique({ where: { id: req.params.id } });
  return segment?.orgUnitId || null;
}), async (req, res) => {
  try {
    await prisma.audienceSegment.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Segment deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/v1/communication/campaigns
// @desc    Get all communication campaigns
// @access  Private (Admin/Staff)
router.get('/campaigns', authenticate, checkPermission('COMMUNICATION', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!.id);
    const campaigns = await prisma.communicationCampaign.findMany({
      where: {
        OR: [
          { orgUnitId: { in: accessibleUnitIds } },
          { orgUnitId: null }
        ]
      },
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
router.post('/campaigns', authenticate, checkPermission('COMMUNICATION', 'CREATE'), async (req: AuthRequest, res) => {
  try {
    const data = campaignSchema.parse(req.body);
    
    if (!data.orgUnitId) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (user?.orgUnitId) {
        data.orgUnitId = user.orgUnitId;
      }
    } else {
      const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!.id);
      if (!accessibleUnitIds.includes(data.orgUnitId)) {
        return res.status(403).json({ error: 'Cannot create campaign for an organization unit outside your scope' });
      }
    }

    const campaign = await prisma.communicationCampaign.create({ data });
    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PUT /api/v1/communication/campaigns/:id
// @desc    Update a communication campaign
// @access  Private (Admin/Staff)
router.put('/campaigns/:id', authenticate, checkPermission('COMMUNICATION', 'UPDATE', async (req) => {
  const campaign = await prisma.communicationCampaign.findUnique({ where: { id: req.params.id } });
  return campaign?.orgUnitId || null;
}), async (req, res) => {
  try {
    const data = campaignSchema.parse(req.body);
    const campaign = await prisma.communicationCampaign.update({
      where: { id: req.params.id },
      data,
    });
    res.json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   DELETE /api/v1/communication/campaigns/:id
// @desc    Delete a communication campaign
// @access  Private (Admin/Staff)
router.delete('/campaigns/:id', authenticate, checkPermission('COMMUNICATION', 'DELETE', async (req) => {
  const campaign = await prisma.communicationCampaign.findUnique({ where: { id: req.params.id } });
  return campaign?.orgUnitId || null;
}), async (req, res) => {
  try {
    await prisma.communicationCampaign.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/communication/campaigns/:id/broadcast
// @desc    Broadcast a campaign
// @access  Private (Admin/Staff)
router.post('/campaigns/:id/broadcast', authenticate, checkPermission('COMMUNICATION', 'APPROVE', async (req) => {
  const campaign = await prisma.communicationCampaign.findUnique({ where: { id: req.params.id } });
  return campaign?.orgUnitId || null;
}), async (req, res) => {
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
router.get('/delivery-logs', authenticate, checkPermission('COMMUNICATION', 'VIEW'), async (req, res) => {
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
  audience: z.enum(['PUBLIC', 'MEMBERS', 'STAFF']),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  isPinned: z.boolean().optional(),
  isPopup: z.boolean().optional(),
  displayType: z.enum(['BANNER', 'MODAL', 'TOAST']).optional(),
  targetPath: z.string().optional().nullable(),
  publishAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  expireAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  attachmentUrl: z.string().optional(),
  externalUrl: z.string().optional(),
  orgUnitId: z.string().uuid().optional(),
});

// @route   GET /api/v1/communication/notices
// @desc    Get all notices
// @access  Private (Admin/Staff)
router.get('/notices', authenticate, checkPermission('NOTICE_POPUP', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!.id);
    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { orgUnitId: { in: accessibleUnitIds } },
          { orgUnitId: null }
        ]
      },
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
router.post('/notices', authenticate, checkPermission('NOTICE_POPUP', 'CREATE'), async (req: AuthRequest, res) => {
  try {
    const data = noticeSchema.parse(req.body);
    
    if (!data.orgUnitId) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (user?.orgUnitId) {
        data.orgUnitId = user.orgUnitId;
      }
    } else {
      const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!.id);
      if (!accessibleUnitIds.includes(data.orgUnitId)) {
        return res.status(403).json({ error: 'Cannot create notice for an organization unit outside your scope' });
      }
    }

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
router.put('/notices/:id', authenticate, checkPermission('NOTICE_POPUP', 'UPDATE', async (req) => {
  const notice = await prisma.notice.findUnique({ where: { id: req.params.id } });
  return notice?.orgUnitId || null;
}), async (req: AuthRequest, res) => {
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
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!.id);
    const notices = await prisma.notice.findMany({
      where: {
        status: 'PUBLISHED',
        audience: 'MEMBERS',
        publishAt: { lte: new Date() },
        AND: [
          {
            OR: [
              { expireAt: null },
              { expireAt: { gte: new Date() } }
            ]
          },
          {
            OR: [
              { orgUnitId: { in: accessibleUnitIds } },
              { orgUnitId: null }
            ]
          }
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
router.delete('/notices/:id', authenticate, checkPermission('NOTICE_POPUP', 'DELETE', async (req) => {
  const notice = await prisma.notice.findUnique({ where: { id: req.params.id } });
  return notice?.orgUnitId || null;
}), async (req, res) => {
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
