import { BaseService } from './base.service';
import { auditService } from './audit.service';

export class VolunteerService extends BaseService {
  /**
   * Register a new volunteer
   */
  async register(data: {
    memberId?: string;
    userId?: string;
    fullName: string;
    email?: string;
    phone?: string;
    skills: string;
    availability?: string;
  }) {
    const volunteer = await this.db.volunteer.create({
      data: {
        ...data,
        status: 'ACTIVE'
      }
    });

    await auditService.log({
      action: 'VOLUNTEER_REGISTERED',
      entityType: 'Volunteer',
      entityId: volunteer.id,
      details: { fullName: data.fullName }
    });

    return volunteer;
  }

  /**
   * Assign a volunteer to a task
   */
  async assign(data: {
    volunteerId: string;
    campaignId?: string;
    taskName: string;
    description?: string;
  }) {
    const assignment = await this.db.volunteerAssignment.create({
      data: {
        ...data,
        status: 'PENDING'
      }
    });

    await auditService.log({
      action: 'VOLUNTEER_ASSIGNED',
      entityType: 'VolunteerAssignment',
      entityId: assignment.id,
      details: { taskName: data.taskName }
    });

    return assignment;
  }

  /**
   * Submit a volunteer report
   */
  async submitReport(data: {
    assignmentId: string;
    content: string;
    hoursSpent?: number;
  }) {
    const report = await this.db.volunteerReport.create({
      data
    });

    // Update assignment status to COMPLETED if report submitted (optional logic)
    await this.db.volunteerAssignment.update({
      where: { id: data.assignmentId },
      data: { status: 'COMPLETED' }
    });

    await auditService.log({
      action: 'VOLUNTEER_REPORT_SUBMITTED',
      entityType: 'VolunteerReport',
      entityId: report.id,
      details: { hoursSpent: data.hoursSpent }
    });

    return report;
  }

  /**
   * Get all active volunteers
   */
  async getActiveVolunteers() {
    return await this.db.volunteer.findMany({
      where: { status: 'ACTIVE' },
      include: {
        member: { select: { membershipId: true, fullName: true } },
        assignments: { where: { status: 'PENDING' } }
      }
    });
  }
}

export const volunteerService = new VolunteerService();
