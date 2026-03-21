import { Router, Response } from 'express';
import { z } from 'zod';
import { electionService } from '../services/election.service';
import { authenticate, AuthRequest, authorize } from './middleware/auth';

const router = Router();

// --- Validation Schemas ---
const electionCycleSchema = z.object({
  name: z.string().min(3),
  year: z.number().int().min(2020),
  type: z.enum(['FEDERAL', 'PROVINCIAL', 'LOCAL']),
  startDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  endDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

const constituencySchema = z.object({
  name: z.string().min(2),
  code: z.string().optional(),
  type: z.enum(['FEDERAL', 'PROVINCIAL']),
  province: z.string(),
  district: z.string(),
  totalVoters: z.number().int().optional(),
});

const pollingStationSchema = z.object({
  name: z.string().min(2),
  code: z.string().optional(),
  location: z.string(),
  constituencyId: z.string().uuid(),
  ward: z.number().int(),
  localLevel: z.string(),
  district: z.string(),
  province: z.string(),
});

const candidateSchema = z.object({
  name: z.string().min(2),
  position: z.string(),
  electionCycleId: z.string().uuid(),
  constituencyId: z.string().uuid().optional(),
  manifesto: z.string().optional(),
});

const incidentSchema = z.object({
  cycleId: z.string().uuid(),
  pollingStationId: z.string().uuid().optional(),
  type: z.enum(['VIOLENCE', 'FRAUD', 'TECHNICAL', 'LOGISTICAL', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(10),
});

const resultSchema = z.object({
  cycleId: z.string().uuid(),
  constituencyId: z.string().uuid().optional(),
  boothId: z.string().uuid().optional(),
  candidateId: z.string().uuid(),
  votesReceived: z.number().int().min(0),
  isWinner: z.boolean().optional(),
  verified: z.boolean().optional(),
});

// --- Routes ---

// Election Cycles
router.get('/cycles', authenticate, async (req, res) => {
  try {
    const cycles = await electionService.getElectionCycles();
    res.json(cycles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cycles', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = electionCycleSchema.parse(req.body);
    const cycle = await electionService.createElectionCycle(data);
    res.status(201).json(cycle);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Constituencies
router.get('/constituencies', authenticate, async (req, res) => {
  try {
    const constituencies = await electionService.getConstituencies();
    res.json(constituencies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/constituencies', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = constituencySchema.parse(req.body);
    const constituency = await electionService.createConstituency(data);
    res.status(201).json(constituency);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Polling Stations
router.get('/polling-stations', authenticate, async (req, res) => {
  try {
    const constituencyId = req.query.constituencyId as string;
    const stations = await electionService.getPollingStations(constituencyId);
    res.json(stations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/polling-stations', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = pollingStationSchema.parse(req.body);
    const station = await electionService.createPollingStation(data);
    res.status(201).json(station);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Candidates
router.get('/candidates', authenticate, async (req, res) => {
  try {
    const cycleId = req.query.cycleId as string;
    if (!cycleId) return res.status(400).json({ error: 'cycleId is required' });
    const candidates = await electionService.getCandidates(cycleId);
    res.json(candidates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/candidates', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const data = candidateSchema.parse(req.body);
    const candidate = await electionService.createCandidate(data);
    res.status(201).json(candidate);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Incidents
router.get('/incidents', authenticate, async (req, res) => {
  try {
    const cycleId = req.query.cycleId as string;
    if (!cycleId) return res.status(400).json({ error: 'cycleId is required' });
    const incidents = await electionService.getIncidents(cycleId);
    res.json(incidents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/incidents', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = incidentSchema.parse(req.body);
    const incident = await electionService.reportIncident({
      ...data,
      reporterId: req.user?.id as string,
    });
    res.status(201).json(incident);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Results
router.get('/results', authenticate, async (req, res) => {
  try {
    const cycleId = req.query.cycleId as string;
    const constituencyId = req.query.constituencyId as string;
    if (!cycleId) return res.status(400).json({ error: 'cycleId is required' });
    const results = await electionService.getResults(cycleId, constituencyId);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/results', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const data = resultSchema.parse(req.body);
    const result = await electionService.enterResult({
      ...data,
      verifiedById: data.verified ? req.user?.id : undefined,
    });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Booth Readiness
router.get('/booth-readiness', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const district = req.query.district as string;
    const readiness = await electionService.getBoothReadiness(district);
    res.json(readiness);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Booth Operations (Polling Log)
router.post('/booths/:id/logs', authenticate, async (req, res) => {
  try {
    const boothId = req.params.id;
    const data = z.object({
      voterTurnout: z.number().int().optional(),
      incidentOccurred: z.boolean().optional(),
      notes: z.string().optional(),
    }).parse(req.body);
    
    const log = await electionService.logPollingDay({
      boothId,
      ...data,
    });
    res.status(201).json(log);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
