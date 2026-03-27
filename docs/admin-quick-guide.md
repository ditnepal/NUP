# Admin Quick Guide

This guide provides a concise overview of key administrative tasks in the application.

## 1. User Management
- **Creating a User**: Navigate to the **Users & Roles** module and click **Add User**.
- **Assigning Role + Org Scope**: When creating or editing a user, select the appropriate **Role** and **Organization Unit**.
  - **Note**: Some roles (e.g., `FIELD_COORDINATOR`, `BOOTH_COORDINATOR`) require a specific organizational scope.
- **Resetting Password**: In the **Users & Roles** list, click the **Reset Password** icon for the target user.

## 2. Accountability & Auditing
- **Using decisionNote Safely**: For critical administrative actions (e.g., status changes, deletions, role updates), you will be prompted to provide a **Decision Note**. This note is saved in the audit trail and is essential for accountability.
- **Understanding Audit Trail**: All sensitive actions are logged in the **Audit Trail**. You can view these logs in the **Audit Trail** module to track who performed what action and when.

## 3. UI Patterns & Safety
- **New Confirmation Dialogs**: Destructive actions (e.g., deletions) now use a custom **Confirmation Modal** with an `AlertTriangle` icon. This ensures you are clearly warned before performing an irreversible action.
- **Toast Notifications**: Success and error messages are displayed as **Toast Notifications** in the bottom corner of the screen for non-blocking feedback.

## 4. Best Practices
- **Least Privilege**: Always assign the minimum necessary role and scope to a user.
- **Clear Documentation**: Provide detailed `decisionNote` entries for all critical administrative actions.
- **Regular Backups**: Ensure that manual database backups are performed regularly using the `backup-db.cjs` script.
