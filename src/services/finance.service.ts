import prisma from '../lib/prisma';
import { safeJsonParse } from '../lib/json';
import { auditService } from './audit.service';

/**
 * MORU PAYMENT INTEGRATION AUDIT - PHASE 2A
 * 
 * Current Reality:
 * - Moru is onboarded as a provider in the database and UI.
 * - Configuration fields (publicKey, secretRef, metadata) are available.
 * - Public exposure is limited to safe fields (isManual: true for now).
 * - Initiation logic is a placeholder throwing an error.
 * 
 * Missing for Execution:
 * - Official API Endpoints (Test/Live).
 * - Request Payload Schema (Moru-specific fields).
 * - Signature/HMAC Algorithm details.
 * - Return/Callback URL parameter mapping.
 * - Server-to-server verification API details.
 * 
 * Safe Phase 2A Step:
 * - Define the internal adapter contract.
 * - Harden initiation with better error handling.
 * - Prepare for metadata-driven configuration.
 */

interface PaymentInitiationData {
  amount: number;
  paymentMethod: string;
  purchaseOrderId: string;
  purchaseOrderName: string;
  customerInfo: { fullName: string; email: string; phone?: string };
  returnUrl: string;
}

interface PaymentInitiationResult {
  type: 'REDIRECT' | 'FORM' | 'MANUAL';
  url?: string;
  params?: Record<string, any>;
  pidx?: string;
  instructions?: string;
}

interface PaymentAdapter {
  initiate(data: PaymentInitiationData, integration: any): Promise<PaymentInitiationResult>;
  verify?(id: string, integration: any): Promise<boolean>;
}

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
    orgUnitId?: string;
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
    orgUnitId?: string;
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
    // For online payment methods (Khalti, eSewa, Moru), it MUST start as PENDING until verified
    const isOnlinePayment = ['KHALTI', 'ESEWA', 'MORU'].includes(data.paymentMethod.toUpperCase());
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
        orgUnitId: data.orgUnitId,
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
    orgUnitId?: string;
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
        orgUnitId: data.orgUnitId,
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
    if (!reason || reason.trim().length === 0) {
      throw new Error('Decision note is required for processing a refund.');
    }
    if (reason.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
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
      data: { 
        status: 'REFUNDED', 
        reconciliationNote: reason,
        reviewedById: recordedById,
        reviewedAt: new Date(),
      },
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
        reviewedById: recordedById,
        reviewedAt: new Date(),
        reconciliationNote: `Automated balancing entry for refund of donation ${donationId}`,
        orgUnitId: donation.transaction.orgUnitId, // Inherit orgUnitId from original transaction
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
      details: { amount: donation.amount, reason, decisionNote: reason },
    });

    return { success: true };
  }

  async getFinanceAnalytics(orgUnitIds?: string[] | null) {
    const transactionWhere: any = {};
    const donationWhere: any = {};
    const campaignWhere: any = {};

    if (orgUnitIds) {
      transactionWhere.orgUnitId = { in: orgUnitIds };
      // For donations, we filter by the related transaction's orgUnitId
      donationWhere.transaction = { orgUnitId: { in: orgUnitIds } };
      campaignWhere.orgUnitId = { in: orgUnitIds };
    }

    const totalRaised = await prisma.donation.aggregate({
      where: { status: 'VERIFIED', ...donationWhere },
      _sum: { amount: true },
    });

    const donorCount = await prisma.donorProfile.count();
    
    const recentDonations = await prisma.donation.findMany({
      take: 10,
      where: donationWhere,
      orderBy: { createdAt: 'desc' },
      include: { donor: true, campaign: true },
    });

    const campaigns = await prisma.fundraisingCampaign.findMany({
      where: campaignWhere,
      include: {
        _count: { select: { donations: true } },
      },
    });

    // Consolidated Metrics
    const membershipCollections = await prisma.transaction.aggregate({
      where: { category: 'MEMBERSHIP_FEE', type: 'INCOME', status: 'COMPLETED', ...transactionWhere },
      _sum: { amount: true },
    });

    const renewalCollections = await prisma.transaction.aggregate({
      where: { category: 'RENEWAL_FEE', type: 'INCOME', status: 'COMPLETED', ...transactionWhere },
      _sum: { amount: true },
    });

    const fundraiserCollections = totalRaised._sum.amount || 0;
    const totalCollections = (membershipCollections._sum.amount || 0) + 
                             (renewalCollections._sum.amount || 0) + 
                             fundraiserCollections;

    const refundStats = await prisma.transaction.aggregate({
      where: { category: 'REFUND', type: 'EXPENSE', status: 'COMPLETED', ...transactionWhere },
      _sum: { amount: true },
      _count: { id: true },
    });

    const recentTransactionCount = await prisma.transaction.count({
      where: {
        ...transactionWhere,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    const totalTransactionCount = await prisma.transaction.count({ where: transactionWhere });
    const rejectedTransactionCount = await prisma.transaction.count({
      where: { status: 'REJECTED', ...transactionWhere }
    });

    const pendingDonationsStats = await prisma.donation.aggregate({
      where: { status: 'PENDING', ...donationWhere },
      _sum: { amount: true },
      _count: { id: true },
    });

    const pendingTransactionStats = await prisma.transaction.aggregate({
      where: { status: 'PENDING', ...transactionWhere },
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
      totalTransactionCount,
      rejectedTransactionCount,
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
        publicKey: true, // Needed for some frontends, but we'll be careful
        metadata: true,
      }
    });
    
    const parsed = integrations.map(i => {
      const modules = i.supportedModules.split(',').map(m => m.trim().toUpperCase()).filter(Boolean);
      
      // MORU is considered automated only if it has an initiation URL in metadata
      let isMoruReady = false;
      if (i.provider.toUpperCase() === 'MORU' && i.metadata) {
        try {
          const meta = JSON.parse(i.metadata);
          isMoruReady = !!meta.initiation_url && !!meta.payload_schema;
        } catch (e) {
          isMoruReady = false;
        }
      }

      const isManual = !['KHALTI', 'ESEWA', 'STRIPE'].includes(i.provider.toUpperCase()) && !isMoruReady;
      
      return {
        id: i.id,
        provider: i.provider,
        displayName: i.displayName,
        region: i.region,
        mode: i.mode,
        sortOrder: i.sortOrder,
        supportedModules: modules,
        instructions: i.instructions,
        isManual,
        // Only expose publicKey if it's actually set and not a secret
        publicKey: i.publicKey && !i.publicKey.startsWith('SEC_') ? i.publicKey : null,
      };
    });

    if (module) {
      const targetModule = module.toUpperCase();
      return parsed.filter(i => i.supportedModules.includes(targetModule));
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

  async initiatePayment(data: PaymentInitiationData) {
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

    // Adapter Dispatcher
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
      } as PaymentInitiationResult;
    }

    if (data.paymentMethod === 'ESEWA') {
      let secretKey = process.env[integration.secretRef || 'ESEWA_SECRET_KEY'] || integration.secretRef;
      
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
      } as PaymentInitiationResult;
    }

    if (data.paymentMethod === 'MORU') {
      /**
       * MORU CONTROLLED INITIATION (PHASE 2B)
       * 
       * This block implements a metadata-driven initiation attempt.
       * If initiation_url and payload_schema are provided in the integration metadata,
       * it will attempt to prepare the request.
       */
      let metadata: any = {};
      try {
        metadata = integration.metadata ? JSON.parse(integration.metadata) : {};
      } catch (e) {
        throw new Error('MORU integration metadata is not a valid JSON object.');
      }

      const initiationUrl = metadata.initiation_url;
      const payloadSchema = metadata.payload_schema;

      if (!initiationUrl || !payloadSchema) {
        // Return MANUAL type if not fully configured for automation
        // This allows the frontend to show instructions instead of crashing
        return {
          type: 'MANUAL',
          instructions: integration.instructions || 'MORU automated initiation is pending configuration. Please use manual verification mode for now.',
          pidx: data.purchaseOrderId,
        } as PaymentInitiationResult;
      }

      // If we have config, we report that we are ready for the next step (Signature logic)
      throw new Error('MORU automated initiation is pending official signature/HMAC verification logic. Please use manual mode or provide signature_type in metadata.');
    }

    throw new Error(`Provider ${data.paymentMethod} initiation not implemented`);
  }

  /**
   * MORU RETURN + VERIFICATION HANDLING (PHASE 2C)
   * 
   * This method captures the return parameters from a provider callback.
   * It does NOT mark the transaction as COMPLETED unless verified.
   * For MORU, it currently just records the parameters for manual review.
   */
  async capturePaymentReturn(purchaseOrderId: string, provider: string, params: any) {
    const transaction = await prisma.transaction.findFirst({
      where: { 
        referenceId: purchaseOrderId,
        paymentMethod: provider.toUpperCase()
      },
    });

    if (!transaction) {
      throw new Error(`Transaction with reference ${purchaseOrderId} for ${provider} not found`);
    }

    // Record the return parameters in the reconciliation note for manual review
    const existingNote = transaction.reconciliationNote || '';
    const returnData = JSON.stringify(params);
    const newNote = `${existingNote}\n[${new Date().toISOString()}] Captured ${provider} Return: ${returnData}`.trim();

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { reconciliationNote: newNote },
    });

    await auditService.log({
      action: 'PAYMENT_RETURN_CAPTURED',
      entityType: 'Transaction',
      entityId: transaction.id,
      details: { provider, purchaseOrderId, params },
    });

    return { 
      status: transaction.status,
      message: 'Payment return captured. Verification is pending.' 
    };
  }

  async verifyTransaction(id: string, reviewerId: string, note?: string) {
    if (note && note.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
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
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
        reconciliationNote: note ? `${transaction.reconciliationNote || ''}\n[${new Date().toISOString()}] VERIFIED: ${note}`.trim() : undefined
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
      details: { 
        amount: transaction.amount, 
        category: transaction.category,
        note,
        decisionNote: note,
        previousState: 'PENDING',
        newState: 'COMPLETED',
        targetType: 'Transaction',
        targetId: id
      },
    });

    return { success: true };
  }

  async rejectTransaction(id: string, reason: string, reviewerId: string) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Decision note is required for rejecting a transaction.');
    }
    if (reason.length > 300) {
      throw new Error('Decision note must not exceed 300 characters.');
    }
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        donation: true,
        renewalRequest: true,
      }
    });

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'PENDING') throw new Error('Transaction is not pending');

    const existingNote = transaction.reconciliationNote || '';
    const newNote = `${existingNote}\n[${new Date().toISOString()}] REJECTED: ${reason}`.trim();

    await prisma.transaction.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reconciliationNote: newNote,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
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
      details: { 
        amount: transaction.amount, 
        reason,
        decisionNote: reason,
        previousState: 'PENDING',
        newState: 'REJECTED',
        targetType: 'Transaction',
        targetId: id
      },
    });

    return { success: true };
  }

  async getTransactions(orgUnitIds?: string[] | null) {
    const where: any = {};
    if (orgUnitIds) {
      where.orgUnitId = { in: orgUnitIds };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        donation: { include: { donor: true, campaign: true } },
        member: true,
        renewalRequest: true,
        recordedBy: true,
        reviewedBy: true,
      },
    });

    // Attach audit logs to each transaction
    const transactionsWithLogs = await Promise.all(
      transactions.map(async (tx) => {
        const logs = await auditService.getLogsForEntity('Transaction', tx.id);
        return {
          ...tx,
          auditTrail: logs.map(l => ({
            id: l.id,
            action: l.action,
            timestamp: l.timestamp.toISOString(),
            details: safeJsonParse(l.details),
            user: l.user ? { displayName: l.user.displayName } : undefined,
            userId: l.userId
          })),
        };
      })
    );

    return transactionsWithLogs;
  }

  async getActiveFundraisingCampaigns() {
    return await prisma.fundraisingCampaign.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getDonationsByUserId(userId: string) {
    return await prisma.donation.findMany({
      where: { donor: { userId } },
      include: {
        campaign: { select: { title: true } },
        transaction: { select: { status: true, amount: true, date: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getDonorProfileByUserId(userId: string) {
    return await prisma.donorProfile.findUnique({
      where: { userId },
      include: {
        _count: {
          select: { donations: true }
        }
      }
    });
  }
}

export const financeService = new FinanceService();
