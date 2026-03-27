import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL || process.env.DATABASE_URL !== 'file:/app/applet/prisma/dev.db') {
  console.error('[FATAL] DATABASE_URL is missing or invalid in .env');
  console.error('[FATAL] Expected: file:/app/applet/prisma/dev.db');
  console.error(`[FATAL] Received: ${process.env.DATABASE_URL}`);
  process.exit(1);
}

import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { setupSwagger } from './src/lib/swagger';
import rateLimit from 'express-rate-limit';

// Import routers
import authRouter from './src/api/auth';
import membersRouter from './src/api/members';
import renewalsRouter from './src/api/renewals';
import supportersRouter from './src/api/supporters';
import cmsRouter from './src/api/cms';
import publicRouter from './src/api/public';
import dashboardRouter from './src/api/dashboard';
import auditlogsRouter from './src/api/auditlogs';
import boothsRouter from './src/api/booths';
import campaignsRouter from './src/api/campaigns';
import candidatesRouter from './src/api/candidates';
import committeesRouter from './src/api/committees';
import documentsRouter from './src/api/documents';
import eventsRouter from './src/api/events';
import appEventsRouter from './src/api/appEvents';
import grievancesRouter from './src/api/grievance';
import surveyRouter from './src/api/survey';
import pgisRouter from './src/api/pgis';
import transactionsRouter from './src/api/transactions';
import hierarchyRouter from './src/api/hierarchy';
import officesRouter from './src/api/offices';
import volunteersRouter from './src/api/volunteers';
import communicationRouter from './src/api/communication';
import trainingRouter from './src/api/training';
import notificationsRouter from './src/api/notifications';
import financeRouter from './src/api/finance';
import electionRouter from './src/api/election';
import warroomRouter from './src/api/warroom';
import usersRouter from './src/api/users';

export async function createApp() {
  const app = express();

  // Trust the proxy (needed for rate limiting behind nginx)
  app.set('trust proxy', 1);

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Rate Limiting
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased from 100
    message: { error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased from 500
    message: { error: 'Too many requests from this IP, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Setup Swagger API Documentation
  setupSwagger(app);

  // API Routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/test', (req, res) => res.send('Server is running!'));

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[GLOBAL ERROR HANDLER]', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  // Move user-alerts higher to ensure it's matched
  app.use('/api/v1/user-alerts', notificationsRouter);

  // Serve uploaded documents
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  app.use('/api/v1/auth', authLimiter, authRouter);
  app.use('/api/v1/members', membersRouter);
  app.use('/api/v1/renewals', renewalsRouter);
  app.use('/api/v1/supporters', supportersRouter);
  app.use('/api/v1/cms', cmsRouter);
  app.use('/api/v1/public', publicLimiter, publicRouter);
  app.use('/api/public', publicLimiter, publicRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/auditlogs', auditlogsRouter);
  app.use('/api/v1/booths', boothsRouter);
  app.use('/api/v1/campaigns', campaignsRouter);
  app.use('/api/v1/candidates', candidatesRouter);
  app.use('/api/v1/committees', committeesRouter);
  app.use('/api/v1/documents', documentsRouter);
  app.use('/api/v1/events', eventsRouter);
  app.use('/api/v1/app-events', appEventsRouter);
  app.use('/api/v1/grievances', grievancesRouter);
  app.use('/api/v1/surveys', surveyRouter);
  app.use('/api/v1/pgis', pgisRouter);
  app.use('/api/v1/transactions', transactionsRouter);
  app.use('/api/v1/hierarchy', hierarchyRouter);
  app.use('/api/v1/offices', officesRouter);
  app.use('/api/v1/volunteers', volunteersRouter);
  app.use('/api/v1/communication', communicationRouter);
  app.use('/api/v1/training', trainingRouter);
  app.use('/api/v1/finance', financeRouter);
  app.use('/api/v1/election', electionRouter);
  app.use('/api/v1/warroom', warroomRouter);
  app.use('/api/v1/users', usersRouter);

  // Catch-all for API routes to return 404 JSON instead of HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[SERVER ERROR]', err);
    if (req.path.startsWith('/api/')) {
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    } else {
      next(err);
    }
  });

  console.log(`[SERVER] NODE_ENV: ${process.env.NODE_ENV}`);
  const isProd = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath);

  // Vite middleware for development
  if (!isTest && (!isProd || !hasDist)) {
    console.log('[SERVER] Initializing Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    console.log('[SERVER] Vite middleware initialized.');
    app.use(vite.middlewares);
  } else if (!isTest) {
    console.log(`[SERVER] Serving static files from ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

async function startServer() {
  const PORT = 3000;
  const app = await createApp();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Running on http://0.0.0.0:${PORT}`);
    console.log(`[SERVER] API Base Path: /api/v1`);
    console.log(`[SERVER] Swagger Docs: /api-docs`);
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  console.log('[SERVER] Starting server initialization...');
  startServer().catch(err => {
    console.error('[SERVER] Failed to start server:', err);
  });
}
