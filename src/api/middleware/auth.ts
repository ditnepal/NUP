import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { UserRole } from '../../types';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-nup-os-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    roleId?: string;
    orgUnitId?: string;
    orgUnitLevel?: string;
    orgUnitName?: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-nup-os-2026';
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        displayName: true,
        role: true, 
        isActive: true,
        roleId: true,
        orgUnitId: true,
        passwordHash: true,
        orgUnit: {
          select: {
            level: true,
            name: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Unauthorized: User account is inactive or deleted' });
    }

    // Check if user requires password change
    if (user.passwordHash.startsWith('TEMP_')) {
      const allowedPaths = ['/api/v1/auth/me', '/api/v1/auth/change-password'];
      if (!allowedPaths.includes(req.originalUrl)) {
        return res.status(403).json({ error: 'Forbidden: Password change required', requirePasswordChange: true });
      }
    }

    req.user = { 
      id: user.id, 
      email: user.email, 
      displayName: user.displayName,
      role: user.role as UserRole,
      roleId: user.roleId || undefined,
      orgUnitId: user.orgUnitId || undefined,
      orgUnitLevel: user.orgUnit?.level || undefined,
      orgUnitName: user.orgUnit?.name || undefined
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role) && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
