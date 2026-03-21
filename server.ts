import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { setupSwagger } from './src/lib/swagger';

// Import routers
import authRouter from './src/api/auth';
import membersRouter from './src/api/members';
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

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Setup Swagger API Documentation
  setupSwagger(app);

  // API Routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/test', (req, res) => res.send('Server is running!'));

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/members', membersRouter);
  app.use('/api/v1/supporters', supportersRouter);
  app.use('/api/v1/cms', cmsRouter);
  app.use('/api/v1/public', publicRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/auditlogs', auditlogsRouter);
  app.use('/api/v1/booths', boothsRouter);
  app.use('/api/v1/campaigns', campaignsRouter);
  app.use('/api/v1/candidates', candidatesRouter);
  app.use('/api/v1/committees', committeesRouter);
  app.use('/api/v1/documents', documentsRouter);
  app.use('/api/v1/events', eventsRouter);
  app.use('/api/v1/grievances', grievancesRouter);
  app.use('/api/v1/surveys', surveyRouter);
  app.use('/api/v1/pgis', pgisRouter);
  app.use('/api/v1/transactions', transactionsRouter);
  app.use('/api/v1/hierarchy', hierarchyRouter);
  app.use('/api/v1/offices', officesRouter);
  app.use('/api/v1/volunteers', volunteersRouter);
  app.use('/api/v1/communication', communicationRouter);
  app.use('/api/v1/training', trainingRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/finance', financeRouter);
  app.use('/api/v1/election', electionRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  console.log(`[SERVER] NODE_ENV: ${process.env.NODE_ENV}`);
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath);

  // Vite middleware for development
  if (!isProd || !hasDist) {
    console.log('[SERVER] Initializing Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    console.log('[SERVER] Vite middleware initialized.');
    app.use(vite.middlewares);
  } else {
    console.log(`[SERVER] Serving static files from ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Running on http://0.0.0.0:${PORT}`);
    console.log(`[SERVER] API Base Path: /api/v1`);
    console.log(`[SERVER] Swagger Docs: /api-docs`);
  });
}

console.log('[SERVER] Starting server initialization...');
startServer().catch(err => {
  console.error('[SERVER] Failed to start server:', err);
});
