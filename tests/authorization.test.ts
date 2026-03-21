import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import { grievanceService } from '../src/services/grievance.service';
import prisma from '../src/lib/prisma';

vi.mock('../src/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../src/services/grievance.service', () => ({
  grievanceService: {
    createCategory: vi.fn(),
    getGrievances: vi.fn(),
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Authorization Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const generateToken = (role: string) => {
    const user = { id: 'user-1', email: 'user@example.com', role, isActive: true };
    (prisma.user.findUnique as any).mockResolvedValue(user);
    return jwt.sign({ id: 'user-1', email: 'user@example.com', role }, JWT_SECRET);
  };

  describe('POST /api/v1/grievances/categories', () => {
    it('should allow ADMIN to create category', async () => {
      const token = generateToken('ADMIN');
      const response = await request(app)
        .post('/api/v1/grievances/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Category', description: 'Test' });

      // We expect 201 if successful, or 400 if validation fails (but 403 means auth failed)
      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(401);
    });

    it('should allow STAFF to create category', async () => {
      const token = generateToken('STAFF');
      const response = await request(app)
        .post('/api/v1/grievances/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Category', description: 'Test' });

      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(401);
    });

    it('should deny MEMBER from creating category', async () => {
      const token = generateToken('MEMBER');
      const response = await request(app)
        .post('/api/v1/grievances/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Category', description: 'Test' });

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/Forbidden/);
    });
  });

  describe('Confidentiality in GET /api/v1/grievances', () => {
    it('should filter by reporterId for MEMBER', async () => {
      const token = generateToken('MEMBER');
      
      (grievanceService.getGrievances as any).mockResolvedValue([]);

      await request(app)
        .get('/api/v1/grievances')
        .set('Authorization', `Bearer ${token}`);

      expect(grievanceService.getGrievances).toHaveBeenCalledWith(expect.objectContaining({
        reporterId: 'user-1'
      }));
    });

    it('should NOT filter by reporterId for ADMIN', async () => {
      const token = generateToken('ADMIN');
      
      (grievanceService.getGrievances as any).mockResolvedValue([]);

      await request(app)
        .get('/api/v1/grievances')
        .set('Authorization', `Bearer ${token}`);

      const callArgs = (grievanceService.getGrievances as any).mock.calls[0][0];
      expect(callArgs.reporterId).toBeUndefined();
    });
  });
});
