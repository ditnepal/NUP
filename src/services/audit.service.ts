import { BaseService } from './base.service';

export class AuditService extends BaseService {
  async log(params: {
    action: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await this.db.auditLog.create({
        data: {
          action: params.action,
          userId: params.userId,
          entityType: params.entityType,
          entityId: params.entityId,
          details: params.details ? JSON.stringify(params.details) : null,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      console.error('Audit Logging Error:', error);
      // Fail silently for audit logs to not block main operations
    }
  }

  async getLogsForEntity(entityType: string, entityId: string) {
    return this.db.auditLog.findMany({
      where: { entityType, entityId },
      include: { user: { select: { displayName: true } } },
      orderBy: { timestamp: 'desc' },
    });
  }
}

export const auditService = new AuditService();
