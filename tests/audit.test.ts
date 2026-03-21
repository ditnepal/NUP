import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '../src/services/audit.service';
import prisma from '../src/lib/prisma';

// Mock Prisma
vi.mock('../src/lib/prisma', () => ({
  default: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe('Audit Service Tests', () => {
  let service: AuditService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuditService();
  });

  it('should log an action successfully', async () => {
    const params = { action: 'TEST_ACTION', userId: 'user-1' };
    (prisma.auditLog.create as any).mockResolvedValue({ id: 'log-1', ...params });

    const result = await service.log(params);

    expect(result).toHaveProperty('id', 'log-1');
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('should fail silently if prisma fails', async () => {
    const params = { action: 'TEST_ACTION' };
    (prisma.auditLog.create as any).mockRejectedValue(new Error('DB Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.log(params);

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith('Audit Logging Error:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });
});
