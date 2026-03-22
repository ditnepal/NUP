import prisma from '../lib/prisma';
import { auditService } from './audit.service';
import { messagingEngine } from './messaging.engine';
import { retryService } from './retry.service';
import { analyticsService } from './analytics.service';

export class CommunicationService {
  /**
   * Send a notification to a specific user
   */
  async sendNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'TASK' | 'ALERT';
    link?: string;
    metadata?: any;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    // Log delivery
    await prisma.deliveryLog.create({
      data: {
        userId: data.userId,
        recipient: data.userId, // In-app recipient is the user ID
        status: 'DELIVERED',
        provider: 'IN_APP',
      },
    });

    return notification;
  }

  /**
   * Broadcast a campaign to a segment (Async/Batched)
   */
  async broadcastCampaign(campaignId: string) {
    const campaign = await prisma.communicationCampaign.findUnique({
      where: { id: campaignId },
      include: { template: true, segment: true },
    });

    if (!campaign || !campaign.segment) {
      throw new Error('Campaign or segment not found');
    }

    // Update status to SENDING
    await prisma.communicationCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    });

    const criteria = JSON.parse(campaign.segment.criteria);
    
    // Find users matching criteria
    const users = await prisma.user.findMany({
      where: {
        role: criteria.role,
        isActive: true,
      },
    });

    // Batching logic
    const BATCH_SIZE = 50;
    const promises = [];
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      
      // Dispatch batch and wait for it
      promises.push(this.dispatchBatch(batch, campaign));
    }

    try {
      await Promise.all(promises);
      await prisma.communicationCampaign.update({
        where: { id: campaignId },
        data: { 
          status: 'COMPLETED',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.communicationCampaign.update({
        where: { id: campaignId },
        data: { status: 'FAILED' },
      });
      throw error;
    }

    return { status: 'COMPLETED' };
  }

  private async dispatchBatch(users: any[], campaign: any) {
    for (const user of users) {
      try {
        const renderedBody = campaign.template.body.replace('{{fullName}}', user.displayName);
        
        if (campaign.template.type === 'IN_APP') {
          await this.sendNotification({
            userId: user.id,
            title: campaign.template.subject || campaign.name,
            message: renderedBody,
            type: 'INFO',
          });
        } else {
          const result = await messagingEngine.send(
            campaign.template.type as 'SMS' | 'EMAIL' | 'PUSH',
            user.email || user.phoneNumber,
            campaign.template.subject || campaign.name,
            renderedBody
          );

          if (!result.success) {
            throw new Error(result.error);
          }
        }

        await prisma.deliveryLog.create({
          data: {
            campaignId: campaign.id,
            userId: user.id,
            recipient: user.email || user.phoneNumber,
            status: 'SENT',
            provider: campaign.template.type,
          },
        });
      } catch (error: any) {
        await prisma.deliveryLog.create({
          data: {
            campaignId: campaign.id,
            userId: user.id,
            recipient: user.email || user.phoneNumber,
            status: 'FAILED',
            error: error.message,
            provider: campaign.template.type,
          },
        });
        await retryService.enqueue(campaign.id, campaign.template.type, user.id);
      }
    }
  }

  /**
   * Create a public alert (Banner/Notice)
   */
  async createPublicAlert(data: { title: string; content: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }) {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) throw new Error('Admin user not found');

    return await prisma.cmsPost.create({
      data: {
        title: data.title,
        content: data.content,
        slug: `alert-${Date.now()}`,
        type: 'ALERT',
        status: 'PUBLISHED',
        authorId: admin.id,
        publishedAt: new Date(),
      },
    });
  }
}

export const communicationService = new CommunicationService();
