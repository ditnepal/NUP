# NUP OS Role-Dashboard-Permission Matrix

## Roles and Dashboards

| Role | Primary Dashboard | Access Scope | Key Modules |
| --- | --- | --- | --- |
| **ADMIN** | `dashboard` (Full) | Global | All (Hierarchy, Finance, CMS, etc.) |
| **STAFF** | `dashboard` (Full) | Global | Membership, Renewals, Fundraiser, CMS |
| **FINANCE_OFFICER** | `finance` | Global | Finance, Fundraiser, Transactions |
| **FIELD_COORDINATOR** | `dashboard` (Scoped) | OrgUnit + Children | Campaigns, Supporters, Booths, Intelligence |
| **BOOTH_COORDINATOR** | `booths` (Scoped) | Assigned Booth | Booth Management, Voter Tracking |
| **MEMBER** | `member-dashboard` | Personal | Profile, Events, Training, Documents |

## Module Permissions

| Module | ADMIN | STAFF | FINANCE_OFFICER | FIELD_COORDINATOR | BOOTH_COORDINATOR | MEMBER |
| --- | --- | --- | --- | --- | --- | --- |
| **Hierarchy** | CRUD | R | - | - | - | - |
| **Membership** | CRUD | CRUD | - | R | - | - |
| **Finance** | CRUD | R | CRUD | - | - | - |
| **Fundraiser** | CRUD | CRUD | CRUD | R | - | R |
| **Campaigns** | CRUD | CRUD | R | CRUD | R | R |
| **Supporters** | CRUD | CRUD | - | CRUD | CRUD | - |
| **Booths** | CRUD | CRUD | - | CRUD | CRUD | - |
| **CMS** | CRUD | CRUD | - | - | - | R |
| **Documents** | CRUD | CRUD | R | R | R | R |
| **Communication** | CRUD | CRUD | - | R | - | - |
| **Training** | CRUD | CRUD | - | R | - | R |
| **Events** | CRUD | CRUD | R | R | R | R |
| **Election** | CRUD | CRUD | R | R | R | R |
| **Grievances** | CRUD | CRUD | - | R | R | CRUD (Own) |
| **Surveys** | CRUD | CRUD | - | R | R | CRUD (Own) |
| **PGIS** | CRUD | CRUD | - | R | - | - |
| **War Room** | CRUD | CRUD | R | R | - | - |

**Legend:**
- **CRUD**: Create, Read, Update, Delete
- **R**: Read Only
- **-**: No Access
- **(Own)**: Restricted to user's own records
