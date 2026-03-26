import prisma from '../lib/prisma';
import { auditService } from './audit.service';

export class GrievanceService {
  async createCategory(data: { name: string; description?: string; slaHours?: number }) {
    return prisma.grievanceCategory.create({ data });
  }

  async getCategories() {
    return prisma.grievanceCategory.findMany({
      include: { _count: { select: { grievances: true } } },
    });
  }

  async createGrievance(data: {
    title: string;
    description: string;
    categoryId: string;
    reporterId: string;
    orgUnitId?: string;
    priority?: string;
  }) {
    const grievance = await prisma.grievance.create({
      data: {
        ...data,
        status: 'OPEN',
      },
    });

    await auditService.log({
      action: 'GRIEVANCE_CREATED',
      userId: data.reporterId,
      entityType: 'Grievance',
      entityId: grievance.id,
      details: { title: data.title },
    });

    return grievance;
  }

  async getGrievances(filters: {
    status?: string;
    priority?: string;
    orgUnitId?: string;
    reporterId?: string;
    orgUnitIds?: string[] | null;
  }) {
    const { orgUnitIds, ...rest } = filters;
    const where: any = { ...rest };
    if (orgUnitIds) {
      where.orgUnitId = { in: orgUnitIds };
    }

    const grievances = await prisma.grievance.findMany({
      where,
      include: {
        category: true,
        reporter: { select: { id: true, displayName: true, email: true } },
        assignments: { include: { user: { select: { displayName: true } } } },
        responses: {
          include: { user: { select: { displayName: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach audit logs to each grievance
    const grievancesWithAudit = await Promise.all(grievances.map(async (g) => {
      const logs = await auditService.getLogsForEntity('Grievance', g.id);
      return {
        ...g,
        auditTrail: logs.map(l => ({
          id: l.id,
          action: l.action,
          userId: l.userId || '',
          user: l.user ? { displayName: l.user.displayName } : undefined,
          details: l.details ? JSON.parse(l.details) : undefined,
          timestamp: l.timestamp.toISOString(),
        })),
      };
    }));

    return grievancesWithAudit;
  }

  async assignGrievance(grievanceId: string, userId: string, assignerId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.grievanceAssignment.updateMany({
        where: { grievanceId, status: 'ACTIVE' },
        data: { status: 'REASSIGNED' },
      });

      const assignment = await tx.grievanceAssignment.create({
        data: { grievanceId, userId, status: 'ACTIVE' },
      });

      await tx.grievance.update({
        where: { id: grievanceId },
        data: { status: 'ASSIGNED' },
      });

      await auditService.log({
        action: 'GRIEVANCE_ASSIGNED',
        userId: assignerId,
        entityType: 'Grievance',
        entityId: grievanceId,
        details: { assignedTo: userId },
      });

      return assignment;
    });
  }

  async addResponse(data: {
    grievanceId: string;
    userId: string;
    content: string;
    isInternal?: boolean;
  }) {
    const response = await prisma.grievanceResponse.create({ data });

    if (!data.isInternal) {
      await prisma.grievance.update({
        where: { id: data.grievanceId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    await auditService.log({
      action: data.isInternal ? 'GRIEVANCE_INTERNAL_NOTE_ADDED' : 'GRIEVANCE_RESPONSE_ADDED',
      userId: data.userId,
      entityType: 'Grievance',
      entityId: data.grievanceId,
      details: { isInternal: data.isInternal },
    });

    return response;
  }

  async resolveGrievance(grievanceId: string, userId: string) {
    const grievance = await prisma.grievance.update({
      where: { id: grievanceId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    await auditService.log({
      action: 'GRIEVANCE_RESOLVED',
      userId,
      entityType: 'Grievance',
      entityId: grievanceId,
    });

    return grievance;
  }

  async escalateGrievance(grievanceId: string, userId: string) {
    const grievance = await prisma.grievance.update({
      where: { id: grievanceId },
      data: { status: 'ESCALATED' },
    });

    await auditService.log({
      action: 'GRIEVANCE_ESCALATED',
      userId,
      entityType: 'Grievance',
      entityId: grievanceId,
    });

    return grievance;
  }
}

export const grievanceService = new GrievanceService();
