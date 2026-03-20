import express from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = express.Router();

const issueSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.string(),
  province: z.string().optional(),
  district: z.string().optional(),
  localLevel: z.string().optional(),
  contactInfo: z.string().optional(),
});

// @route   GET /api/v1/public/pages/:slug
// @desc    Get published page by slug
// @access  Public
router.get('/pages/:slug', async (req, res) => {
  try {
    const page = await prisma.cmsPage.findUnique({
      where: { slug: req.params.slug },
      select: { title: true, content: true, seoTitle: true, seoDescription: true, status: true, updatedAt: true }
    });

    if (!page || page.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/public/events
// @desc    Get upcoming public events
// @access  Public
router.get('/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { type: 'PUBLIC', date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 10,
      select: { id: true, title: true, description: true, date: true, location: true }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/public/issues
// @desc    Submit a public issue/grievance
// @access  Public
router.post('/issues', async (req, res) => {
  try {
    const data = issueSchema.parse(req.body);

    const issue = await prisma.issue.create({
      data: {
        ...data,
        status: 'OPEN',
        priority: 'MEDIUM',
      }
    });

    res.status(201).json({ message: 'Issue submitted successfully', issueId: issue.id });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
