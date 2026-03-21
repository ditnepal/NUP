import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../server';
import { Express } from 'express';
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

// Mock prisma
vi.mock('../src/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    genSalt: vi.fn(),
    hash: vi.fn(),
  },
}));

describe('Auth Flow Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 and token for valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        displayName: 'Test User',
        role: 'ADMIN',
        isActive: true,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should return 401 for invalid password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/v1/auth/me');
      expect(response.status).toBe(401);
    });

    it('should return 200 and user profile with valid token', async () => {
      // First login to get a token
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        displayName: 'Test User',
        role: 'ADMIN',
        isActive: true,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      const token = loginResponse.body.token;

      // Mock findUnique for /me endpoint
      (prisma.user.findUnique as any).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'ADMIN',
        isActive: true,
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'test@example.com');
    });
  });
});
