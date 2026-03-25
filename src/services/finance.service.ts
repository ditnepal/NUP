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
    isManual?: boolean;
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

    // 2. Create transaction
    // If it's a manual payment or a public donation, it starts as PENDING
    // For online payment methods (Khalti, eSewa), it MUST start as PENDING until verified
    const isOnlinePayment = ['KHALTI', 'ESEWA'].includes(data.paymentMethod);
    const isPending = data.isManual || isOnlinePayment || !data.recordedById;
    
    const transaction = await prisma.transaction.create({
      data: {
        type: 'INCOME',
        category: 'DONATION',
        amount: data.amount,
        description: `Donation from ${donor.fullName}${data.campaignId ? ' for campaign ' + data.campaignId : ''}`,
        status: isPending ? 'PENDING' : 'COMPLETED',
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
        status: isPending ? 'PENDING' : 'VERIFIED',
        paymentMethod: data.paymentMethod,
        receiptUrl: `/api/v1/finance/receipts/${transaction.id}`,
      },
    });

    // 4. Update donor profile stats (Only if verified/completed)
    if (!isPending) {
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
    }

    await auditService.log({
      action: 'DONATION_PROCESSED',
      userId: data.donorInfo.userId,
      entityType: 'Donation',
      entityId: donation.id,
      details: { amount: data.amount, transactionId: transaction.id, status: transaction.status },
    });

    return donation;
  }

  /**
   * Initiate a manual payment for Membership or Renewals
   * Creates a pending transaction record for later verification
   */
  async initiateManualPayment(data: {
    module: 'MEMBERSHIP' | 'RENEWALS';
    amount: number;
    paymentMethod: string;
    description: string;
    memberId?: string;
    renewalRequestId?: string;
    recordedById?: string;
  }) {
    const transaction = await prisma.transaction.create({
      data: {
        type: 'INCOME',
        category: data.module === 'MEMBERSHIP' ? 'MEMBERSHIP_FEE' : 'RENEWAL_FEE',
        amount: data.amount,
        description: data.description,
        status: 'PENDING',
        paymentMethod: data.paymentMethod,
        memberId: data.memberId,
        renewalRequestId: data.renewalRequestId,
        recordedById: data.recordedById,
      },
    });

    await auditService.log({
      action: 'PAYMENT_INITIATED',
      userId: data.recordedById,
      entityType: 'Transaction',
      entityId: transaction.id,
      details: { module: data.module, amount: data.amount, method: data.paymentMethod },
    });

    return transaction;
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

    const pendingDonationsStats = await prisma.donation.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: { id: true },
    });

    const pendingTransactionStats = await prisma.transaction.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: { id: true },
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
      pendingDonationsCount: pendingDonationsStats._count.id || 0,
      pendingDonationsAmount: pendingDonationsStats._sum.amount || 0,
      pendingTransactionCount: pendingTransactionStats._count.id || 0,
      pendingTransactionAmount: pendingTransactionStats._sum.amount || 0,
    };
  }

  async listPublicPaymentIntegrations(module?: string) {
    const integrations = await prisma.paymentIntegration.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        provider: true,
        displayName: true,
        region: true,
        mode: true,
        sortOrder: true,
        supportedModules: true,
        instructions: true,
      }
    });
    
    let parsed = integrations.map(i => ({
      ...i,
      supportedModules: i.supportedModules.split(',').filter(Boolean),
    }));

    if (module) {
      parsed = parsed.filter(i => i.supportedModules.includes(module));
    }

    return parsed;
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

  async initiatePayment(data: {
    amount: number;
    paymentMethod: string;
    purchaseOrderId: string;
    purchaseOrderName: string;
    customerInfo: { fullName: string; email: string; phone?: string };
    returnUrl: string;
  }) {
    const integration = await prisma.paymentIntegration.findFirst({
      where: { provider: data.paymentMethod, enabled: true },
    });

    if (!integration) {
      throw new Error(`Payment provider ${data.paymentMethod} not found or disabled`);
    }

    const isTest = integration.mode === 'TEST';
    const amountInPaisa = Math.round(data.amount * 100);
    const finalReturnUrl = data.returnUrl.includes('?') 
      ? `${data.returnUrl}&purchase_order_id=${data.purchaseOrderId}`
      : `${data.returnUrl}?purchase_order_id=${data.purchaseOrderId}`;

    if (data.paymentMethod === 'KHALTI') {
      const secretKey = process.env[integration.secretRef || 'KHALTI_SECRET_KEY'] || integration.secretRef;
      if (!secretKey) {
        throw new Error('Khalti secret key not configured in environment or integration settings');
      }

      const endpoint = isTest 
        ? 'https://a.khalti.com/api/v2/epayment/initiate/' 
        : 'https://khalti.com/api/v2/epayment/initiate/';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: finalReturnUrl,
          website_url: finalReturnUrl.split('/')[0] + '//' + finalReturnUrl.split('/')[2],
          amount: amountInPaisa,
          purchase_order_id: data.purchaseOrderId,
          purchase_order_name: data.purchaseOrderName,
          customer_info: {
            name: data.customerInfo.fullName,
            email: data.customerInfo.email,
            phone: data.customerInfo.phone || '9800000000',
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(`Khalti initiation failed: ${JSON.stringify(result)}`);
      }

      return {
        type: 'REDIRECT',
        url: result.payment_url,
        pidx: result.pidx,
      };
    }

    if (data.paymentMethod === 'ESEWA') {
      let secretKey = process.env[integration.secretRef || 'ESEWA_SECRET_KEY'] || integration.secretRef;
      
      // Use standard eSewa test secret key if in TEST mode and no valid key is provided
      if (isTest && (!secretKey || secretKey === 'ESEWA_SECRET_KEY_TEST')) {
        secretKey = '8gBm/:&EnhH.1/q';
      }

      if (!secretKey) {
        throw new Error('eSewa secret key not configured in environment or integration settings');
      }

      const productCode = isTest ? 'EPAYTEST' : (integration.publicKey || 'ESEWA_PRODUCT_CODE');
      const endpoint = isTest
        ? 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
        : 'https://epay.esewa.com.np/api/epay/main/v2/form';

      // eSewa v2 signature: total_amount,transaction_uuid,product_code
      // amount, tax_amount, product_service_charge, product_delivery_charge, total_amount, transaction_uuid, product_code
      const totalAmount = data.amount;
      const transactionUuid = data.purchaseOrderId;
      
      const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
      
      const { createHmac } = await import('crypto');
      const signature = createHmac('sha256', secretKey)
        .update(signatureString)
        .digest('base64');

      return {
        type: 'FORM',
        url: endpoint,
        params: {
          amount: totalAmount,
          tax_amount: 0,
          product_service_charge: 0,
          product_delivery_charge: 0,
          total_amount: totalAmount,
          transaction_uuid: transactionUuid,
          product_code: productCode,
          success_url: finalReturnUrl,
          failure_url: finalReturnUrl,
          signed_field_names: 'total_amount,transaction_uuid,product_code',
          signature: signature,
        },
      };
    }

    throw new Error(`Provider ${data.paymentMethod} initiation not implemented`);
  }

  async verifyTransaction(id: string, reviewerId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        donation: {
          include: {
            donor: true,
            campaign: true,
          }
        },
        member: true,
        renewalRequest: true,
      }
    });

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'PENDING') throw new Error('Transaction is not pending');

    // 1. Update transaction status
    await prisma.transaction.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date(),
      }
    });

    // 2. Handle module specific logic
    if (transaction.donation) {
      const donation = transaction.donation;
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: 'VERIFIED' }
      });

      // Update donor profile stats
      await prisma.donorProfile.update({
        where: { id: donation.donorId },
        data: {
          totalDonated: { increment: donation.amount },
          donationCount: { increment: 1 },
        },
      });

      // Update campaign stats if applicable
      if (donation.campaignId) {
        await prisma.fundraisingCampaign.update({
          where: { id: donation.campaignId },
          data: {
            currentAmount: { increment: donation.amount },
          },
        });
      }
    }

    if (transaction.renewalRequestId) {
      await prisma.renewalRequest.update({
        where: { id: transaction.renewalRequestId },
        data: {
          status: 'COMPLETED',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        }
      });
      
      // Note: Membership extension logic is typically in MembershipService.
      // For now, we just mark the request as completed.
    }

    await auditService.log({
      action: 'TRANSACTION_VERIFIED',
      userId: reviewerId,
      entityType: 'Transaction',
      entityId: id,
      details: { amount: transaction.amount, category: transaction.category },
    });

    return { success: true };
  }

  async rejectTransaction(id: string, reason: string, reviewerId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        donation: true,
        renewalRequest: true,
      }
    });

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'PENDING') throw new Error('Transaction is not pending');

    await prisma.transaction.update({
      where: { id },
      data: {
        status: 'REJECTED',
        description: `${transaction.description || ''} (REJECTED: ${reason})`,
        updatedAt: new Date(),
      }
    });

    if (transaction.donation) {
      await prisma.donation.update({
        where: { id: transaction.donation.id },
        data: { status: 'REJECTED', notes: `Rejected: ${reason}` }
      });
    }

    if (transaction.renewalRequestId) {
      await prisma.renewalRequest.update({
        where: { id: transaction.renewalRequestId },
        data: {
          status: 'REJECTED',
          adminNote: reason,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        }
      });
    }

    await auditService.log({
      action: 'TRANSACTION_REJECTED',
      userId: reviewerId,
      entityType: 'Transaction',
      entityId: id,
      details: { amount: transaction.amount, reason },
    });

    return { success: true };
  }
}

export const financeService = new FinanceService();
