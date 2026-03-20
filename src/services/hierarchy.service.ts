import { BaseService } from './base.service';

export class HierarchyService extends BaseService {
  /**
   * Get all children IDs for a given unit ID (recursive)
   */
  async getSubUnitIds(unitId: string): Promise<string[]> {
    const unit = await this.db.organizationUnit.findUnique({
      where: { id: unitId },
      include: { children: { select: { id: true } } }
    });

    if (!unit) return [];

    let ids = [unitId];
    for (const child of unit.children) {
      const childIds = await this.getSubUnitIds(child.id);
      ids = [...ids, ...childIds];
    }

    return ids;
  }

  /**
   * Check if a user has access to a specific unit
   */
  async hasAccess(userId: string, targetUnitId: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { orgUnitId: true, role: true }
    });

    if (!user) return false;
    if (user.role === 'ADMIN') return true; // Global admin
    if (!user.orgUnitId) return false;

    const allowedIds = await this.getSubUnitIds(user.orgUnitId);
    return allowedIds.includes(targetUnitId);
  }

  /**
   * Get the full path from root to a specific unit
   */
  async getPath(unitId: string): Promise<any[]> {
    const unit = await this.db.organizationUnit.findUnique({
      where: { id: unitId },
      include: { parent: true }
    });

    if (!unit) return [];
    if (!unit.parent) return [unit];

    const parentPath = await this.getPath(unit.parentId!);
    return [...parentPath, unit];
  }
}

export const hierarchyService = new HierarchyService();
