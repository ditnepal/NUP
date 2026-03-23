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

  /**
   * Apply for volunteering
   */
  async apply(data: { fullName: string; email: string; phone: string; skills: string; availability: string }) {
    const application = await this.db.volunteerApplication.create({ data });
    await auditService.log({
      action: 'VOLUNTEER_APPLICATION_SUBMITTED',
      entityType: 'VolunteerApplication',
      entityId: application.id,
      details: { fullName: data.fullName }
    });
    return application;
  }

  /**
   * Approve volunteer application
   */
  async approveApplication(applicationId: string) {
    const app = await this.db.volunteerApplication.update({
      where: { id: applicationId },
      data: { status: 'APPROVED' }
    });
    const volunteer = await this.db.volunteer.create({
      data: {
        fullName: app.fullName,
        email: app.email,
        phone: app.phone,
        skills: app.skills,
        availability: app.availability
      }
    });
    await auditService.log({
      action: 'VOLUNTEER_APPLICATION_APPROVED',
      entityType: 'Volunteer',
      entityId: volunteer.id,
      details: { applicationId }
    });
    return volunteer;
  }

  /**
   * Evaluate volunteer performance
   */
  async evaluatePerformance(data: { volunteerId: string; rating: number; feedback: string }) {
    const performance = await this.db.volunteerPerformance.create({ data });
    await auditService.log({
      action: 'VOLUNTEER_EVALUATED',
      entityType: 'VolunteerPerformance',
      entityId: performance.id,
      details: { volunteerId: data.volunteerId, rating: data.rating }
    });
    return performance;
  }

  /**
   * Recognize a volunteer
   */
  async recognize(data: { volunteerId: string; title: string; description: string }) {
    const recognition = await this.db.volunteerRecognition.create({ data });
    await auditService.log({
      action: 'VOLUNTEER_RECOGNIZED',
      entityType: 'VolunteerRecognition',
      entityId: recognition.id,
      details: { volunteerId: data.volunteerId, title: data.title }
    });
    return recognition;
  }

  /**
   * Get volunteer by ID
   */
  async getById(id: string) {
    return await this.db.volunteer.findUnique({
      where: { id },
      include: {
        member: true,
        assignments: { include: { campaign: true } },
        performance: true,
        recognitions: true
      }
    });
  }

  /**
   * Update volunteer
   */
  async update(id: string, data: Partial<{
    fullName: string;
    email: string;
    phone: string;
    skills: string;
    availability: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>) {
    const volunteer = await this.db.volunteer.update({
      where: { id },
      data
    });

    await auditService.log({
      action: 'VOLUNTEER_UPDATED',
      entityType: 'Volunteer',
      entityId: id,
      details: data
    });

    return volunteer;
  }

  /**
   * Delete volunteer
   */
  async delete(id: string) {
    await this.db.volunteer.delete({
      where: { id }
    });

    await auditService.log({
      action: 'VOLUNTEER_DELETED',
      entityType: 'Volunteer',
      entityId: id
    });

    return true;
  }
}

export const volunteerService = new VolunteerService();
