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
   * Get all unit IDs accessible to a user based on their role and orgUnitId
   * Returns null for global access (ADMIN)
   */
  async getAccessibleUnitIds(user: { id: string; role: string; orgUnitId?: string }): Promise<string[] | null> {
    if (user.role === 'ADMIN') return null;
    if (!user.orgUnitId) return [];

    return this.getSubUnitIds(user.orgUnitId);
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

  /**
   * Update an organization unit
   */
  async update(id: string, data: any) {
    return this.db.organizationUnit.update({
      where: { id },
      data
    });
  }

  /**
   * Delete an organization unit with strict dependency checks
   */
  async delete(id: string) {
    // 1. Check for children
    const childrenCount = await this.db.organizationUnit.count({
      where: { parentId: id }
    });
    if (childrenCount > 0) {
      throw new Error('Cannot delete unit with sub-units. Delete sub-units first.');
    }

    // 2. Check for linked members
    const membersCount = await this.db.member.count({
      where: { orgUnitId: id }
    });
    if (membersCount > 0) {
      throw new Error('Cannot delete unit with linked members.');
    }

    // 3. Check for linked booths
    const boothsCount = await this.db.booth.count({
      where: { orgUnitId: id }
    });
    if (boothsCount > 0) {
      throw new Error('Cannot delete unit with linked booths.');
    }

    // 4. Check for linked offices
    const officesCount = await this.db.office.count({
      where: { orgUnitId: id }
    });
    if (officesCount > 0) {
      throw new Error('Cannot delete unit with linked offices.');
    }

    // 5. Check for linked users
    const usersCount = await this.db.user.count({
      where: { orgUnitId: id }
    });
    if (usersCount > 0) {
      throw new Error('Cannot delete unit with linked users.');
    }

    return this.db.organizationUnit.delete({
      where: { id }
    });
  }
}

export const hierarchyService = new HierarchyService();
