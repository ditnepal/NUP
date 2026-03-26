import { UserProfile, UserRole, AppAction, AppModule } from '../types';
import { hierarchyService } from './hierarchy.service';
import { ROLE_PERMISSIONS } from '../lib/permissions';

class PermissionService {
  /**
   * Check if a user can perform an action on a module, optionally within a specific org unit
   */
  async can(user: UserProfile, module: AppModule, action: AppAction, targetOrgUnitId?: string): Promise<boolean> {
    // 1. Admin can do everything
    if (user.role === 'ADMIN') return true;

    // 2. Define base RBAC rules
    const allowedActions = ROLE_PERMISSIONS[user.role]?.[module] || [];
    if (!allowedActions.includes(action)) return false;

    // 3. Hierarchy Check
    // If a targetOrgUnitId is provided, check if the user has access to it.
    if (targetOrgUnitId && user.orgUnitId) {
      const hasAccess = await hierarchyService.hasAccess(user.id, targetOrgUnitId);
      if (!hasAccess) return false;
    }

    return true;
  }

  /**
   * Get all accessible unit IDs for a user
   */
  async getAccessibleUnitIds(user: UserProfile): Promise<string[] | null> {
    return hierarchyService.getAccessibleUnitIds({
      id: user.id,
      role: user.role,
      orgUnitId: user.orgUnitId
    });
  }
}

export const permissionService = new PermissionService();
