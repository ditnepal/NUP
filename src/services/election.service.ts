import prisma from '../lib/prisma';
import { auditService } from './audit.service';

export class ElectionService {
  // --- Election Cycles ---
  async createElectionCycle(data: {
    name: string;
    year: number;
    type: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return prisma.electionCycle.create({
      data: {
        ...data,
        status: 'UPCOMING',
      },
    });
  }

  async getElectionCycles() {
    return prisma.electionCycle.findMany({
      orderBy: { year: 'desc' },
      include: {
        _count: {
          select: { candidates: true, results: true, incidents: true },
        },
      },
    });
  }

  async updateElectionCycle(id: string, data: {
    name?: string;
    year?: number;
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return prisma.electionCycle.update({
      where: { id },
      data,
    });
  }

  async deleteElectionCycle(id: string) {
    const [candidates, results, incidents] = await Promise.all([
      prisma.candidate.count({ where: { electionCycleId: id } }),
      prisma.electionResult.count({ where: { cycleId: id } }),
      prisma.electionIncident.count({ where: { cycleId: id } }),
    ]);

    if (candidates > 0 || results > 0 || incidents > 0) {
      throw new Error('Cannot delete election cycle with linked candidates, results, or incidents.');
    }

    return prisma.electionCycle.delete({ where: { id } });
  }

  // --- Constituencies & Polling Stations ---
  async createConstituency(data: {
    name: string;
    code?: string;
    type: string;
    province: string;
    district: string;
    totalVoters?: number;
  }) {
    return prisma.constituency.create({ data });
  }

  async getConstituencies() {
    return prisma.constituency.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { candidates: true, pollingStations: true } }
      }
    });
  }

  async updateConstituency(id: string, data: {
    name?: string;
    code?: string;
    type?: string;
    province?: string;
    district?: string;
    totalVoters?: number;
  }) {
    return prisma.constituency.update({
      where: { id },
      data,
    });
  }

  async deleteConstituency(id: string) {
    const [candidates, results, stations] = await Promise.all([
      prisma.candidate.count({ where: { constituencyId: id } }),
      prisma.electionResult.count({ where: { constituencyId: id } }),
      prisma.pollingStation.count({ where: { constituencyId: id } }),
    ]);

    if (candidates > 0 || results > 0 || stations > 0) {
      throw new Error('Cannot delete constituency with linked candidates, results, or polling stations.');
    }

    return prisma.constituency.delete({ where: { id } });
  }

  async createPollingStation(data: {
    name: string;
    code?: string;
    location: string;
    constituencyId: string;
    ward: number;
    localLevel: string;
    district: string;
    province: string;
  }) {
    return prisma.pollingStation.create({ data });
  }

  async getPollingStations(constituencyId?: string) {
    return prisma.pollingStation.findMany({
      where: constituencyId ? { constituencyId } : {},
      include: {
        _count: { select: { booths: true } },
        constituency: true,
      },
    });
  }

  async updatePollingStation(id: string, data: Partial<{
    name: string;
    code?: string;
    location: string;
    constituencyId: string;
    ward: number;
    localLevel: string;
    district: string;
    province: string;
  }>) {
    return prisma.pollingStation.update({
      where: { id },
      data,
    });
  }

  async deletePollingStation(id: string) {
    const booths = await prisma.booth.count({ where: { pollingStationId: id } });
    if (booths > 0) {
      throw new Error('Cannot delete polling station with linked booths.');
    }
    return prisma.pollingStation.delete({ where: { id } });
  }

  // --- Candidates ---
  async createCandidate(data: {
    name: string;
    position: string;
    electionCycleId: string;
    constituencyId?: string;
    manifesto?: string;
  }) {
    return prisma.candidate.create({
      data: {
        ...data,
        status: 'NOMINATED',
      },
    });
  }

  async uploadCandidateDocument(data: {
    candidateId: string;
    title: string;
    type: string;
    fileUrl: string;
  }) {
    return prisma.candidateDocument.create({ data });
  }

  async getCandidates(cycleId: string) {
    return prisma.candidate.findMany({
      where: { electionCycleId: cycleId },
      include: {
        constituency: true,
        documents: true,
        electionCycle: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateCandidate(id: string, data: {
    name?: string;
    position?: string;
    electionCycleId?: string;
    constituencyId?: string;
    manifesto?: string;
    status?: string;
  }) {
    return prisma.candidate.update({
      where: { id },
      data,
    });
  }

  async deleteCandidate(id: string) {
    // Check for election results
    const resultsCount = await prisma.electionResult.count({
      where: { candidateId: id },
    });

    if (resultsCount > 0) {
      throw new Error('Cannot delete candidate with existing election results.');
    }

    // Check for documents
    const docsCount = await prisma.candidateDocument.count({
      where: { candidateId: id },
    });

    if (docsCount > 0) {
      throw new Error('Cannot delete candidate with existing documents. Please remove documents first.');
    }

    return prisma.candidate.delete({
      where: { id },
    });
  }

  // --- Booth Operations ---
  async assignBoothTeam(data: {
    boothId: string;
    userId: string;
    role: string;
  }) {
    return prisma.boothTeamMember.upsert({
      where: {
        boothId_userId: {
          boothId: data.boothId,
          userId: data.userId,
        },
      },
      update: { role: data.role },
      create: data,
    });
  }

  async deployVolunteer(data: {
    boothId: string;
    userId: string;
    startDate: Date;
    endDate?: Date;
    task?: string;
  }) {
    return prisma.volunteerDeployment.create({ data });
  }

  async recordOutreach(data: {
    boothId: string;
    userId: string;
    supporterId?: string;
    type: string;
    outcome?: string;
    notes?: string;
  }) {
    return prisma.outreachRecord.create({ data });
  }

  async logPollingDay(data: {
    boothId: string;
    voterTurnout?: number;
    incidentOccurred?: boolean;
    notes?: string;
  }) {
    return prisma.pollingDayLog.create({ data });
  }

  // --- Incidents (High Sensitivity) ---
  async reportIncident(data: {
    cycleId: string;
    pollingStationId?: string;
    boothId?: string;
    reporterId: string;
    type: string;
    severity: string;
    description: string;
  }) {
    const incident = await prisma.electionIncident.create({
      data: {
        ...data,
        status: 'REPORTED',
      },
    });

    await auditService.log({
      userId: data.reporterId,
      action: 'ELECTION_INCIDENT_REPORTED',
      entityType: 'ElectionIncident',
      entityId: incident.id,
      details: `Incident of type ${data.type} reported with severity ${data.severity}`,
    });

    return incident;
  }

  async getIncidents(cycleId: string) {
    return prisma.electionIncident.findMany({
      where: { cycleId },
      include: {
        reporter: { select: { displayName: true, email: true } },
        pollingStation: true,
        booth: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateIncident(id: string, data: {
    status?: string;
    severity?: string;
    description?: string;
  }) {
    return prisma.electionIncident.update({
      where: { id },
      data,
    });
  }

  async deleteIncident(id: string) {
    return prisma.electionIncident.delete({ where: { id } });
  }

  // --- Results (High Sensitivity) ---
  async enterResult(data: {
    cycleId: string;
    constituencyId?: string;
    boothId?: string;
    candidateId: string;
    votesReceived: number;
    isWinner?: boolean;
    verifiedById?: string;
  }) {
    const result = await prisma.electionResult.upsert({
      where: {
        cycleId_boothId_candidateId: {
          cycleId: data.cycleId,
          boothId: data.boothId || 'GLOBAL', // Fallback if booth is null
          candidateId: data.candidateId,
        },
      },
      update: {
        votesReceived: data.votesReceived,
        isWinner: data.isWinner,
        verifiedById: data.verifiedById,
        verifiedAt: data.verifiedById ? new Date() : null,
      },
      create: {
        ...data,
        boothId: data.boothId || 'GLOBAL',
      },
    });

    if (data.verifiedById) {
      await auditService.log({
        userId: data.verifiedById,
        action: 'ELECTION_RESULT_VERIFIED',
        entityType: 'ElectionResult',
        entityId: result.id,
        details: `Verified result for candidate ${data.candidateId} in cycle ${data.cycleId}`,
      });
    }

    return result;
  }

  async getResults(cycleId: string, constituencyId?: string) {
    return prisma.electionResult.findMany({
      where: {
        cycleId,
        constituencyId: constituencyId || undefined,
      },
      include: {
        candidate: true,
        constituency: true,
        booth: true,
      },
      orderBy: { votesReceived: 'desc' },
    });
  }

  async updateResult(id: string, data: {
    votesReceived?: number;
    isWinner?: boolean;
    verifiedById?: string;
  }) {
    return prisma.electionResult.update({
      where: { id },
      data: {
        ...data,
        verifiedAt: data.verifiedById ? new Date() : undefined,
      },
    });
  }

  async deleteResult(id: string) {
    return prisma.electionResult.delete({ where: { id } });
  }

  // --- Analytics & Readiness ---
  async updateBoothReadiness(id: string, data: {
    status?: string;
    readinessNote?: string;
  }) {
    return prisma.booth.update({
      where: { id },
      data,
    });
  }

  async getBoothReadiness(district?: string) {
    const booths = await prisma.booth.findMany({
      where: district ? { district } : {},
      include: {
        _count: {
          select: {
            team: true,
            deployments: true,
            outreach: true,
          },
        },
      },
    });

    return booths.map((b) => ({
      id: b.id,
      name: b.name,
      status: b.status,
      teamCount: b._count.team,
      deploymentCount: b._count.deployments,
      outreachCount: b._count.outreach,
      readinessScore: this.calculateReadiness(b),
    }));
  }

  private calculateReadiness(booth: any) {
    let score = 0;
    if (booth._count.team > 0) score += 40;
    if (booth._count.deployments > 0) score += 30;
    if (booth._count.outreach > 10) score += 30;
    return Math.min(score, 100);
  }
}

export const electionService = new ElectionService();
