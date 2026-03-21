import prisma from '../lib/prisma';
import { auditService } from './audit.service';

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
   * Broadcast a campaign to a segment
   */
  async broadcastCampaign(campaignId: string) {
    const campaign = await prisma.communicationCampaign.findUnique({
      where: { id: campaignId },
      include: { template: true, segment: true },
    });

    if (!campaign || !campaign.segment) {
      throw new Error('Campaign or segment not found');
    }

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
        // Add more criteria matching as needed
      },
    });

    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
      try {
        // Render template
        const renderedBody = campaign.template.body.replace('{{fullName}}', user.displayName);
        
        if (campaign.template.type === 'IN_APP') {
          await this.sendNotification({
            userId: user.id,
            title: campaign.template.subject || campaign.name,
            message: renderedBody,
            type: 'INFO',
          });
        }
        
        // Log delivery
        await prisma.deliveryLog.create({
          data: {
            campaignId,
            userId: user.id,
            recipient: user.email,
            status: 'SENT',
            provider: campaign.template.type,
          },
        });
        
        successCount++;
      } catch (error: any) {
        failureCount++;
        await prisma.deliveryLog.create({
          data: {
            campaignId,
            userId: user.id,
            recipient: user.email,
            status: 'FAILED',
            error: error.message,
            provider: campaign.template.type,
          },
        });
      }
    }

    await prisma.communicationCampaign.update({
      where: { id: campaignId },
      data: { 
        status: 'COMPLETED',
        sentAt: new Date(),
      },
    });

    await auditService.log({
      action: 'CAMPAIGN_BROADCAST',
      entityType: 'CommunicationCampaign',
      entityId: campaignId,
      details: { successCount, failureCount },
    });

    return { successCount, failureCount };
  }

  /**
   * Create a public alert (Banner/Notice)
   */
  async createPublicAlert(data: { title: string; content: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }) {
    // Public alerts can be stored as a special type of CmsPost or a dedicated model
    // For now, let's use CmsPost with type 'ALERT'
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
