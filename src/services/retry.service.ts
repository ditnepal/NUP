import prisma from '../lib/prisma';

export class RetryService {
  async enqueue(messageId: string, provider: string, payload: string, attempt: number = 0) {
    const nextRetryAt = new Date(Date.now() + Math.pow(2, attempt) * 60000);
    return await prisma.retryQueue.create({
      data: {
        messageId,
        provider,
        payload,
        attempt,
        status: 'PENDING',
        nextRetryAt,
      },
    });
  }

  async processQueue() {
    const now = new Date();
    const tasks = await prisma.retryQueue.findMany({
      where: {
        status: 'PENDING',
        nextRetryAt: { lte: now },
      },
    });

    for (const task of tasks) {
      // Logic to retry using MessagingEngine
      console.log(`Retrying message ${task.messageId} attempt ${task.attempt}`);
    }
  }
}

export const retryService = new RetryService();
