import prisma from '../lib/prisma';

export class AnalyticsService {
  async getCampaignStats(campaignId: string) {
    const logs = await prisma.deliveryLog.findMany({
      where: { campaignId },
    });

    const total = logs.length;
    const sent = logs.filter(l => l.status === 'SENT').length;
    const delivered = logs.filter(l => l.status === 'DELIVERED').length;
    const failed = logs.filter(l => l.status === 'FAILED').length;

    return {
      total,
      sent,
      delivered,
      failed,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
    };
  }
}

export const analyticsService = new AnalyticsService();
