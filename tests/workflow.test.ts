import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GrievanceService } from '../src/services/grievance.service';
import { auditService } from '../src/services/audit.service';
import prisma from '../src/lib/prisma';

// Mock Prisma
vi.mock('../src/lib/prisma', () => ({
  default: {
    grievance: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    grievanceCategory: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    grievanceAssignment: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    grievanceResponse: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      grievanceAssignment: {
        updateMany: vi.fn(),
        create: vi.fn(),
      },
      grievance: {
        update: vi.fn(),
      },
    })),
  },
}));

vi.mock('../src/services/audit.service', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Grievance Workflow Tests', () => {
  let service: GrievanceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GrievanceService();
  });

  it('should create a grievance with status OPEN', async () => {
    const data = {
      title: 'Test Grievance',
      description: 'Test Description',
      categoryId: 'cat-1',
      reporterId: 'user-1',
    };

    (prisma.grievance.create as any).mockResolvedValue({ id: 'g-1', ...data, status: 'OPEN' });

    const result = await service.createGrievance(data);

    expect(result.status).toBe('OPEN');
    expect(prisma.grievance.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'OPEN' })
    }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'GRIEVANCE_CREATED' }));
  });

  it('should transition status to ASSIGNED when assigned', async () => {
    const grievanceId = 'g-1';
    const userId = 'user-2';
    const assignerId = 'user-1';

    // Mock transaction behavior
    const txMock = {
      grievanceAssignment: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({ id: 'a-1' }),
      },
      grievance: {
        update: vi.fn().mockResolvedValue({ id: grievanceId, status: 'ASSIGNED' }),
      },
    };
    (prisma.$transaction as any).mockImplementation(async (callback: any) => callback(txMock));

    await service.assignGrievance(grievanceId, userId, assignerId);

    expect(txMock.grievance.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: grievanceId },
      data: { status: 'ASSIGNED' }
    }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'GRIEVANCE_ASSIGNED' }));
  });

  it('should transition status to RESOLVED when resolved', async () => {
    const grievanceId = 'g-1';
    const userId = 'user-1';

    (prisma.grievance.update as any).mockResolvedValue({ id: grievanceId, status: 'RESOLVED' });

    await service.resolveGrievance(grievanceId, userId);

    expect(prisma.grievance.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: grievanceId },
      data: expect.objectContaining({ status: 'RESOLVED' })
    }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'GRIEVANCE_RESOLVED' }));
  });
});
