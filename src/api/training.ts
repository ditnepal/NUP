import express from 'express';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { checkPermission } from './middleware/permissions';
import { trainingService } from '../services/training.service';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = express.Router();

const programSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  audience: z.enum(['PUBLIC', 'MEMBERS', 'STAFF']).optional(),
  isPinned: z.boolean().optional(),
  externalUrl: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

const courseSchema = z.object({
  programId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
});

const lessonSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(2),
  content: z.string().min(1),
  videoUrl: z.string().optional(),
  order: z.number().int(),
});

const quizSchema = z.object({
  lessonId: z.string().uuid(),
  title: z.string().min(2),
  passingScore: z.number().int().min(0).max(100),
});

const questionSchema = z.object({
  quizId: z.string().uuid(),
  question: z.string().min(5),
  options: z.string(), // JSON string
  correctOption: z.number().int(),
});

// @route   GET /api/v1/training/programs
// @desc    Get training programs (filtered by role/audience)
// @access  Public/Private
router.get('/programs', async (req: AuthRequest, res) => {
  try {
    // Redirect to appropriate endpoint based on context
    res.status(400).json({ error: 'Use /programs/admin, /programs/portal, or /programs/public' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/training/programs/portal
// @desc    Get training programs for learners
// @access  Private (Member/Public)
router.get('/programs/portal', authenticate, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    const where: any = { status: 'PUBLISHED' };

    if (role === 'MEMBER') {
      where.audience = { in: ['PUBLIC', 'MEMBERS'] };
    } else if (role === 'ADMIN' || role === 'STAFF') {
      where.audience = { in: ['PUBLIC', 'MEMBERS', 'STAFF'] };
    } else {
      where.audience = 'PUBLIC';
    }

    const programs = await prisma.trainingProgram.findMany({
      where,
      include: { 
        courses: {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          }
        } 
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/training/programs/public
// @desc    Get training programs for public users
// @access  Public
router.get('/programs/public', async (req, res) => {
  try {
    const programs = await prisma.trainingProgram.findMany({
      where: {
        status: 'PUBLISHED',
        audience: 'PUBLIC',
      },
      include: { 
        courses: {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          }
        } 
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/training/programs/admin
// @desc    Get all training programs for management
// @access  Private (Admin/Staff)
router.get('/programs/admin', authenticate, checkPermission('TRAINING', 'VIEW'), async (req, res) => {
  try {
    const programs = await prisma.trainingProgram.findMany({
      include: { 
        courses: {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          }
        } 
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/training/programs
// @desc    Create a training program
// @access  Private (Admin/Staff)
router.post('/programs', authenticate, checkPermission('TRAINING', 'CREATE'), async (req, res) => {
  try {
    const data = programSchema.parse(req.body);
    const program = await prisma.trainingProgram.create({ data });
    res.status(201).json(program);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PUT /api/v1/training/programs/:id
// @desc    Update a training program
// @access  Private (Admin/Staff)
router.put('/programs/:id', authenticate, checkPermission('TRAINING', 'UPDATE'), async (req, res) => {
  try {
    const data = programSchema.parse(req.body);
    const program = await prisma.trainingProgram.update({
      where: { id: req.params.id },
      data,
    });
    res.json(program);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   DELETE /api/v1/training/programs/:id
// @desc    Delete a training program
// @access  Private (Admin)
router.delete('/programs/:id', authenticate, checkPermission('TRAINING', 'DELETE'), async (req, res) => {
  try {
    await prisma.trainingProgram.delete({ where: { id: req.params.id } });
    res.json({ message: 'Program deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/v1/training/courses/:id
// @desc    Get course details
// @access  Public/Private
router.get('/courses/:id', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        program: true,
        lessons: {
          orderBy: { order: 'asc' },
          include: { quizzes: true },
        },
      },
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/training/courses
// @desc    Create a course
// @access  Private (Admin/Staff)
router.post('/courses', authenticate, checkPermission('TRAINING', 'CREATE'), async (req, res) => {
  try {
    const data = courseSchema.parse(req.body);
    const course = await prisma.course.create({ data });
    res.status(201).json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PUT /api/v1/training/courses/:id
// @desc    Update a course
// @access  Private (Admin/Staff)
router.put('/courses/:id', authenticate, checkPermission('TRAINING', 'UPDATE'), async (req, res) => {
  try {
    const data = courseSchema.parse(req.body);
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data,
    });
    res.json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   DELETE /api/v1/training/courses/:id
// @desc    Delete a course
// @access  Private (Admin/Staff)
router.delete('/courses/:id', authenticate, checkPermission('TRAINING', 'DELETE'), async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ message: 'Course deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/training/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private
router.post('/courses/:id/enroll', authenticate, async (req: AuthRequest, res) => {
  try {
    const enrollment = await trainingService.enrollUser(req.params.id, req.user?.id!);
    res.json(enrollment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/training/lessons
// @desc    Create a lesson
// @access  Private (Admin/Staff)
router.post('/lessons', authenticate, checkPermission('TRAINING', 'CREATE'), async (req, res) => {
  try {
    const data = lessonSchema.parse(req.body);
    const lesson = await prisma.lesson.create({ data });
    res.status(201).json(lesson);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PUT /api/v1/training/lessons/:id
// @desc    Update a lesson
// @access  Private (Admin/Staff)
router.put('/lessons/:id', authenticate, checkPermission('TRAINING', 'UPDATE'), async (req, res) => {
  try {
    const data = lessonSchema.parse(req.body);
    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data,
    });
    res.json(lesson);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   DELETE /api/v1/training/lessons/:id
// @desc    Delete a lesson
// @access  Private (Admin/Staff)
router.delete('/lessons/:id', authenticate, checkPermission('TRAINING', 'DELETE'), async (req, res) => {
  try {
    await prisma.lesson.delete({ where: { id: req.params.id } });
    res.json({ message: 'Lesson deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/training/quizzes
// @desc    Create a quiz
// @access  Private (Admin/Staff)
router.post('/quizzes', authenticate, checkPermission('TRAINING', 'CREATE'), async (req, res) => {
  try {
    const data = quizSchema.parse(req.body);
    const quiz = await prisma.quiz.create({ data });
    res.status(201).json(quiz);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/training/quizzes/:id/submit
// @desc    Submit quiz attempt
// @access  Private
router.post('/quizzes/:id/submit', authenticate, async (req: AuthRequest, res) => {
  try {
    const { answers } = req.body;
    const attempt = await trainingService.submitQuiz(req.params.id, req.user?.id!, answers);
    res.json(attempt);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/v1/training/progress
// @desc    Get learner progress
// @access  Private
router.get('/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const progress = await trainingService.getLearnerProgress(req.user?.id!);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
