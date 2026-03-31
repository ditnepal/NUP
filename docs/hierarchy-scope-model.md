# NUP OS Hierarchy Scope Model

## Overview
The Hierarchy Scope Model determines how data is filtered and accessed based on a user's position within the organizational structure.

## Data Scoping Principles
1. **Global Access**: Users with `ADMIN` or `STAFF` roles (at the `NATIONAL` level) can access all data across all units.
2. **Downward Visibility**: A user at a specific level (e.g., `DISTRICT`) can see data for their unit and all its children (e.g., `MUNICIPALITY`, `WARD`, `BOOTH`).
3. **Upward Restriction**: A user cannot see data for units above their assigned level (e.g., a `WARD` coordinator cannot see `DISTRICT` or `NATIONAL` level data).
4. **Lateral Isolation**: A user cannot see data for units at the same level but under a different parent (e.g., a `WARD` coordinator in `District A` cannot see `WARD` data in `District B`).

## Implementation Strategy

### Backend (Prisma)
- Implement a `ScopeGuard` utility that takes the user's `orgUnitId` and `role`.
- Use the `OrganizationUnit` hierarchy to generate a list of all accessible `orgUnitId`s (including children).
- Apply this list as a filter to all queries: `where: { orgUnitId: { in: accessibleUnitIds } }`.

### Frontend (React)
- Store the user's `orgUnitId` and `orgUnitLevel` in the `AuthContext`.
- Use these values to filter navigation items and dashboard widgets.
- Implement a "Scope Selector" for users who have access to multiple units (e.g., a `DISTRICT` coordinator may want to focus on a specific `WARD`).

## Hierarchical Levels and Scoping

| Level | Parent | Children | Typical Role |
| --- | --- | --- | --- |
| **NATIONAL** | - | PROVINCE | ADMIN, STAFF |
| **PROVINCE** | NATIONAL | DISTRICT | PROVINCE_COORDINATOR |
| **DISTRICT** | PROVINCE | CONSTITUENCY, MUNICIPALITY | DISTRICT_COORDINATOR |
| **CONSTITUENCY** | DISTRICT | MUNICIPALITY, WARD | CONSTITUENCY_COORDINATOR |
| **MUNICIPALITY** | CONSTITUENCY, DISTRICT | WARD | MUNICIPALITY_COORDINATOR |
| **WARD** | MUNICIPALITY | BOOTH | WARD_COORDINATOR |
| **BOOTH** | WARD | - | BOOTH_COORDINATOR |

## Scoped Entities
The following entities MUST be hierarchy-scoped:
- **Supporters**: Filtered by `boothId` or `orgUnitId`.
- **Booths**: Filtered by `orgUnitId`.
- **Campaigns**: Filtered by `orgUnitId`.
- **Grievances**: Filtered by `orgUnitId`.
- **Surveys**: Filtered by `orgUnitId`.
- **Events**: Filtered by `orgUnitId`.
- **Office Bearers**: Filtered by `committeeId` (linked to `orgUnitId`).
- **Finance Transactions**: Filtered by `orgUnitId` (for local collections).
