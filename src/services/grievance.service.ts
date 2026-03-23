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
  }) {
    return prisma.grievance.findMany({
      where: filters,
      include: {
        category: true,
        reporter: { select: { displayName: true, email: true } },
        assignments: { include: { user: { select: { displayName: true } } } },
        responses: {
          include: { user: { select: { displayName: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
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
    return prisma.grievance.update({
      where: { id: grievanceId },
      data: { status: 'ESCALATED' },
    });
  }
}

export const grievanceService = new GrievanceService();
