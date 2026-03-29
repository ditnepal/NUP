import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { permissionService } from '../../services/permission.service';
import { AppModule, AppAction } from '../../types';

/**
 * Middleware to check if a user has permission to perform an action on a module
 * @param module The module to check
 * @param action The action to check
 * @param targetOrgUnitIdResolver Optional function to resolve target org unit ID from request
 */
export const checkPermission = (
  module: AppModule,
  action: AppAction,
  targetOrgUnitIdResolver?: (req: AuthRequest) => Promise<string | undefined> | string | undefined
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const targetOrgUnitId = targetOrgUnitIdResolver ? await targetOrgUnitIdResolver(req) : undefined;
    
    const hasPermission = await permissionService.can(req.user, module, action, targetOrgUnitId);

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `You do not have permission to ${action.toLowerCase()} in ${module.toLowerCase()} module.`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};
