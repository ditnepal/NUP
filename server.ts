import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { setupSwagger } from './src/lib/swagger';

// Import routers
import authRouter from './src/api/auth';
import membersRouter from './src/api/members';
import supportersRouter from './src/api/supporters';
import cmsRouter from './src/api/cms';
import publicRouter from './src/api/public';
import dashboardRouter from './src/api/dashboard';
import transactionsRouter from './src/api/transactions';
import eventsRouter from './src/api/events';
import grievancesRouter from './src/api/grievances';
import auditlogsRouter from './src/api/auditlogs';
import committeesRouter from './src/api/committees';
import candidatesRouter from './src/api/candidates';
import documentsRouter from './src/api/documents';
import campaignsRouter from './src/api/campaigns';
import boothsRouter from './src/api/booths';

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
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/members', membersRouter);
  app.use('/api/v1/supporters', supportersRouter);
  app.use('/api/v1/cms', cmsRouter);
  app.use('/api/v1/public', publicRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/transactions', transactionsRouter);
  app.use('/api/v1/events', eventsRouter);
  app.use('/api/v1/grievances', grievancesRouter);
  app.use('/api/v1/auditlogs', auditlogsRouter);
  app.use('/api/v1/committees', committeesRouter);
  app.use('/api/v1/candidates', candidatesRouter);
  app.use('/api/v1/documents', documentsRouter);
  app.use('/api/v1/campaigns', campaignsRouter);
  app.use('/api/v1/booths', boothsRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
  });
}

startServer();
