# Nagarik Unmukti Party OS (NUP OS)
## SaaS-Grade Political Party Management System

A production-ready internal management platform for Nagarik Unmukti Party Nepal.

### Features
- **Secure Authentication**: Google OAuth with role-based access control (Admin, Staff, Member).
- **Administrative Hierarchy**: Full support for Nepal's Federal, Province, District, and Local Level structure.
- **Financial Management**: Ledger for donations, membership fees, and campaign expenses (NPR support).
- **Member Management**: Digital ID cards with QR verification and CSV/PDF export.
- **Analytics Dashboard**: Real-time data visualization using Recharts.
- **Audit Logging**: Immutable record of all sensitive actions for transparency.
- **Bilingual Support**: Full English and Nepali language support.

### Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion.
- **Backend**: Node.js (Express) with Vite Middleware.
- **Database**: Prisma with SQLite.
- **Libraries**: Recharts (Analytics), jsPDF (ID Cards), PapaParse (CSV), i18next (i18n).

### Getting Started
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Set up environment variables in `.env` (see `.env.example`).
4. Generate Prisma client: `npx prisma generate`.
5. Run the development server: `npm run dev`.

### Deployment
The app is designed to run on Cloud Run or any Node.js environment.
1. Build the app: `npm run build`.
2. Start the production server: `NODE_ENV=production npm start`.

### Environment Variables
See `.env.example` for required variables.

### Safety Lock (Baseline Stabilization)
To prevent database path and environment mistakes, the following baseline is locked:
- **Canonical DB Path**: `/app/applet/prisma/dev.db` (Absolute path required).
- **Canonical Env Source**: Root `.env` file.
- **Startup Flow**: `npm run dev` executes `tsx start.ts`, which ensures Prisma client generation and environment stabilization before launching `server.ts`.
- **Critical Rules**:
    - NEVER use relative paths for `DATABASE_URL` in production or shared environments.
    - NEVER allow nested `prisma/prisma/dev.db` directories.
    - NEVER remove `dotenv.config()` from the entry points.
    - Database re-seeding is manual and should not be automated on startup.
