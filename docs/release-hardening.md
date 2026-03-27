# Release Hardening & Rollback Readiness

## Database Safety Rules
- **Canonical DB Path**: `/app/applet/prisma/dev.db`
- **Root .env Source of Truth**: All environment variables must be defined in the root `.env` file.
- **No Auto Reseed/Reset**: The database should not be automatically reseeded or reset during deployment or startup.
- **Manual Restore Only**: Database restoration from backups must be performed manually by an administrator.

## Backup Procedure
To perform a manual backup of the database, run the following command from the root directory:
```bash
node scripts/backup-db.cjs
```
This will create a timestamped copy of the database in the `prisma/backups` directory.

## Rollback Readiness
In the event of a critical failure after the current sprint deployment, follow these steps to rollback:
1. **Identify the failure**: Determine if the failure is related to code changes or data corruption.
2. **Code Rollback**: Revert to the previous stable git commit.
3. **Data Rollback**: If data is corrupted, manually restore the database from the latest known good backup in `prisma/backups`.
   - Stop the application.
   - Replace `prisma/dev.db` with the backup file.
   - Restart the application.
4. **Verification**: Run the [Smoke Test Checklist](./smoke-test-checklist.md) to ensure the system is stable.
