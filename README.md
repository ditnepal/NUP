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
- **Database/Auth**: Firebase (Firestore, Authentication).
- **Libraries**: Recharts (Analytics), jsPDF (ID Cards), PapaParse (CSV), i18next (i18n).

### Getting Started
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Set up Firebase:
   - Create a project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore and Authentication (Google).
   - Copy your config to `firebase-applet-config.json`.
4. Run the development server: `npm run dev`.

### Deployment
The app is designed to run on Cloud Run or any Node.js environment.
1. Build the app: `npm run build`.
2. Start the production server: `NODE_ENV=production npm start`.

### Environment Variables
See `.env.example` for required variables.
