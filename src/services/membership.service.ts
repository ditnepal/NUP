import { safeJsonParse } from '../lib/json';
import { BaseService } from './base.service';
import { auditService } from './audit.service';
import { notificationService } from './notification.service';

export class MembershipService extends BaseService {
  /**
   * Submit a new membership application
   */
  async apply(data: {
    fullName: string;
    email?: string;
    mobile?: string;
    citizenshipNumber?: string;
    dateOfBirth?: Date;
    gender?: string;
    fatherName?: string;
    motherName?: string;
    citizenshipDistrict?: string;
    citizenshipIssueDate?: Date;
    province?: string;
    district?: string;
    localLevel?: string;
    ward?: number;
    tole?: string;
    alternateContactName?: string;
    alternateContactMobile?: string;
    occupation?: string;
    applicationMode: 'FORM' | 'VIDEO' | 'ASSISTED';
    videoUrl?: string;
    identityDocumentUrl?: string;
    identityDocumentType?: string;
    profilePhotoUrl?: string;
    helperName?: string;
    helperPhone?: string;
    helperRole?: string;
    declaration?: boolean;
    paymentMethod?: string;
    orgUnitId: string;
  }) {
    // 1. Duplicate Detection (only if citizenshipNumber or email provided)
    if (data.citizenshipNumber || data.email) {
      const existing = await this.db.member.findFirst({
        where: {
          OR: [
            data.citizenshipNumber ? { citizenshipNumber: data.citizenshipNumber } : {},
            data.email ? { email: data.email } : {},
          ].filter(Boolean) as any
        }
      });

      if (existing) {
        throw new Error('Duplicate application detected: Citizenship or Email already registered.');
      }
    }

    // 2. Eligibility Check (ECN: Age >= 18) - only if DOB provided
    if (data.dateOfBirth) {
      const age = this.calculateAge(data.dateOfBirth);
      if (age < 18) {
        throw new Error('Ineligible: Applicant must be at least 18 years old.');
      }
    }

    // 3. Generate Tracking Code
    const trackingCode = `T-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 4. Create Member (Pending)
    const member = await this.db.member.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        citizenshipNumber: data.citizenshipNumber,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        fatherName: data.fatherName,
        motherName: data.motherName,
        citizenshipDistrict: data.citizenshipDistrict,
        citizenshipIssueDate: data.citizenshipIssueDate,
        province: data.province,
        district: data.district,
        localLevel: data.localLevel,
        ward: data.ward,
        tole: data.tole,
        alternateContactName: data.alternateContactName,
        alternateContactMobile: data.alternateContactMobile,
        occupation: data.occupation,
        applicationMode: data.applicationMode,
        videoUrl: data.videoUrl,
        identityDocumentUrl: data.identityDocumentUrl,
        identityDocumentType: data.identityDocumentType,
        profilePhotoUrl: data.profilePhotoUrl,
        helperName: data.helperName,
        helperPhone: data.helperPhone,
        helperRole: data.helperRole,
        paymentMethod: data.paymentMethod,
        trackingCode,
        status: 'PENDING',
        orgUnitId: data.orgUnitId,
      }
    });

    await auditService.log({
      action: 'MEMBERSHIP_APPLIED',
      entityType: 'Member',
      entityId: member.id,
      details: { trackingCode }
    });

    return member;
  }

  /**
   * Local Unit Verification
   */
  async verify(memberId: string, verifierId: string, note?: string) {
    const member = await this.db.member.update({
      where: { id: memberId },
      data: {
        status: 'VERIFIED',
        verifiedById: verifierId,
        verifiedAt: new Date(),
        reviewNote: note || undefined
      }
    });

    await auditService.log({
      action: 'MEMBERSHIP_VERIFIED',
      userId: verifierId,
      entityType: 'Member',
      entityId: member.id,
      details: { 
        note,
        decisionNote: note,
        targetType: 'Member',
        targetId: member.id
      }
    });

    await notificationService.notify({
      userId: member.userId || '', // If linked to user
      title: 'Membership Verified',
      message: 'Your membership has been verified by the local unit and is pending final approval.',
      type: 'SUCCESS'
    });

    return member;
  }

  /**
   * Final Approval & ID Generation
   */
  async approve(memberId: string, approverId: string, note?: string) {
    const year = new Date().getFullYear();
    
    // Safer ID generation: Find the highest current ID for this year and increment
    let membershipId = '';
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const lastMember = await this.db.member.findFirst({
        where: { membershipId: { startsWith: `NUP-${year}-` } },
        orderBy: { membershipId: 'desc' },
        select: { membershipId: true }
      });

      let nextNum = 1;
      if (lastMember && lastMember.membershipId) {
        const parts = lastMember.membershipId.split('-');
        const lastNum = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }

      membershipId = `NUP-${year}-${nextNum.toString().padStart(4, '0')}`;

      try {
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        const member = await this.db.member.update({
          where: { id: memberId },
          data: {
            status: 'ACTIVE',
            membershipId,
            approvedById: approverId,
            approvedAt: new Date(),
            reviewNote: note || undefined,
            joinedDate: new Date(),
            expiryDate,
            qrCodeData: `QR-${Math.random().toString(36).substring(2, 12).toUpperCase()}` // Auto-generate on approval
          }
        });

        await auditService.log({
          action: 'MEMBERSHIP_APPROVED',
          userId: approverId,
          entityType: 'Member',
          entityId: member.id,
          details: { 
            membershipId,
            note,
            decisionNote: note,
            previousState: 'PENDING',
            newState: 'ACTIVE',
            targetType: 'Member',
            targetId: member.id
          }
        });

        return member;
      } catch (error: any) {
        // If unique constraint violation, retry with next number
        if (error.code === 'P2002') {
          attempts++;
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('Failed to generate a unique Membership ID after multiple attempts');
  }

  /**
   * Generate/Regenerate Member Card (QR Code)
   */
  async generateCard(memberId: string) {
    // In a real app, this would generate a QR code.
    // For now, we simulate it with a random string.
    const qrCodeData = `QR-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    
    const member = await this.db.member.update({
      where: { id: memberId },
      data: { qrCodeData }
    });

    await auditService.log({
      action: 'MEMBERSHIP_CARD_GENERATED',
      entityType: 'Member',
      entityId: member.id,
      details: { qrCodeData }
    });

    return member;
  }

  /**
   * Renew Membership
   */
  async renew(memberId: string) {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const member = await this.db.member.update({
      where: { id: memberId },
      data: {
        expiryDate,
        status: 'ACTIVE'
      }
    });

    await auditService.log({
      action: 'MEMBERSHIP_RENEWED',
      entityType: 'Member',
      entityId: member.id,
      details: { newExpiryDate: expiryDate }
    });

    return member;
  }

  /**
   * Transfer Membership to another OrgUnit
   */
  async transfer(memberId: string, newOrgUnitId: string) {
    const member = await this.db.member.update({
      where: { id: memberId },
      data: { orgUnitId: newOrgUnitId }
    });

    await auditService.log({
      action: 'MEMBERSHIP_TRANSFERRED',
      entityType: 'Member',
      entityId: member.id,
      details: { newOrgUnitId }
    });

    return member;
  }

  /**
   * Suspend Membership
   */
  async suspend(memberId: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Decision note is required for suspension.');
    }
    if (reason.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
    const member = await this.db.member.findUnique({ where: { id: memberId } });
    if (!member) throw new Error('Member not found');
    const history = JSON.parse(member.suspensionHistory || '[]');
    history.push({ reason, date: new Date() });

    const updatedMember = await this.db.member.update({
      where: { id: memberId },
      data: {
        status: 'SUSPENDED',
        suspensionHistory: JSON.stringify(history)
      }
    });

    await auditService.log({
      action: 'MEMBERSHIP_SUSPENDED',
      entityType: 'Member',
      entityId: member.id,
      details: { 
        reason,
        decisionNote: reason,
        previousState: member.status,
        newState: 'SUSPENDED',
        targetType: 'Member',
        targetId: member.id
      }
    });

    return updatedMember;
  }

  /**
   * Terminate Membership
   */
  async terminate(memberId: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Decision note is required for termination.');
    }
    if (reason.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
    const member = await this.db.member.findUnique({ where: { id: memberId } });
    if (!member) throw new Error('Member not found');
    const history = JSON.parse(member.terminationHistory || '[]');
    history.push({ reason, date: new Date() });

    const updatedMember = await this.db.member.update({
      where: { id: memberId },
      data: {
        status: 'TERMINATED',
        terminationHistory: JSON.stringify(history)
      }
    });

    await auditService.log({
      action: 'MEMBERSHIP_TERMINATED',
      entityType: 'Member',
      entityId: member.id,
      details: { 
        reason,
        decisionNote: reason,
        previousState: member.status,
        newState: 'TERMINATED',
        targetType: 'Member',
        targetId: member.id
      }
    });

    return updatedMember;
  }

  /**
   * Reject Membership Application
   */
  async reject(memberId: string, reason?: string) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Decision note is required for rejection.');
    }
    if (reason.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
    const member = await this.db.member.update({
      where: { id: memberId },
      data: {
        status: 'REJECTED',
        reviewNote: reason || undefined,
        terminationHistory: reason ? JSON.stringify([{ reason, date: new Date() }]) : undefined
      }
    });

    await auditService.log({
      action: 'MEMBERSHIP_REJECTED',
      entityType: 'Member',
      entityId: member.id,
      details: { 
        reason,
        decisionNote: reason,
        previousState: 'PENDING',
        newState: 'REJECTED',
        targetType: 'Member',
        targetId: member.id
      }
    });

    return member;
  }

  /**
   * Escalate Membership Application to Parent Unit
   */
  async escalate(memberId: string, note?: string) {
    const member = await this.db.member.findUnique({
      where: { id: memberId },
      include: { orgUnit: true }
    });

    if (!member) throw new Error('Member not found');
    if (!member.orgUnitId) throw new Error('Member has no assigned unit');

    // Find parent unit
    const unit = await this.db.organizationUnit.findUnique({
      where: { id: member.orgUnitId }
    });

    if (!unit || !unit.parentId) {
      throw new Error('No parent unit found to escalate to');
    }

    const updatedMember = await this.db.member.update({
      where: { id: memberId },
      data: {
        isEscalated: true,
        escalatedAt: new Date(),
        escalatedToUnitId: unit.parentId,
        escalationNote: note || undefined
      }
    });

    await auditService.log({
      action: 'MEMBERSHIP_ESCALATED',
      entityType: 'Member',
      entityId: member.id,
      details: { 
        note, 
        decisionNote: note,
        escalatedToUnitId: unit.parentId,
        targetType: 'Member',
        targetId: member.id
      }
    });

    return updatedMember;
  }

  async getMembers(filters: { status?: string; isEscalated?: boolean; orgUnitIds?: string[] }) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.isEscalated !== undefined) query.isEscalated = filters.isEscalated;
    if (filters.orgUnitIds) query.orgUnitId = { in: filters.orgUnitIds };

    const members = await this.db.member.findMany({
      where: query,
      include: {
        orgUnit: { select: { name: true, level: true } },
        user: { select: { email: true, displayName: true, phoneNumber: true } },
        verifiedBy: { select: { displayName: true } },
        approvedBy: { select: { displayName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Attach audit logs to each member
    const membersWithLogs = await Promise.all(
      members.map(async (m) => {
        const logs = await auditService.getLogsForEntity('Member', m.id);
        return {
          ...m,
          auditTrail: logs.map(l => ({
            id: l.id,
            action: l.action,
            timestamp: l.timestamp.toISOString(),
            details: safeJsonParse(l.details),
            userDisplayName: l.user?.displayName || l.userId,
            userId: l.userId
          })),
        };
      })
    );

    return membersWithLogs;
  }

  async getMemberById(id: string) {
    const member = await this.db.member.findUnique({
      where: { id },
      include: { 
        orgUnit: true, 
        user: { select: { email: true, displayName: true, phoneNumber: true } },
        verifiedBy: { select: { displayName: true } },
        approvedBy: { select: { displayName: true } }
      }
    });

    if (!member) return null;

    const logs = await auditService.getLogsForEntity('Member', member.id);
    return {
      ...member,
      auditTrail: logs.map(l => ({
        id: l.id,
        action: l.action,
        timestamp: l.timestamp.toISOString(),
        details: safeJsonParse(l.details),
        userDisplayName: l.user?.displayName || l.userId,
        userId: l.userId
      })),
    };
  }

  private calculateAge(dob: Date): number {
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
}

export const membershipService = new MembershipService();
