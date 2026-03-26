import { Router } from 'express';
import { z } from 'zod';
import { surveyService } from '../services/survey.service';
import { authenticate, authorize, AuthRequest } from './middleware/auth';
import { checkPermission } from './middleware/permissions';
import { permissionService } from '../services/permission.service';
import prisma from '../lib/prisma';

const router = Router();

// --- Validation Schemas ---
const surveySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  audience: z.enum(['PUBLIC', 'MEMBER']).optional(),
  placementType: z.enum(['GENERAL', 'PUBLIC_PORTAL', 'CONTENT_INLINE', 'REGISTRATION_PRE_FORM']).optional(),
  targetSlug: z.string().optional(),
  orgUnitId: z.string().uuid().optional(),
  questions: z.array(z.object({
    text: z.string().min(3),
    type: z.enum(['TEXT', 'MULTIPLE_CHOICE', 'RATING']),
    options: z.array(z.string()).optional(),
  })),
});

const responseSchema = z.object({
  surveyId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    value: z.string(),
  })),
});

const pollSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string().min(1)),
  audience: z.enum(['PUBLIC', 'MEMBER']).optional(),
  placementType: z.enum(['GENERAL', 'PUBLIC_PORTAL', 'CONTENT_INLINE', 'REGISTRATION_PRE_FORM']).optional(),
  targetSlug: z.string().optional(),
  orgUnitId: z.string().uuid().optional(),
});

// --- Routes ---

// Surveys
router.get('/', authenticate, checkPermission('SURVEYS', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    const surveys = await surveyService.getSurveys(req.query.status as string, accessibleUnitIds);
    res.json(surveys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, checkPermission('SURVEYS', 'CREATE', (req) => req.body.orgUnitId), async (req, res) => {
  try {
    const data = surveySchema.parse(req.body);
    const survey = await surveyService.createSurvey(data);
    res.status(201).json(survey);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Polls
router.get('/polls', authenticate, checkPermission('SURVEYS', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    const polls = await surveyService.getPolls(accessibleUnitIds);
    res.json(polls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/polls', authenticate, checkPermission('SURVEYS', 'CREATE', (req) => req.body.orgUnitId), async (req, res) => {
  try {
    const data = pollSchema.parse(req.body);
    const poll = await surveyService.createPoll(data);
    res.status(201).json(poll);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/polls/:id/vote', authenticate, checkPermission('SURVEYS', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const { optionId } = z.object({ optionId: z.string().uuid() }).parse(req.body);
    const vote = await surveyService.votePoll(req.params.id, optionId, req.user?.id);
    res.status(201).json(vote);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/polls/:id/status', authenticate, checkPermission('SURVEYS', 'UPDATE', async (req) => {
  const poll = await prisma.poll.findUnique({ where: { id: req.params.id } });
  return poll?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { status } = z.object({ status: z.string() }).parse(req.body);
    const poll = await surveyService.updatePollStatus(req.params.id, status);
    res.json(poll);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const survey = await surveyService.getSurvey(req.params.id);
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    res.json(survey);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/responses', authenticate, checkPermission('SURVEYS', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const data = responseSchema.parse(req.body);
    const response = await surveyService.submitResponse({
      ...data,
      userId: req.user?.id,
    });
    res.status(201).json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/analytics', authenticate, checkPermission('SURVEYS', 'VIEW'), async (req, res) => {
  try {
    const analytics = await surveyService.getSurveyAnalytics(req.params.id);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/status', authenticate, checkPermission('SURVEYS', 'UPDATE', async (req) => {
  const survey = await prisma.survey.findUnique({ where: { id: req.params.id } });
  return survey?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { status } = z.object({ status: z.string() }).parse(req.body);
    const survey = await surveyService.updateSurveyStatus(req.params.id, status);
    res.json(survey);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
