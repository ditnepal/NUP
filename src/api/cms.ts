import express from 'express';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';
import { cmsAdminService } from '../services/cms-admin.service';
import prisma from '../lib/prisma';

const router = express.Router();

const pageSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2),
  title: z.string().min(2),
  content: z.string().min(10),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  language: z.enum(['en', 'ne']).optional(),
  isSystem: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  publishedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  decisionNote: z.string().optional(),
});

const postSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2),
  title: z.string().min(2),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  type: z.enum(['NEWS', 'PRESS_RELEASE', 'STATEMENT', 'SPEECH']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  categoryId: z.string().optional(),
  featuredImage: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  language: z.enum(['en', 'ne']).optional(),
  isPinned: z.boolean().optional(),
  publishedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  decisionNote: z.string().optional(),
});

// @route   GET /api/v1/cms/pages
// @desc    Get all pages (Admin)
// @access  Private (Admin/Staff)
router.get('/pages', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const pages = await prisma.cmsPage.findMany({
      include: { author: { select: { displayName: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(pages);
  } catch (error: any) {
    console.error('[CMS API] Error fetching pages:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   POST /api/v1/cms/pages
// @desc    Upsert a page
// @access  Private (Admin/Staff)
router.post('/pages', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = pageSchema.parse(req.body);
    const page = await cmsAdminService.upsertPage({ ...data, authorId: req.user?.id! });
    res.json(page);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/v1/cms/pages/:id
// @desc    Delete a page
// @access  Private (Admin/Staff)
router.delete('/pages/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { decisionNote } = req.body;
    await cmsAdminService.deletePage(req.params.id, req.user?.id!, decisionNote);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/v1/cms/posts
// @desc    Get all posts (Admin)
// @access  Private (Admin/Staff)
router.get('/posts', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const posts = await prisma.cmsPost.findMany({
      include: { 
        category: true,
        author: { select: { displayName: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(posts);
  } catch (error: any) {
    console.error('[CMS API] Error fetching posts:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   POST /api/v1/cms/posts
// @desc    Upsert a post
// @access  Private (Admin/Staff)
router.post('/posts', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = postSchema.parse(req.body);
    const post = await cmsAdminService.upsertPost({ ...data, authorId: req.user?.id! });
    res.json(post);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/v1/cms/posts/:id
// @desc    Delete a post
// @access  Private (Admin/Staff)
router.delete('/posts/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { decisionNote } = req.body;
    await cmsAdminService.deletePost(req.params.id, req.user?.id!, decisionNote);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/v1/cms/categories
// @desc    Get all categories
// @access  Private (Admin/Staff)
router.get('/categories', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const categories = await prisma.cmsCategory.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/cms/media
// @desc    Get all media assets
// @access  Private (Admin/Staff)
router.get('/media', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const media = await prisma.cmsMedia.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/cms/categories
// @desc    Create a category
// @access  Private (Admin/Staff)
router.post('/categories', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const category = await cmsAdminService.createCategory(req.body);
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  type: z.enum(['HERO', 'HIGHLIGHT', 'CTA', 'CONTENT_BLOCK', 'NOTICE_BANNER']),
  order: z.number().optional(),
  isEnabled: z.boolean().optional(),
  content: z.string().min(2), // JSON string
  decisionNote: z.string().optional(),
});

// --- Sections ---

// @route   GET /api/v1/cms/sections
// @desc    Get all sections
// @access  Private (Admin/Staff)
router.get('/sections', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const sections = await prisma.cmsSection.findMany({
      include: {
        author: { select: { displayName: true } },
        items: true
      },
      orderBy: { order: 'asc' }
    });
    res.json(sections);
  } catch (error: any) {
    console.error('[CMS API] Error fetching sections:', error);
    res.status(500).json({ error: 'Failed to fetch sections', details: error.message });
  }
});

// @route   POST /api/v1/cms/sections
// @desc    Create or update a section
// @access  Private (Admin/Staff)
router.post('/sections', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = sectionSchema.parse(req.body);
    const section = await cmsAdminService.upsertSection({
      ...data,
      authorId: req.user?.id!
    });
    res.json(section);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/v1/cms/sections/:id
// @desc    Delete a section
// @access  Private (Admin/Staff)
router.delete('/sections/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { decisionNote } = req.body;
    await cmsAdminService.deleteSection(req.params.id, req.user?.id!, decisionNote);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
