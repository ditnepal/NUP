import { Router } from 'express';
import { z } from 'zod';
import { pgisService } from '../services/pgis.service';
import { authenticate, authorize, AuthRequest } from './middleware/auth';

const router = Router();

// --- Validation Schemas ---
const reportSchema = z.object({
  type: z.enum(['SENTIMENT', 'PUBLIC_ISSUE', 'BOOTH_READINESS', 'INCIDENT', 'COMPETITOR_ACTIVITY']),
  content: z.string().min(5),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationName: z.string().optional(),
  orgUnitId: z.string().uuid().optional(),
  sentimentScore: z.number().min(-100).max(100).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

const prioritySchema = z.object({
  orgUnitId: z.string().uuid(),
  issue: z.string().min(3),
  description: z.string().optional(),
  rank: z.number().int().optional(),
});

const alertSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(5),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  orgUnitId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

const strengthSchema = z.object({
  orgUnitId: z.string().uuid(),
  partyStrength: z.number().min(0).max(100),
  oppositionStrength: z.number().min(0).max(100),
  swingVoters: z.number().min(0).max(100),
});

// --- Routes ---

// Reports
router.get('/reports', authenticate, async (req, res) => {
  try {
    const filters: any = {};
    if (req.query.type) filters.type = req.query.type as string;
    if (req.query.orgUnitId) filters.orgUnitId = req.query.orgUnitId as string;
    if (req.query.priority) filters.priority = req.query.priority as string;

    const reports = await pgisService.getReports(filters);
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reports', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = reportSchema.parse(req.body);
    const report = await pgisService.createReport({
      ...data,
      reporterId: req.user?.id as string,
    });
    res.status(201).json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Community Priorities
router.get('/priorities', authenticate, async (req, res) => {
  try {
    const priorities = await pgisService.getCommunityPriorities(req.query.orgUnitId as string);
    res.json(priorities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/priorities', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = prioritySchema.parse(req.body);
    const priority = await pgisService.addCommunityPriority(data);
    res.status(201).json(priority);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Alerts
router.get('/alerts', authenticate, async (req: AuthRequest, res) => {
  try {
    const alerts = await pgisService.getAlerts(req.user?.id, req.query.orgUnitId as string);
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/alerts', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = alertSchema.parse(req.body);
    const alert = await pgisService.createAlert(data);
    res.status(201).json(alert);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Area Strengths
router.get('/strengths', authenticate, async (req, res) => {
  try {
    const strengths = await pgisService.getAreaStrengths();
    res.json(strengths);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/strengths', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = strengthSchema.parse(req.body);
    const strength = await pgisService.updateAreaStrength(data);
    res.json(strength);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Strategic Overview
router.get('/overview', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const overview = await pgisService.getStrategicOverview(req.query.orgUnitId as string);
    res.json(overview);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ground Signals (Unified Feed)
router.get('/signals', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const signals = await pgisService.getSignals(limit);
    res.json(signals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
