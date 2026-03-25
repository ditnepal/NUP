# PPOS Master Roadmap

## Overview
The Political Operating System (PPOS) is a centrally governed but operationally distributed platform designed to manage political party activities across multiple hierarchical levels.

## Target Architecture
- **Hierarchy-Driven Dashboards**: Users see data and actions relevant to their assigned level.
- **RBAC + Hierarchy Scope**: Permissions are granted per role and restricted by the user's organizational unit (and its children).
- **Layered Platform**:
  - **Public**: Information, joining, status tracking.
  - **Member**: Personal dashboard, events, training, profile.
  - **Field Ops**: Supporter management, booth tracking, ground intelligence.
  - **Organization Management**: Hierarchy management, CMS, communication, renewals.
  - **Command & Analytics**: War room, finance, election strategy, high-level analytics.

## Hierarchical Levels
1. **National**: Full system oversight and policy management.
2. **Province**: Regional management and coordination.
3. **District**: Local administrative oversight.
4. **Constituency/Area**: Electoral area management.
5. **Municipality/Rural Municipality**: Local government level operations.
6. **Ward**: Neighborhood level coordination.
7. **Booth**: The most granular level of voter engagement.

## Implementation Phases

### Phase 1: Foundation (Completed)
- Core models (User, OrganizationUnit, Role, Permission).
- Basic module separation (Membership, Finance, Fundraiser, CMS, etc.).
- Authentication and basic RBAC.

### Phase 2: Hierarchy Alignment (Current)
- Audit existing models and logic.
- Standardize hierarchical levels across all modules.
- Implement hierarchy-scoped data access in the backend.

### Phase 3: Scoped Dashboards
- Create level-specific dashboard views.
- Implement scope-aware navigation and filtering.
- Enhance "War Room" with hierarchical drill-downs.

### Phase 4: Advanced RBAC & Compliance
- Granular module-level permissions.
- Audit logging for all scoped actions.
- Automated compliance checks for hierarchical operations.
