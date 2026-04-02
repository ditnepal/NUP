import { systemConfigService } from './src/services/systemConfig.service';
import prisma from './src/lib/prisma';

async function test() {
  try {
    console.log('Initializing defaults...');
    await systemConfigService.initializeDefaults();
    console.log('Defaults initialized');
    const configCount = await prisma.systemConfig.count();
    console.log('SystemConfig count:', configCount);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
