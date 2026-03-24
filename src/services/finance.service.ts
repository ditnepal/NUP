import prisma from '../lib/prisma';
import { auditService } from './audit.service';

export class FinanceService {
  async createFundraisingCampaign(data: {
    title: string;
    description?: string;
    fundraiserType?: string;
    beneficiaryType?: string;
    candidateId?: string;
    goalAmount: number;
    startDate: Date;
    endDate?: Date;
  }) {
    let candidateSnapshot = null;
    if (data.candidateId) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: data.candidateId },
        include: { constituency: true, electionCycle: true }
      });
      if (candidate) {
        candidateSnapshot = {
          id: candidate.id,
          name: candidate.name,
          position: candidate.position,
          electionType: candidate.electionType,
          electionYear: candidate.electionYear,
          constituency: candidate.constituency?.name,
          province: candidate.province,
          district: candidate.district,
        };
      }
    }

    const campaign = await prisma.fundraisingCampaign.create({
      data: {
        ...data,
        candidateSnapshot: candidateSnapshot as any,
      },
    });

    await auditService.log({
      action: 'FUNDRAISING_CAMPAIGN_CREATED',
      entityType: 'FundraisingCampaign',
      entityId: campaign.id,
      details: { title: campaign.title, goal: campaign.goalAmount, type: campaign.fundraiserType },
    });

    return campaign;
  }

  async processDonation(data: {
    donorInfo: { fullName: string; email: string; phone?: string; address?: string; isAnonymous?: boolean; userId?: string };
    amount: number;
    campaignId?: string;
    paymentMethod: string;
    referenceId: string;
    recordedById?: string;
  }) {
    // 1. Get or create donor profile
    const donor = await prisma.donorProfile.upsert({
      where: { email: data.donorInfo.email },
      update: {
        fullName: data.donorInfo.fullName,
        phone: data.donorInfo.phone,
        address: data.donorInfo.address,
        isAnonymous: data.donorInfo.isAnonymous || false,
        userId: data.donorInfo.userId,
      },
      create: {
        fullName: data.donorInfo.fullName,
        email: data.donorInfo.email,
        phone: data.donorInfo.phone,
        address: data.donorInfo.address,
        isAnonymous: data.donorInfo.isAnonymous || false,
        userId: data.donorInfo.userId,
      },
    });

    // 2. Create transaction (Server-authoritative verification would happen here if integrated with a real gateway)
    const transaction = await prisma.transaction.create({
      data: {
        type: 'INCOME',
        category: 'DONATION',
        amount: data.amount,
        description: `Donation from ${donor.fullName}${data.campaignId ? ' for campaign ' + data.campaignId : ''}`,
        status: 'COMPLETED', // In a real app, this might start as PENDING
        paymentMethod: data.paymentMethod,
        referenceId: data.referenceId,
        recordedById: data.recordedById,
      },
    });

    // 3. Create donation record
    const donation = await prisma.donation.create({
      data: {
        donorId: donor.id,
        campaignId: data.campaignId,
        transactionId: transaction.id,
        amount: data.amount,
        status: 'VERIFIED',
        receiptUrl: `/api/v1/finance/receipts/${transaction.id}`,
      },
    });

    // 4. Update donor profile stats
    await prisma.donorProfile.update({
      where: { id: donor.id },
      data: {
        totalDonated: { increment: data.amount },
        donationCount: { increment: 1 },
      },
    });

    // 5. Update campaign stats if applicable
    if (data.campaignId) {
      await prisma.fundraisingCampaign.update({
        where: { id: data.campaignId },
        data: {
          currentAmount: { increment: data.amount },
        },
      });
    }

    await auditService.log({
      action: 'DONATION_PROCESSED',
      userId: data.donorInfo.userId,
      entityType: 'Donation',
      entityId: donation.id,
      details: { amount: data.amount, transactionId: transaction.id },
    });

    return donation;
  }

  async processRefund(donationId: string, reason: string, recordedById: string) {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { transaction: true, donor: true, campaign: true },
    });

    if (!donation) throw new Error('Donation not found');
    if (donation.status === 'REFUNDED') throw new Error('Donation already refunded');

    // 1. Update donation status
    await prisma.donation.update({
      where: { id: donationId },
      data: { status: 'REFUNDED', notes: `Refunded: ${reason}` },
    });

    // 2. Update transaction status
    await prisma.transaction.update({
      where: { id: donation.transactionId },
      data: { status: 'REFUNDED', description: `REFUND: ${donation.transaction.description} - ${reason}` },
    });

    // 3. Create a balancing expense transaction for audit
    await prisma.transaction.create({
      data: {
        type: 'EXPENSE',
        category: 'REFUND',
        amount: donation.amount,
        description: `Refund for donation ${donationId} - ${reason}`,
        status: 'COMPLETED',
        recordedById,
      },
    });

    // 4. Update donor profile stats
    await prisma.donorProfile.update({
      where: { id: donation.donorId },
      data: {
        totalDonated: { decrement: donation.amount },
        donationCount: { decrement: 1 },
      },
    });

    // 5. Update campaign stats if applicable
    if (donation.campaignId) {
      await prisma.fundraisingCampaign.update({
        where: { id: donation.campaignId },
        data: {
          currentAmount: { decrement: donation.amount },
        },
      });
    }

    await auditService.log({
      action: 'DONATION_REFUNDED',
      userId: recordedById,
      entityType: 'Donation',
      entityId: donationId,
      details: { amount: donation.amount, reason },
    });

    return { success: true };
  }

  async getFinanceAnalytics() {
    const totalRaised = await prisma.donation.aggregate({
      where: { status: 'VERIFIED' },
      _sum: { amount: true },
    });

    const donorCount = await prisma.donorProfile.count();
    
    const recentDonations = await prisma.donation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { donor: true, campaign: true },
    });

    const campaigns = await prisma.fundraisingCampaign.findMany({
      include: {
        _count: { select: { donations: true } },
      },
    });

    // Consolidated Metrics
    const membershipCollections = await prisma.transaction.aggregate({
      where: { category: 'MEMBERSHIP_FEE', type: 'INCOME', status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const renewalCollections = await prisma.transaction.aggregate({
      where: { category: 'RENEWAL_FEE', type: 'INCOME', status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const fundraiserCollections = totalRaised._sum.amount || 0;
    const totalCollections = (membershipCollections._sum.amount || 0) + 
                             (renewalCollections._sum.amount || 0) + 
                             fundraiserCollections;

    const refundStats = await prisma.transaction.aggregate({
      where: { category: 'REFUND', type: 'EXPENSE', status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { id: true },
    });

    const recentTransactionCount = await prisma.transaction.count({
      where: {
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    return {
      totalRaised: fundraiserCollections,
      donorCount,
      recentDonations,
      campaigns,
      membershipCollections: membershipCollections._sum.amount || 0,
      renewalCollections: renewalCollections._sum.amount || 0,
      fundraiserCollections,
      totalCollections,
      refundTotal: refundStats._sum.amount || 0,
      refundCount: refundStats._count.id || 0,
      recentTransactionCount,
    };
  }

  async listPaymentIntegrations() {
    const integrations = await prisma.paymentIntegration.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return integrations.map(i => ({
      ...i,
      supportedModules: i.supportedModules.split(',').filter(Boolean),
    }));
  }

  async createPaymentIntegration(data: any) {
    const integration = await prisma.paymentIntegration.create({
      data: {
        ...data,
        supportedModules: Array.isArray(data.supportedModules) 
          ? data.supportedModules.join(',') 
          : data.supportedModules,
      },
    });

    await auditService.log({
      action: 'PAYMENT_INTEGRATION_CREATED',
      entityType: 'PaymentIntegration',
      entityId: integration.id,
      details: { provider: integration.provider, displayName: integration.displayName },
    });

    return {
      ...integration,
      supportedModules: integration.supportedModules.split(',').filter(Boolean),
    };
  }

  async updatePaymentIntegration(id: string, data: any) {
    const integration = await prisma.paymentIntegration.update({
      where: { id },
      data: {
        ...data,
        supportedModules: Array.isArray(data.supportedModules) 
          ? data.supportedModules.join(',') 
          : data.supportedModules,
      },
    });

    await auditService.log({
      action: 'PAYMENT_INTEGRATION_UPDATED',
      entityType: 'PaymentIntegration',
      entityId: integration.id,
      details: { provider: integration.provider, displayName: integration.displayName },
    });

    return {
      ...integration,
      supportedModules: integration.supportedModules.split(',').filter(Boolean),
    };
  }

  async deletePaymentIntegration(id: string) {
    await prisma.paymentIntegration.delete({ where: { id } });
    await auditService.log({
      action: 'PAYMENT_INTEGRATION_DELETED',
      entityType: 'PaymentIntegration',
      entityId: id,
    });
    return { success: true };
  }
}

export const financeService = new FinanceService();
