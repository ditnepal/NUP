import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { z } from 'zod';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Ensure uploads directory exists
const isProd = process.env.NODE_ENV === 'production';
const uploadsDir = isProd ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const documentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  category: z.string(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  size: z.number().optional(),
  isPublished: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional().default(false)),
});

// @route   GET /api/v1/documents/public
// @desc    Get all published documents
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching public documents:', error);
    res.status(500).json({ error: 'Server error' });
  }
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
  } catch (error: any) {
    console.error('Error fetching documents:', error.code, error.message, error.meta);
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
        isPublished: data.isPublished || false,
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

    const filename = `${Date.now()}_${req.file.originalname}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    const fileUrl = `/uploads/${filename}`;

    const document = await prisma.document.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        size: req.file.size,
        isPublished: data.isPublished,
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

router.delete('/:id', authenticate, authorize(['ADMIN', 'NATIONAL_ADMIN', 'DISTRICT_COORDINATOR']), async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete physical file
    const filePath = path.join(process.cwd(), document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.document.delete({
      where: { id },
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
