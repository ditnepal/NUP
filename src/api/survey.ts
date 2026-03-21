import { Router } from 'express';
import { z } from 'zod';
import { surveyService } from '../services/survey.service';
import { authenticate, authorize, AuthRequest } from './middleware/auth';

const router = Router();

// --- Validation Schemas ---
const surveySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
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
});

// --- Routes ---

// Surveys
router.get('/', authenticate, async (req, res) => {
  try {
    const surveys = await surveyService.getSurveys(req.query.status as string);
    res.json(surveys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = surveySchema.parse(req.body);
    const survey = await surveyService.createSurvey(data);
    res.status(201).json(survey);
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

router.post('/responses', authenticate, async (req: AuthRequest, res) => {
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

router.get('/:id/analytics', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const analytics = await surveyService.getSurveyAnalytics(req.params.id);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Polls
router.get('/polls', authenticate, async (req, res) => {
  try {
    const polls = await surveyService.getPolls();
    res.json(polls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/polls', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = pollSchema.parse(req.body);
    const poll = await surveyService.createPoll(data);
    res.status(201).json(poll);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/polls/:id/vote', authenticate, async (req: AuthRequest, res) => {
  try {
    const { optionId } = z.object({ optionId: z.string().uuid() }).parse(req.body);
    const vote = await surveyService.votePoll(req.params.id, optionId, req.user?.id);
    res.status(201).json(vote);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
