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
    const [reports, orgUnit] = await Promise.all([
      prisma.groundIntelligenceReport.findMany({
        where: orgUnitId ? { orgUnitId } : {},
        select: { sentimentScore: true, type: true, priority: true, content: true, createdAt: true, orgUnit: { select: { name: true } } },
      }),
      orgUnitId ? prisma.organizationUnit.findUnique({ where: { id: orgUnitId }, select: { name: true } }) : Promise.resolve({ name: 'National Command' })
    ]);

    const avgSentiment = reports.length > 0
      ? reports.reduce((acc, r) => acc + (r.sentimentScore || 0), 0) / reports.length
      : 0;

    const typeCounts: Record<string, number> = {};
    reports.forEach((r) => {
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });

    const priorities = await this.getCommunityPriorities(orgUnitId);
    const strengths = await this.getAreaStrengths();

    // Hotspots: Org units with most issues
    const hotspotGrievances = await prisma.grievance.groupBy({
      by: ['orgUnitId'],
      where: { status: 'OPEN', orgUnitId: orgUnitId ? { equals: orgUnitId } : { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const hotspotIncidents = await prisma.electionIncident.groupBy({
      by: ['orgUnitId'],
      where: { status: 'REPORTED', orgUnitId: orgUnitId ? { equals: orgUnitId } : { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    // Fetch org unit names for hotspots
    const hotspotUnitIds = Array.from(new Set([
      ...hotspotGrievances.map(h => h.orgUnitId),
      ...hotspotIncidents.map(h => h.orgUnitId)
    ])).filter(Boolean) as string[];

    const hotspotUnits = await prisma.organizationUnit.findMany({
      where: { id: { in: hotspotUnitIds } },
      select: { id: true, name: true }
    });

    const hotspots = hotspotUnits.map(unit => {
      const gCount = hotspotGrievances.find(h => h.orgUnitId === unit.id)?._count.id || 0;
      const iCount = hotspotIncidents.find(h => h.orgUnitId === unit.id)?._count.id || 0;
      return {
        id: unit.id,
        name: unit.name,
        grievanceCount: gCount,
        incidentCount: iCount,
        totalIssues: gCount + iCount
      };
    }).sort((a, b) => b.totalIssues - a.totalIssues);

    // Attention Needed: Critical/High priority items
    const [criticalGrievances, criticalIncidents] = await Promise.all([
      prisma.grievance.findMany({
        where: { status: 'OPEN', priority: { in: ['CRITICAL', 'HIGH'] }, orgUnitId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { orgUnit: { select: { name: true } } }
      }),
      prisma.electionIncident.findMany({
        where: { status: 'REPORTED', severity: { in: ['CRITICAL', 'HIGH'] }, orgUnitId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { booth: { include: { orgUnit: { select: { name: true } } } } }
      })
    ]);

    const attentionNeeded = [
      ...criticalGrievances.map(g => ({
        id: g.id,
        type: 'GRIEVANCE',
        title: g.title,
        priority: g.priority,
        location: g.orgUnit?.name,
        createdAt: g.createdAt
      })),
      ...criticalIncidents.map(i => ({
        id: i.id,
        type: 'INCIDENT',
        title: i.type + ': ' + i.description.substring(0, 50),
        priority: i.severity,
        location: i.booth?.orgUnit?.name || i.booth?.name,
        createdAt: i.createdAt
      }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);

    return {
      scopeName: orgUnit?.name || 'National Command',
      avgSentiment,
      typeCounts,
      topPriorities: priorities.slice(0, 5),
      areaStrengths: strengths,
      hotspots,
      attentionNeeded,
      signalCounts: {
        grievances: await prisma.grievance.count({ where: { status: 'OPEN', orgUnitId } }),
        incidents: await prisma.electionIncident.count({ where: { status: 'REPORTED', booth: orgUnitId ? { orgUnitId } : undefined } }),
        surveyResponses: await prisma.surveyResponse.count(),
        reports: reports.length
      }
    };
  }

  // --- Unified Ground Signals ---
  async getSignals(limit = 20) {
    const [reports, grievances, incidents] = await Promise.all([
      prisma.groundIntelligenceReport.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { orgUnit: { select: { name: true } } }
      }),
      prisma.grievance.findMany({
        take: limit,
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        include: { orgUnit: { select: { name: true } } }
      }),
      prisma.electionIncident.findMany({
        take: limit,
        where: { status: 'REPORTED' },
        orderBy: { createdAt: 'desc' },
        include: { booth: { include: { orgUnit: { select: { name: true } } } } }
      })
    ]);

    const signals = [
      ...reports.map(r => ({
        id: r.id,
        source: 'REPORT' as const,
        type: r.type,
        content: r.content,
        priority: r.priority as any,
        status: 'ACTIVE',
        location: r.orgUnit?.name || r.locationName,
        createdAt: r.createdAt.toISOString()
      })),
      ...grievances.map(g => ({
        id: g.id,
        source: 'GRIEVANCE' as const,
        type: 'PUBLIC_ISSUE',
        content: g.title + ': ' + g.description,
        priority: g.priority.toUpperCase() as any,
        status: g.status,
        location: g.orgUnit?.name,
        createdAt: g.createdAt.toISOString()
      })),
      ...incidents.map(i => ({
        id: i.id,
        source: 'INCIDENT' as const,
        type: i.type,
        content: i.description,
        priority: i.severity as any,
        status: i.status,
        location: i.booth?.orgUnit?.name || i.booth?.name,
        createdAt: i.createdAt.toISOString()
      }))
    ];

    return signals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  }
}

export const pgisService = new PgisService();
