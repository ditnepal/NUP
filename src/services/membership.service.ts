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
    phone?: string;
    citizenshipNumber?: string;
    dateOfBirth?: Date;
    gender?: string;
    bloodGroup?: string;
    province?: string;
    district?: string;
    localLevel?: string;
    ward?: number;
    orgUnitId: string;
    applicationMode: 'FORM' | 'VIDEO' | 'ASSISTED';
    videoUrl?: string;
    identityDocumentUrl?: string;
    identityDocumentType?: string;
    profilePhotoUrl?: string;
    helperName?: string;
    helperPhone?: string;
    helperRole?: string;
    declaration?: boolean;
  }) {
    // 1. Duplicate Detection (only if citizenshipNumber or email provided)
    if (data.citizenshipNumber || data.email) {
      const existing = await this.db.member.findFirst({
        where: {
          OR: [
            data.citizenshipNumber ? { citizenshipNumber: data.citizenshipNumber } : {},
            data.email ? { user: { email: data.email } } : {},
          ].filter(Boolean) as any
        }
      });

      if (existing) {
        throw new Error('Duplicate application detected: Citizenship or Email already registered.');
      }
    }

    // 2. Conditional Validation
    if (data.applicationMode === 'FORM') {
      if (!data.province || !data.district || !data.localLevel || !data.ward || !data.declaration) {
        throw new Error('All address fields and declaration are required for form applications.');
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
        ...data,
        trackingCode,
        status: 'PENDING',
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
  async verify(memberId: string, verifierId: string) {
    const member = await this.db.member.update({
      where: { id: memberId },
      data: {
        status: 'VERIFIED',
        verifiedById: verifierId
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
  async approve(memberId: string, approverId: string) {
    const year = new Date().getFullYear();
    const count = await this.db.member.count({
      where: { status: 'ACTIVE', membershipId: { startsWith: `NUP-${year}` } }
    });
    
    const membershipId = `NUP-${year}-${(count + 1).toString().padStart(4, '0')}`;
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year renewal cycle

    const member = await this.db.member.update({
      where: { id: memberId },
      data: {
        status: 'ACTIVE',
        membershipId,
        approvedById: approverId,
        joinedDate: new Date(),
        expiryDate
      }
    });

    await auditService.log({
      action: 'MEMBERSHIP_APPROVED',
      userId: approverId,
      entityType: 'Member',
      entityId: member.id,
      details: { membershipId }
    });

    return member;
  }

  /**
   * Generate/Regenerate Member Card (QR Code)
   */
  async generateCard(memberId: string) {
    // In a real app, this would generate a QR code.
    // For now, we simulate it with a random string.
    const qrCodeData = `QR-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    
    return await this.db.member.update({
      where: { id: memberId },
      data: { qrCodeData }
    });
  }

  /**
   * Renew Membership
   */
  async renew(memberId: string) {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    return await this.db.member.update({
      where: { id: memberId },
      data: {
        expiryDate,
        status: 'ACTIVE'
      }
    });
  }

  /**
   * Transfer Membership to another OrgUnit
   */
  async transfer(memberId: string, newOrgUnitId: string) {
    return await this.db.member.update({
      where: { id: memberId },
      data: { orgUnitId: newOrgUnitId }
    });
  }

  /**
   * Suspend Membership
   */
  async suspend(memberId: string, reason: string) {
    const member = await this.db.member.findUnique({ where: { id: memberId } });
    const history = JSON.parse(member?.suspensionHistory || '[]');
    history.push({ reason, date: new Date() });

    return await this.db.member.update({
      where: { id: memberId },
      data: {
        status: 'SUSPENDED',
        suspensionHistory: JSON.stringify(history)
      }
    });
  }

  /**
   * Terminate Membership
   */
  async terminate(memberId: string, reason: string) {
    const member = await this.db.member.findUnique({ where: { id: memberId } });
    const history = JSON.parse(member?.terminationHistory || '[]');
    history.push({ reason, date: new Date() });

    return await this.db.member.update({
      where: { id: memberId },
      data: {
        status: 'TERMINATED',
        terminationHistory: JSON.stringify(history)
      }
    });
  }

  private calculateAge(dob: Date): number {
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
}

export const membershipService = new MembershipService();
