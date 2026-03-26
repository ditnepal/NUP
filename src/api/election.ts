import { Router, Response } from 'express';
import { z } from 'zod';
import { electionService } from '../services/election.service';
import { authenticate, AuthRequest, authorize } from './middleware/auth';
import { checkPermission } from './middleware/permissions';
import { permissionService } from '../services/permission.service';
import prisma from '../lib/prisma';

const router = Router();

// --- Validation Schemas ---
const electionCycleSchema = z.object({
  name: z.string().min(3),
  year: z.number().int().min(2020),
  type: z.enum(['FEDERAL', 'PROVINCIAL', 'LOCAL']),
  status: z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED']).optional(),
  startDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  endDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  orgUnitId: z.string().uuid().optional(),
});

const constituencySchema = z.object({
  name: z.string().min(2),
  code: z.string().optional(),
  type: z.enum(['FEDERAL', 'PROVINCIAL']),
  province: z.string(),
  district: z.string(),
  totalVoters: z.number().int().optional(),
  orgUnitId: z.string().uuid().optional(),
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
  orgUnitId: z.string().uuid().optional(),
});

const candidateSchema = z.object({
  name: z.string().min(2),
  position: z.string(),
  electionCycleId: z.string().uuid(),
  constituencyId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'WITHDRAWN', 'DISQUALIFIED', 'WON', 'LOST']).optional(),
  manifesto: z.string().optional(),
  orgUnitId: z.string().uuid().optional(),
});

const incidentSchema = z.object({
  cycleId: z.string().uuid(),
  pollingStationId: z.string().uuid().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  boothId: z.string().uuid().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  type: z.enum(['VIOLENCE', 'FRAUD', 'TECHNICAL', 'LOGISTICAL', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['REPORTED', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']).optional(),
  description: z.string().min(10),
  orgUnitId: z.string().uuid().optional(),
});

const resultSchema = z.object({
  cycleId: z.string().uuid(),
  constituencyId: z.string().uuid().optional(),
  boothId: z.string().uuid().optional(),
  candidateId: z.string().uuid(),
  votesReceived: z.number().int().min(0),
  isWinner: z.boolean().optional(),
  verified: z.boolean().optional(),
  orgUnitId: z.string().uuid().optional(),
});

// --- Routes ---

// Election Cycles
router.get('/cycles', authenticate, checkPermission('ELECTION', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    const cycles = await electionService.getElectionCycles(accessibleUnitIds);
    res.json(cycles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cycles', authenticate, checkPermission('ELECTION', 'CREATE', (req) => req.body.orgUnitId), async (req, res) => {
  try {
    const data = electionCycleSchema.parse(req.body);
    const cycle = await electionService.createElectionCycle(data);
    res.status(201).json(cycle);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/cycles/:id', authenticate, checkPermission('ELECTION', 'UPDATE', async (req) => {
  const cycle = await prisma.electionCycle.findUnique({ where: { id: req.params.id } });
  return cycle?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { id } = req.params;
    const data = electionCycleSchema.partial().parse(req.body);
    const cycle = await electionService.updateElectionCycle(id, data);
    res.json(cycle);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/cycles/:id', authenticate, checkPermission('ELECTION', 'DELETE', async (req) => {
  const cycle = await prisma.electionCycle.findUnique({ where: { id: req.params.id } });
  return cycle?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { id } = req.params;
    await electionService.deleteElectionCycle(id);
    res.json({ message: 'Election cycle deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Constituencies
router.get('/constituencies', authenticate, checkPermission('ELECTION', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    const constituencies = await electionService.getConstituencies(accessibleUnitIds);
    res.json(constituencies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/constituencies', authenticate, checkPermission('ELECTION', 'CREATE', (req) => req.body.orgUnitId), async (req, res) => {
  try {
    const data = constituencySchema.parse(req.body);
    const constituency = await electionService.createConstituency(data);
    res.status(201).json(constituency);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/constituencies/:id', authenticate, checkPermission('ELECTION', 'UPDATE', async (req) => {
  const constituency = await prisma.constituency.findUnique({ where: { id: req.params.id } });
  return constituency?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { id } = req.params;
    const data = constituencySchema.partial().parse(req.body);
    const constituency = await electionService.updateConstituency(id, data);
    res.json(constituency);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/constituencies/:id', authenticate, checkPermission('ELECTION', 'DELETE', async (req) => {
  const constituency = await prisma.constituency.findUnique({ where: { id: req.params.id } });
  return constituency?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { id } = req.params;
    await electionService.deleteConstituency(id);
    res.json({ message: 'Constituency deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Polling Stations
router.get('/polling-stations', authenticate, checkPermission('ELECTION', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const constituencyId = req.query.constituencyId as string;
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    const stations = await electionService.getPollingStations(constituencyId, accessibleUnitIds);
    res.json(stations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/polling-stations', authenticate, checkPermission('ELECTION', 'CREATE', (req) => req.body.orgUnitId), async (req, res) => {
  try {
    const data = pollingStationSchema.parse(req.body);
    const station = await electionService.createPollingStation(data);
    res.status(201).json(station);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/polling-stations/:id', authenticate, checkPermission('ELECTION', 'UPDATE', async (req) => {
  const station = await prisma.pollingStation.findUnique({ where: { id: req.params.id } });
  return station?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { id } = req.params;
    const data = pollingStationSchema.partial().parse(req.body);
    const station = await electionService.updatePollingStation(id, data);
    res.json(station);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/polling-stations/:id', authenticate, checkPermission('ELECTION', 'DELETE', async (req) => {
  const station = await prisma.pollingStation.findUnique({ where: { id: req.params.id } });
  return station?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { id } = req.params;
    await electionService.deletePollingStation(id);
    res.json({ message: 'Polling station deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Candidates
router.get('/candidates', authenticate, checkPermission('ELECTION', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const cycleId = req.query.cycleId as string;
    if (!cycleId) return res.status(400).json({ error: 'cycleId is required' });
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    const candidates = await electionService.getCandidates(cycleId, accessibleUnitIds);
    res.json(candidates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/candidates', authenticate, checkPermission('ELECTION', 'CREATE', (req) => req.body.orgUnitId), async (req, res) => {
  try {
    const data = candidateSchema.parse(req.body);
    const candidate = await electionService.createCandidate(data);
    res.status(201).json(candidate);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/candidates/:id', authenticate, checkPermission('ELECTION', 'UPDATE', async (req) => {
  const candidate = await prisma.candidate.findUnique({ where: { id: req.params.id } });
  return candidate?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { id } = req.params;
    const data = candidateSchema.partial().parse(req.body);
    const candidate = await electionService.updateCandidate(id, data);
    res.json(candidate);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/candidates/:id', authenticate, checkPermission('ELECTION', 'DELETE', async (req) => {
  const candidate = await prisma.candidate.findUnique({ where: { id: req.params.id } });
  return candidate?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { id } = req.params;
    await electionService.deleteCandidate(id);
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Incidents
router.get('/incidents', authenticate, checkPermission('ELECTION', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const cycleId = req.query.cycleId as string;
    if (!cycleId) return res.status(400).json({ error: 'cycleId is required' });
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    const incidents = await electionService.getIncidents(cycleId, accessibleUnitIds);
    res.json(incidents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/incidents', authenticate, checkPermission('ELECTION', 'CREATE', (req) => req.body.orgUnitId), async (req: AuthRequest, res) => {
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

router.put('/incidents/:id', authenticate, checkPermission('ELECTION', 'UPDATE', async (req) => {
  const incident = await prisma.electionIncident.findUnique({ where: { id: req.params.id } });
  return incident?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { id } = req.params;
    const data = incidentSchema.partial().parse(req.body);
    const incident = await electionService.updateIncident(id, data);
    res.json(incident);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/incidents/:id', authenticate, checkPermission('ELECTION', 'DELETE', async (req) => {
  const incident = await prisma.electionIncident.findUnique({ where: { id: req.params.id } });
  return incident?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { id } = req.params;
    await electionService.deleteIncident(id);
    res.json({ message: 'Incident deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Results
router.get('/results', authenticate, checkPermission('ELECTION', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const cycleId = req.query.cycleId as string;
    const constituencyId = req.query.constituencyId as string;
    if (!cycleId) return res.status(400).json({ error: 'cycleId is required' });
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    const results = await electionService.getResults(cycleId, constituencyId, accessibleUnitIds);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/results', authenticate, checkPermission('ELECTION', 'CREATE', (req) => req.body.orgUnitId), async (req: AuthRequest, res) => {
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

router.put('/results/:id', authenticate, checkPermission('ELECTION', 'UPDATE', async (req) => {
  const result = await prisma.electionResult.findUnique({ where: { id: req.params.id } });
  return result?.orgUnitId || undefined;
}), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = resultSchema.partial().parse(req.body);
    const result = await electionService.updateResult(id, {
      ...data,
      verifiedById: data.verified ? req.user?.id : undefined,
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/results/:id', authenticate, checkPermission('ELECTION', 'DELETE', async (req) => {
  const result = await prisma.electionResult.findUnique({ where: { id: req.params.id } });
  return result?.orgUnitId || undefined;
}), async (req, res) => {
  try {
    const { id } = req.params;
    await electionService.deleteResult(id);
    res.json({ message: 'Result deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Booth Readiness
router.get('/booth-readiness', authenticate, checkPermission('ELECTION', 'VIEW'), async (req: AuthRequest, res) => {
  try {
    const district = req.query.district as string;
    const accessibleUnitIds = await permissionService.getAccessibleUnitIds(req.user!);
    const readiness = await electionService.getBoothReadiness(district, accessibleUnitIds);
    res.json(readiness);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/booths/:id/readiness', authenticate, checkPermission('ELECTION', 'APPROVE'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = z.object({
      status: z.string().optional(),
      readinessNote: z.string().optional(),
    }).parse(req.body);
    const booth = await electionService.updateBoothReadiness(id, data);
    res.json(booth);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Booth Operations (Polling Log)
router.post('/booths/:id/logs', authenticate, checkPermission('ELECTION', 'CREATE'), async (req, res) => {
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
