import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';

const router = express.Router();

const pageSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  content: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

// @route   GET /api/v1/cms/pages
// @desc    Get all pages (Admin/Staff)
// @access  Private
router.get('/pages', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const pages = await prisma.cmsPage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { displayName: true, email: true } } }
    });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/cms/pages
// @desc    Create a new page
// @access  Private (Admin/Staff)
router.post('/pages', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = pageSchema.parse(req.body);
    const authorId = req.user?.id;

    if (!authorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingPage = await prisma.cmsPage.findUnique({ where: { slug: data.slug } });
    if (existingPage) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    const page = await prisma.cmsPage.create({
      data: {
        ...data,
        authorId,
        status: data.status || 'DRAFT',
      }
    });

    res.status(201).json(page);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/v1/cms/pages/:id
// @desc    Update a page
// @access  Private (Admin/Staff)
router.put('/pages/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = pageSchema.partial().parse(req.body);

    const page = await prisma.cmsPage.findUnique({ where: { id: req.params.id } });
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (data.slug && data.slug !== page.slug) {
      const existingPage = await prisma.cmsPage.findUnique({ where: { slug: data.slug } });
      if (existingPage) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
    }

    const updatedPage = await prisma.cmsPage.update({
      where: { id: req.params.id },
      data
    });

    res.json(updatedPage);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/v1/cms/pages/:id
// @desc    Delete a page
// @access  Private (Admin)
router.delete('/pages/:id', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const page = await prisma.cmsPage.findUnique({ where: { id: req.params.id } });
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    await prisma.cmsPage.delete({ where: { id: req.params.id } });
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
