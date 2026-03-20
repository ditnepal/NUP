import { BaseService } from './base.service';

export class NotificationService extends BaseService {
  async notify(params: {
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'TASK' | 'ALERT';
    link?: string;
    metadata?: any;
  }) {
    return await this.db.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  }

  async markAsRead(notificationId: string) {
    return await this.db.notification.update({
      where: { id: notificationId },
      data: { status: 'READ' },
    });
  }
}

export const notificationService = new NotificationService();
