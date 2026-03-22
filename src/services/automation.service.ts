import { communicationService } from './communication.service';

export class AutomationService {
  async trigger(event: string, data: any) {
    console.log(`Automation trigger: ${event}`, data);
    
    switch (event) {
      case 'MEMBERSHIP_APPROVED':
        await communicationService.sendNotification({
          userId: data.userId,
          title: 'Membership Approved',
          message: 'Your membership has been approved!',
          type: 'SUCCESS',
        });
        break;
      case 'GRIEVANCE_UPDATED':
        await communicationService.sendNotification({
          userId: data.userId,
          title: 'Grievance Update',
          message: `Your grievance ${data.grievanceId} has been updated.`,
          type: 'INFO',
        });
        break;
      // ... other triggers
    }
  }
}

export const automationService = new AutomationService();
