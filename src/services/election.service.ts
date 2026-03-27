import prisma from '../lib/prisma';
import { safeJsonParse } from '../lib/json';
import { auditService } from './audit.service';

export class ElectionService {
  // --- Election Cycles ---
  async createElectionCycle(data: {
    name: string;
    year: number;
    type: string;
    startDate?: Date;
    endDate?: Date;
    orgUnitId?: string;
  }) {
    return prisma.electionCycle.create({
      data: {
        ...data,
        status: 'UPCOMING',
      },
    });
  }

  async getElectionCycles(orgUnitIds?: string[] | null) {
    return prisma.electionCycle.findMany({
      where: orgUnitIds ? { orgUnitId: { in: orgUnitIds } } : {},
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

  async deleteElectionCycle(id: string, userId?: string, note?: string) {
    if (!note || note.trim().length === 0) {
      throw new Error('Decision note is required for deleting an election cycle.');
    }
    if (note.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
    const [candidates, results, incidents] = await Promise.all([
      prisma.candidate.count({ where: { electionCycleId: id } }),
      prisma.electionResult.count({ where: { cycleId: id } }),
      prisma.electionIncident.count({ where: { cycleId: id } }),
    ]);

    if (candidates > 0 || results > 0 || incidents > 0) {
      throw new Error('Cannot delete election cycle with linked candidates, results, or incidents.');
    }

    const cycle = await prisma.electionCycle.delete({ where: { id } });

    if (userId) {
      await auditService.log({
        userId,
        action: 'ELECTION_CYCLE_DELETED',
        entityType: 'ElectionCycle',
        entityId: id,
        details: { name: cycle.name, year: cycle.year, note, decisionNote: note },
      });
    }

    return cycle;
  }

  // --- Constituencies & Polling Stations ---
  async createConstituency(data: {
    name: string;
    code?: string;
    type: string;
    province: string;
    district: string;
    totalVoters?: number;
    orgUnitId?: string;
  }) {
    return prisma.constituency.create({ data });
  }

  async getConstituencies(orgUnitIds?: string[] | null) {
    return prisma.constituency.findMany({
      where: orgUnitIds ? { orgUnitId: { in: orgUnitIds } } : {},
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

  async deleteConstituency(id: string, userId?: string, note?: string) {
    if (!note || note.trim().length === 0) {
      throw new Error('Decision note is required for deleting a constituency.');
    }
    if (note.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
    const [candidates, results, stations] = await Promise.all([
      prisma.candidate.count({ where: { constituencyId: id } }),
      prisma.electionResult.count({ where: { constituencyId: id } }),
      prisma.pollingStation.count({ where: { constituencyId: id } }),
    ]);

    if (candidates > 0 || results > 0 || stations > 0) {
      throw new Error('Cannot delete constituency with linked candidates, results, or polling stations.');
    }

    const constituency = await prisma.constituency.delete({ where: { id } });

    if (userId) {
      await auditService.log({
        userId,
        action: 'CONSTITUENCY_DELETED',
        entityType: 'Constituency',
        entityId: id,
        details: { name: constituency.name, code: constituency.code, note, decisionNote: note },
      });
    }

    return constituency;
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
    orgUnitId?: string;
  }) {
    return prisma.pollingStation.create({ data });
  }

  async getPollingStations(constituencyId?: string, orgUnitIds?: string[] | null) {
    const where: any = {};
    if (constituencyId) where.constituencyId = constituencyId;
    if (orgUnitIds) where.orgUnitId = { in: orgUnitIds };

    return prisma.pollingStation.findMany({
      where,
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

  async deletePollingStation(id: string, userId?: string, note?: string) {
    if (!note || note.trim().length === 0) {
      throw new Error('Decision note is required for deleting a polling station.');
    }
    if (note.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
    const booths = await prisma.booth.count({ where: { pollingStationId: id } });
    if (booths > 0) {
      throw new Error('Cannot delete polling station with linked booths.');
    }
    const station = await prisma.pollingStation.delete({ where: { id } });

    if (userId) {
      await auditService.log({
        userId,
        action: 'POLLING_STATION_DELETED',
        entityType: 'PollingStation',
        entityId: id,
        details: { name: station.name, code: station.code, note, decisionNote: note },
      });
    }

    return station;
  }

  // --- Candidates ---
  async createCandidate(data: {
    name: string;
    position: string;
    electionCycleId: string;
    constituencyId?: string;
    manifesto?: string;
    orgUnitId?: string;
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

  async getCandidates(cycleId: string, orgUnitIds?: string[] | null) {
    const where: any = { electionCycleId: cycleId };
    if (orgUnitIds) where.orgUnitId = { in: orgUnitIds };

    return prisma.candidate.findMany({
      where,
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

  async deleteCandidate(id: string, userId?: string, note?: string) {
    if (!note || note.trim().length === 0) {
      throw new Error('Decision note is required for deleting a candidate.');
    }
    if (note.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
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

    const candidate = await prisma.candidate.delete({
      where: { id },
    });

    if (userId) {
      await auditService.log({
        userId,
        action: 'CANDIDATE_DELETED',
        entityType: 'Candidate',
        entityId: id,
        details: { name: candidate.name, position: candidate.position, note, decisionNote: note },
      });
    }

    return candidate;
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
    orgUnitId?: string;
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
      details: { message: `Incident of type ${data.type} reported with severity ${data.severity}` },
    });

    return incident;
  }

  async getIncidents(cycleId: string, orgUnitIds?: string[] | null) {
    const where: any = { cycleId };
    if (orgUnitIds) where.orgUnitId = { in: orgUnitIds };

    const incidents = await prisma.electionIncident.findMany({
      where,
      include: {
        reporter: { select: { displayName: true, email: true } },
        pollingStation: true,
        booth: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(incidents.map(async (incident) => {
      const logs = await auditService.getLogsForEntity('ElectionIncident', incident.id);
      return {
        ...incident,
        auditTrail: logs.map(l => ({
          id: l.id,
          action: l.action,
          userId: l.userId || '',
          userDisplayName: l.user?.displayName || l.userId,
          details: safeJsonParse(l.details),
          timestamp: l.timestamp.toISOString(),
        })),
      };
    }));
  }

  async updateIncident(id: string, data: {
    status?: string;
    severity?: string;
    description?: string;
    userId?: string;
    note?: string;
  }) {
    if (data.note && data.note.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
    const { userId, note, ...updateData } = data;
    const incident = await prisma.electionIncident.update({
      where: { id },
      data: updateData,
    });

    if (userId) {
      await auditService.log({
        userId,
        action: 'ELECTION_INCIDENT_UPDATED',
        entityType: 'ElectionIncident',
        entityId: incident.id,
        details: { 
          ...updateData, 
          note,
          decisionNote: note,
          targetType: 'ElectionIncident',
          targetId: incident.id
        },
      });
    }

    return incident;
  }

  async deleteIncident(id: string, userId?: string, note?: string) {
    if (!note || note.trim().length === 0) {
      throw new Error('Decision note is required for deleting an incident.');
    }
    if (note.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
    const incident = await prisma.electionIncident.delete({ where: { id } });

    if (userId) {
      await auditService.log({
        userId,
        action: 'ELECTION_INCIDENT_DELETED',
        entityType: 'ElectionIncident',
        entityId: id,
        details: { type: incident.type, description: incident.description, note, decisionNote: note },
      });
    }

    return incident;
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
    orgUnitId?: string;
    userId?: string;
  }) {
    const { userId, ...resultData } = data;
    const result = await prisma.electionResult.upsert({
      where: {
        cycleId_boothId_candidateId: {
          cycleId: resultData.cycleId,
          boothId: resultData.boothId || 'GLOBAL', // Fallback if booth is null
          candidateId: resultData.candidateId,
        },
      },
      update: {
        votesReceived: resultData.votesReceived,
        isWinner: resultData.isWinner,
        verifiedById: resultData.verifiedById,
        verifiedAt: resultData.verifiedById ? new Date() : null,
        orgUnitId: resultData.orgUnitId,
      },
      create: {
        ...resultData,
        boothId: resultData.boothId || 'GLOBAL',
      },
    });

    if (userId) {
      await auditService.log({
        userId,
        action: 'ELECTION_RESULT_ENTERED',
        entityType: 'ElectionResult',
        entityId: result.id,
        details: { votesReceived: resultData.votesReceived, candidateId: resultData.candidateId },
      });
    }

    if (resultData.verifiedById) {
      await auditService.log({
        userId: resultData.verifiedById,
        action: 'ELECTION_RESULT_VERIFIED',
        entityType: 'ElectionResult',
        entityId: result.id,
        details: { message: `Verified result for candidate ${resultData.candidateId} in cycle ${resultData.cycleId}` },
      });
    }

    return result;
  }

  async getResults(cycleId: string, constituencyId?: string, orgUnitIds?: string[] | null) {
    const where: any = { cycleId };
    if (constituencyId) where.constituencyId = constituencyId;
    if (orgUnitIds) where.orgUnitId = { in: orgUnitIds };

    const results = await prisma.electionResult.findMany({
      where,
      include: {
        candidate: true,
        constituency: true,
        booth: true,
      },
      orderBy: { votesReceived: 'desc' },
    });

    return Promise.all(results.map(async (result) => {
      const logs = await auditService.getLogsForEntity('ElectionResult', result.id);
      return {
        ...result,
        auditTrail: logs.map(l => ({
          id: l.id,
          action: l.action,
          userId: l.userId || '',
          userDisplayName: l.user?.displayName || l.userId,
          details: safeJsonParse(l.details),
          timestamp: l.timestamp.toISOString(),
        })),
      };
    }));
  }

  async updateResult(id: string, data: {
    votesReceived?: number;
    isWinner?: boolean;
    verifiedById?: string;
    userId?: string;
    note?: string;
  }) {
    if (data.note && data.note.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
    const { userId, note, ...updateData } = data;
    const result = await prisma.electionResult.update({
      where: { id },
      data: {
        ...updateData,
        verifiedAt: updateData.verifiedById ? new Date() : undefined,
      },
    });

    if (userId) {
      await auditService.log({
        userId,
        action: 'ELECTION_RESULT_UPDATED',
        entityType: 'ElectionResult',
        entityId: result.id,
        details: { 
          ...updateData, 
          note,
          decisionNote: note,
          targetType: 'ElectionResult',
          targetId: result.id
        },
      });
    }

    if (updateData.verifiedById) {
      await auditService.log({
        userId: updateData.verifiedById,
        action: 'ELECTION_RESULT_VERIFIED',
        entityType: 'ElectionResult',
        entityId: result.id,
        details: { 
          message: `Verified result via update`,
          note,
          decisionNote: note,
          targetType: 'ElectionResult',
          targetId: result.id
        },
      });
    }

    return result;
  }

  async deleteResult(id: string, userId?: string, note?: string) {
    if (!note || note.trim().length === 0) {
      throw new Error('Decision note is required for deleting a result.');
    }
    if (note.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
    const result = await prisma.electionResult.delete({ where: { id } });

    if (userId) {
      await auditService.log({
        userId,
        action: 'ELECTION_RESULT_DELETED',
        entityType: 'ElectionResult',
        entityId: id,
        details: { candidateId: result.candidateId, votes: result.votesReceived, note, decisionNote: note },
      });
    }

    return result;
  }

  // --- Analytics & Readiness ---
  async updateBoothReadiness(id: string, data: {
    status?: string;
    readinessNote?: string;
    userId?: string;
    note?: string;
  }) {
    if (data.note && data.note.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
    const { userId, note, ...updateData } = data;
    const booth = await prisma.booth.update({
      where: { id },
      data: updateData,
    });

    if (userId) {
      await auditService.log({
        userId,
        action: 'ELECTION_BOOTH_READINESS_UPDATED',
        entityType: 'Booth',
        entityId: booth.id,
        details: { 
          ...updateData, 
          note,
          decisionNote: note,
          targetType: 'Booth',
          targetId: booth.id
        },
      });
    }

    return booth;
  }

  async getBoothReadiness(district?: string, orgUnitIds?: string[] | null) {
    const where: any = {};
    if (district) where.district = district;
    if (orgUnitIds) where.orgUnitId = { in: orgUnitIds };

    const booths = await prisma.booth.findMany({
      where,
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

    const boothsWithAudit = await Promise.all(booths.map(async (b) => {
      const logs = await auditService.getLogsForEntity('Booth', b.id);
      return {
        id: b.id,
        name: b.name,
        status: b.status,
        readinessNote: b.readinessNote,
        teamCount: b._count.team,
        deploymentCount: b._count.deployments,
        outreachCount: b._count.outreach,
        readinessScore: this.calculateReadiness(b),
        auditTrail: logs.map(l => ({
          id: l.id,
          action: l.action,
          userId: l.userId || '',
          userDisplayName: l.user?.displayName || l.userId,
          details: safeJsonParse(l.details),
          timestamp: l.timestamp.toISOString(),
        })),
      };
    }));

    return boothsWithAudit;
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
