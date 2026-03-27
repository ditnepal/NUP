# Smoke Test Checklist

Perform the following tests to verify the core functionality of the application after deployment.

## 1. Authentication
- [ ] **Admin Login**: Log in as an administrator to verify access to the admin dashboard.
- [ ] **Member Login**: Log in as a standard member to verify access to the member portal.
- [ ] **User Create/Reset Flow**: Create a new user and verify the password reset process.

## 2. Dashboard & Navigation
- [ ] **Dashboard Load**: Ensure the main dashboard loads correctly with no console errors.
- [ ] **Navigation**: Verify all sidebar links navigate to the correct modules.

## 3. Module Specific Actions (Sensitive)
- [ ] **Membership**: Process one membership renewal (Approve/Reject) and verify the status update.
- [ ] **Grievance**: Update the status of a grievance and verify the audit trail entry.
- [ ] **Finance**: Verify a transaction or update a finance integration setting.
- [ ] **Election**: Add or edit a candidate and verify the confirmation modal.

## 4. UI/UX Verification
- [ ] **Confirmation Modals**: Perform a destructive action (e.g., delete a non-critical item) and verify the custom confirmation modal and toast notification.
- [ ] **Mobile-Width UI Spot Check**: Open the application on a mobile device or resize the browser to verify responsiveness of the navigation and data tables.

## 5. System Integrity
- [ ] **Audit Trail**: Verify that all sensitive actions are correctly logged in the Audit Trail.
- [ ] **Decision Notes**: Ensure that `decisionNote` is required and saved for critical administrative actions.
