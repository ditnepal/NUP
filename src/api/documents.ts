import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';
import multer from 'multer';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const documentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  category: z.string(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  size: z.number().optional(),
});

// @route   GET /api/v1/documents
// @desc    Get all documents
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/documents
// @desc    Create a new document with manual metadata
// @access  Private
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const uploaderId = req.user?.id;
    if (!uploaderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = documentSchema.parse(req.body);

    const document = await prisma.document.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        fileUrl: data.fileUrl || '',
        fileName: data.fileName || 'document',
        fileType: data.fileType || 'application/octet-stream',
        size: data.size || 0,
        uploadedBy: uploaderId,
      }
    });

    res.status(201).json(document);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    console.error('Document creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/documents/upload
// @desc    Upload a new document
// @access  Private
router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const uploaderId = req.user?.id;
    if (!uploaderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const data = documentSchema.parse(req.body);

    // In a real app, you would upload the file to S3 or similar here.
    // For this example, we'll just store a dummy URL or base64 if it's small.
    // We'll simulate a file URL.
    const fileUrl = `https://example.com/documents/${Date.now()}_${req.file.originalname}`;

    const document = await prisma.document.create({
      data: {
        ...data,
        fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: uploaderId,
      }
    });

    res.status(201).json(document);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
