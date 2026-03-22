import prisma from '../lib/prisma';
import { auditService } from './audit.service';

export class PgisService {
  // --- Ground Intelligence Reports ---
  async createReport(data: {
    reporterId: string;
    type: string;
    content: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    orgUnitId?: string;
    sentimentScore?: number;
    priority?: string;
  }) {
    const report = await prisma.groundIntelligenceReport.create({ data });

    await auditService.log({
      action: 'PGIS_REPORT_CREATED',
      userId: data.reporterId,
      entityType: 'GroundIntelligenceReport',
      entityId: report.id,
      details: { type: data.type },
    });

    return report;
  }

  async getReports(filters: {
    type?: string;
    orgUnitId?: string;
    priority?: string;
  }) {
    return prisma.groundIntelligenceReport.findMany({
      where: filters,
      include: {
        reporter: { select: { displayName: true, email: true } },
        orgUnit: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Community Priorities ---
  async addCommunityPriority(data: {
    orgUnitId: string;
    issue: string;
    description?: string;
    rank?: number;
  }) {
    return prisma.communityPriority.create({ data });
  }

  async getCommunityPriorities(orgUnitId?: string) {
    return prisma.communityPriority.findMany({
      where: orgUnitId ? { orgUnitId } : {},
      include: { orgUnit: true },
      orderBy: [{ orgUnitId: 'asc' }, { rank: 'asc' }],
    });
  }

  // --- Intelligence Alerts ---
  async createAlert(data: {
    title: string;
    content: string;
    severity?: string;
    orgUnitId?: string;
    userId?: string;
  }) {
    return prisma.intelligenceAlert.create({ data });
  }

  async getAlerts(userId?: string, orgUnitId?: string) {
    return prisma.intelligenceAlert.findMany({
      where: {
        OR: [
          { userId },
          { orgUnitId },
          { userId: null, orgUnitId: null }, // Global alerts
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Area Strength Scores ---
  async updateAreaStrength(data: {
    orgUnitId: string;
    partyStrength: number;
    oppositionStrength: number;
    swingVoters: number;
  }) {
    return prisma.areaStrengthScore.upsert({
      where: { orgUnitId: data.orgUnitId },
      update: data,
      create: data,
    });
  }

  async getAreaStrengths() {
    return prisma.areaStrengthScore.findMany({
      include: { orgUnit: true },
      orderBy: { partyStrength: 'desc' },
    });
  }

  // --- Strategic Aggregation ---
  async getStrategicOverview(orgUnitId?: string) {
    const reports = await prisma.groundIntelligenceReport.findMany({
      where: orgUnitId ? { orgUnitId } : {},
      select: { sentimentScore: true, type: true },
    });

    const avgSentiment = reports.length > 0
      ? reports.reduce((acc, r) => acc + (r.sentimentScore || 0), 0) / reports.length
      : 0;

    const typeCounts: Record<string, number> = {};
    reports.forEach((r) => {
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });

    const priorities = await this.getCommunityPriorities(orgUnitId);
    const strengths = await this.getAreaStrengths();

    return {
      avgSentiment,
      typeCounts,
      topPriorities: priorities.slice(0, 5),
      areaStrengths: strengths,
    };
  }
}

export const pgisService = new PgisService();
