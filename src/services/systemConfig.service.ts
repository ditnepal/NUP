import prisma from '../lib/prisma';
import { SystemConfig } from '@prisma/client';

export class SystemConfigService {
  async getAll(): Promise<SystemConfig[]> {
    try {
      return await prisma.systemConfig.findMany({
        orderBy: { key: 'asc' }
      });
    } catch (error) {
      console.error('[SYSTEM] Error fetching all configs:', error);
      return [];
    }
  }

  async getByKey(key: string): Promise<SystemConfig | null> {
    try {
      return await prisma.systemConfig.findUnique({
        where: { key }
      });
    } catch (error) {
      console.error(`[SYSTEM] Error fetching config by key ${key}:`, error);
      return null;
    }
  }

  async getValue(key: string, defaultValue: string = ''): Promise<string> {
    try {
      const config = await this.getByKey(key);
      return config ? config.value : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  async setConfig(key: string, value: string, description?: string, updatedBy?: string): Promise<SystemConfig> {
    try {
      return await prisma.systemConfig.upsert({
        where: { key },
        update: { 
          value, 
          description: description || undefined,
          updatedBy,
          updatedAt: new Date()
        },
        create: { 
          key, 
          value, 
          description,
          updatedBy
        }
      });
    } catch (error) {
      console.error(`[SYSTEM] Error setting config ${key}:`, error);
      throw error;
    }
  }

  async setMany(configs: { key: string; value: string; description?: string }[], updatedBy?: string): Promise<void> {
    for (const config of configs) {
      await this.setConfig(config.key, config.value, config.description, updatedBy);
    }
  }

  /**
   * Initialize default settings if they don't exist
   */
  async initializeDefaults(): Promise<void> {
    const defaults = [
      { key: 'PARTY_NAME', value: 'Progressive People\'s Organization', description: 'The official name of the organization' },
      { key: 'PARTY_TAGLINE', value: 'Empowering Citizens, Building the Future', description: 'Official tagline shown on public portal' },
      { key: 'DEFAULT_LANGUAGE', value: 'en', description: 'Default system language (en, ne)' },
      { key: 'ENABLE_WAR_ROOM', value: 'true', description: 'Toggle War Room module visibility' },
      { key: 'ENABLE_PGIS', value: 'true', description: 'Toggle PGIS module visibility' },
      { key: 'ENABLE_OFFICE_LOCATIONS', value: 'true', description: 'Toggle Office Locations module visibility' },
      { key: 'CONTACT_EMAIL', value: 'info@ppos.org', description: 'Primary contact email' },
      { key: 'CONTACT_PHONE', value: '+977-1-0000000', description: 'Primary contact phone' }
    ];

    for (const d of defaults) {
      const exists = await this.getByKey(d.key);
      if (!exists) {
        await this.setConfig(d.key, d.value, d.description, 'SYSTEM');
      }
    }
  }
}

export const systemConfigService = new SystemConfigService();
