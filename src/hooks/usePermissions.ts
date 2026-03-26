import { useCallback } from 'react';
import { UserProfile, AppModule, AppAction } from '../types';
import { ROLE_PERMISSIONS } from '../lib/permissions';

export const usePermissions = (user: UserProfile | null) => {
  const can = useCallback((module: AppModule, action: AppAction): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    const allowedActions = ROLE_PERMISSIONS[user.role]?.[module] || [];
    return allowedActions.includes(action);
  }, [user]);

  return { can };
};
