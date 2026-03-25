# PPOS Module Ownership Map

## Module Ownership and Responsibility

| Module | Primary Owner | Secondary Owner | Key Data Entities |
| --- | --- | --- | --- |
| **Hierarchy** | ADMIN | STAFF | `OrganizationUnit`, `Office`, `Committee`, `OfficeBearer` |
| **Membership** | STAFF | ADMIN | `Member`, `User`, `Enrollment`, `Certificate` |
| **Finance** | FINANCE_OFFICER | ADMIN | `Transaction`, `PaymentIntegration`, `AuditLog` |
| **Fundraiser** | STAFF | FINANCE_OFFICER | `FundraisingCampaign`, `Donation` |
| **Campaigns** | FIELD_COORDINATOR | STAFF | `Campaign`, `AppEvent`, `Notice` |
| **Supporters** | FIELD_COORDINATOR | BOOTH_COORDINATOR | `Supporter`, `Interaction` |
| **Booths** | BOOTH_COORDINATOR | FIELD_COORDINATOR | `Booth`, `BoothTeamMember` |
| **CMS** | STAFF | ADMIN | `CmsPage`, `CmsPost`, `CmsMedia` |
| **Documents** | STAFF | ADMIN | `PartyDocument` |
| **Communication** | STAFF | ADMIN | `Notification`, `Notice`, `DeliveryLog` |
| **Training** | STAFF | ADMIN | `TrainingProgram`, `Quiz`, `QuizAttempt` |
| **Events** | STAFF | ADMIN | `Event`, `EventRegistration`, `Speaker`, `AgendaItem` |
| **Election** | ADMIN | STAFF | `ElectionCycle`, `Constituency`, `Candidate`, `ElectionIncident` |
| **Grievances** | STAFF | FIELD_COORDINATOR | `Grievance`, `GrievanceAssignment`, `GrievanceResponse` |
| **Surveys** | STAFF | FIELD_COORDINATOR | `Survey`, `SurveyQuestion`, `SurveyResponse`, `Poll`, `PollVote` |
| **PGIS** | STAFF | ADMIN | `AreaStrengthScore`, `CommunityPriority` |
| **War Room** | ADMIN | STAFF | `IntelligenceAlert`, `GroundIntelligenceReport` |

## Data Ownership Principles
1. **Module-Level Isolation**: Modules should not directly modify data owned by other modules.
2. **Service-Based Interaction**: Use services (e.g., `financeService`, `membershipService`) to interact with data across modules.
3. **Cross-Module Events**: Use an event-driven approach (e.g., `auditService.log`) to track cross-module actions.
4. **Hierarchical Ownership**: Data created at a specific hierarchical level is owned by that level's unit but visible to its parents.
