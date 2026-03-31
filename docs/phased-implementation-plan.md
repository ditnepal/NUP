# NUP OS Phased Implementation Plan

## Phase 1: Foundation (Completed)
- Core models (User, OrganizationUnit, Role, Permission).
- Basic module separation (Membership, Finance, Fundraiser, CMS, etc.).
- Authentication and basic RBAC.

## Phase 2: Hierarchy Alignment (Current)
- **Audit existing models and logic**: Standardize hierarchical levels across all modules.
- **Implement hierarchy-scoped data access in the backend**:
  - Create a `ScopeGuard` utility.
  - Update API endpoints to use `ScopeGuard`.
- **Standardize hierarchical levels**: Ensure all modules use the same `OrganizationUnit` levels.

## Phase 3: Scoped Dashboards
- **Create level-specific dashboard views**:
  - `NationalDashboard`
  - `ProvinceDashboard`
  - `DistrictDashboard`
  - `ConstituencyDashboard`
  - `MunicipalityDashboard`
  - `WardDashboard`
  - `BoothDashboard`
- **Implement scope-aware navigation and filtering**:
  - Add a "Scope Selector" to the sidebar.
  - Filter navigation items based on the user's level and role.
- **Enhance "War Room" with hierarchical drill-downs**:
  - Allow users to drill down from `NATIONAL` to `BOOTH` level data.

## Phase 4: Advanced RBAC & Compliance
- **Granular module-level permissions**:
  - Implement a `PermissionGuard` middleware.
  - Define permissions for each module and role.
- **Audit logging for all scoped actions**:
  - Ensure all actions are logged with the user's `orgUnitId` and `role`.
- **Automated compliance checks for hierarchical operations**:
  - Implement checks to ensure users only perform actions within their scope.

## Smallest Safe Build Order (Next Steps)
1. **Implement `ScopeGuard` middleware/utility**: Create a utility that filters Prisma queries by hierarchy.
2. **Update API endpoints to use `ScopeGuard`**: Start with `Supporters` and `Booths` modules.
3. **Create level-specific dashboard summaries**: Implement basic summaries for each level in the main dashboard.
4. **Enhance the "Hierarchy" module**: Allow admins to manage units and assign users to units with specific roles.
