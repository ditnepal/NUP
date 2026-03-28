import { SystemConfig } from '@prisma/client';
import prisma from '../lib/prisma';
import { CommunicationProvider } from '../types';

export interface MessageProvider {
  send(to: string, subject: string, body: string, config?: CommunicationProvider): Promise<{ success: boolean; error?: string }>;
}

class TwilioSMSProvider implements MessageProvider {
  async send(to: string, subject: string, body: string, config?: CommunicationProvider) {
    const providerName = config?.name || 'Twilio (Hardcoded Fallback)';
    console.log(`[${providerName}] Sending SMS to ${to}: ${body}`);
    // In a real app, this would use config.apiKey, config.authToken, etc.
    return { success: true };
  }
}

class SendGridEmailProvider implements MessageProvider {
  async send(to: string, subject: string, body: string, config?: CommunicationProvider) {
    const providerName = config?.name || 'SendGrid (Hardcoded Fallback)';
    console.log(`[${providerName}] Sending Email to ${to}: ${subject} - ${body}`);
    return { success: true };
  }
}

class FirebasePushProvider implements MessageProvider {
  async send(to: string, subject: string, body: string, config?: CommunicationProvider) {
    const providerName = config?.name || 'Firebase (Hardcoded Fallback)';
    console.log(`[${providerName}] Sending Push to ${to}: ${subject} - ${body}`);
    return { success: true };
  }
}

export class MessagingEngine {
  private staticFallbacks: Record<string, MessageProvider> = {
    SMS: new TwilioSMSProvider(),
    EMAIL: new SendGridEmailProvider(),
    PUSH: new FirebasePushProvider(),
  };

  private async getDynamicProvider(type: string): Promise<CommunicationProvider | null> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'COMMUNICATION_PROVIDERS' }
      });
      
      if (!config || !config.value) return null;
      
      const providers: CommunicationProvider[] = JSON.parse(config.value);
      const activeProviders = providers.filter(p => p.channel === type && p.isActive);
      
      // 1. Try Default
      const defaultProvider = activeProviders.find(p => p.isDefault);
      if (defaultProvider) return defaultProvider;
      
      // 2. Try Backup
      const backupProvider = activeProviders.find(p => p.isBackup);
      if (backupProvider) return backupProvider;
      
      // 3. Try any active
      if (activeProviders.length > 0) return activeProviders[0];
      
      return null;
    } catch (error) {
      console.error('Error fetching dynamic providers:', error);
      return null;
    }
  }

  async send(type: 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP', to: string, subject: string, body: string): Promise<{ success: boolean; error?: string; providerName?: string }> {
    if (type === 'IN_APP') {
      return { success: true, providerName: 'IN_APP' };
    }

    const dynamicProviderConfig = await this.getDynamicProvider(type);
    const fallbackProvider = this.staticFallbacks[type];

    if (!dynamicProviderConfig && !fallbackProvider) {
      throw new Error(`No provider (dynamic or fallback) found for channel: ${type}`);
    }

    const providerName = dynamicProviderConfig?.name || (type === 'SMS' ? 'Twilio (Fallback)' : type === 'EMAIL' ? 'SendGrid (Fallback)' : 'Firebase (Fallback)');

    try {
      const provider = fallbackProvider; 
      const result = await provider.send(to, subject, body, dynamicProviderConfig || undefined);
      return { ...result, providerName };
    } catch (error: any) {
      console.error(`MessagingEngine Error [${type}]:`, error);
      return { success: false, error: error.message, providerName };
    }
  }
}

export const messagingEngine = new MessagingEngine();
