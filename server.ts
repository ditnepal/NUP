import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';

// Load environment variables from .env file
const envResult = dotenv.config();

// Explicitly override if .env has a value
if (envResult.parsed && envResult.parsed.DATABASE_URL) {
  process.env.DATABASE_URL = envResult.parsed.DATABASE_URL;
}

const dbPath = path.join(process.cwd(), 'prisma/dev.db');
const DEFAULT_DB_URL = `file:${dbPath}`;
if (!process.env.DATABASE_URL) {
  console.warn(`[WARN] DATABASE_URL is missing. Using default: ${DEFAULT_DB_URL}`);
  process.env.DATABASE_URL = DEFAULT_DB_URL;
}

if (process.env.DATABASE_URL !== DEFAULT_DB_URL && process.env.DATABASE_URL !== 'file:/app/applet/prisma/dev.db') {
  console.warn('[WARN] DATABASE_URL might be non-standard');
  console.warn(`[WARN] Expected: ${DEFAULT_DB_URL} or file:/app/applet/prisma/dev.db`);
  console.warn(`[WARN] Received: ${process.env.DATABASE_URL}`);
}

// Check if database exists and is not empty
try {
  if (!fs.existsSync(dbPath)) {
    console.warn('[WARN] Database file not found at ' + dbPath);
    console.warn('[WARN] Attempting to initialize database...');
  } else {
    const stats = fs.statSync(dbPath);
    if (stats.size === 0) {
      console.warn('[WARN] Database file exists but is empty (0 bytes).');
    }
  }
} catch (e) {
  console.error('[ERROR] Error checking database file:', e);
}

import { createServer as createViteServer } from 'vite';
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
import systemConfigRouter from './src/api/systemConfig';
import { systemConfigService } from './src/services/systemConfig.service';

export async function createApp() {
  const app = express();

  // Trust the proxy (needed for rate limiting behind nginx)
  // Set to true to trust all proxies, or 1 to trust the first proxy
  app.set('trust proxy', true);

  // Middleware - CORS MUST BE FIRST
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Request logger for debugging
  app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url} - Headers: ${JSON.stringify(req.headers)}`);
    next();
  });

  // Debug endpoint to check headers seen by server
  app.get('/api/v1/debug/headers', (req, res) => {
    res.json({
      headers: req.headers,
      ip: req.ip,
      ips: req.ips,
      protocol: req.protocol,
      secure: req.secure,
      url: req.url,
      originalUrl: req.originalUrl
    });
  });

  // Force JSON content-type for all API routes
  app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

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

  // Serve uploaded documents
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // API Routes - Mount on both /api and /api/v1 for compatibility
  const apiPrefixes = ['/api/v1', '/api'];
  
  apiPrefixes.forEach(prefix => {
    app.use(`${prefix}/auth`, authRouter);
    app.use(`${prefix}/members`, membersRouter);
    app.use(`${prefix}/renewals`, renewalsRouter);
    app.use(`${prefix}/supporters`, supportersRouter);
    app.use(`${prefix}/cms`, cmsRouter);
    app.use(`${prefix}/public`, publicRouter);
    app.use(`${prefix}/dashboard`, dashboardRouter);
    app.use(`${prefix}/auditlogs`, auditlogsRouter);
    app.use(`${prefix}/booths`, boothsRouter);
    app.use(`${prefix}/campaigns`, campaignsRouter);
    app.use(`${prefix}/candidates`, candidatesRouter);
    app.use(`${prefix}/committees`, committeesRouter);
    app.use(`${prefix}/documents`, documentsRouter);
    app.use(`${prefix}/events`, eventsRouter);
    app.use(`${prefix}/app-events`, appEventsRouter);
    app.use(`${prefix}/grievances`, grievancesRouter);
    app.use(`${prefix}/surveys`, surveyRouter);
    app.use(`${prefix}/pgis`, pgisRouter);
    app.use(`${prefix}/transactions`, transactionsRouter);
    app.use(`${prefix}/hierarchy`, hierarchyRouter);
    app.use(`${prefix}/offices`, officesRouter);
    app.use(`${prefix}/volunteers`, volunteersRouter);
    app.use(`${prefix}/communication`, communicationRouter);
    app.use(`${prefix}/training`, trainingRouter);
    app.use(`${prefix}/finance`, financeRouter);
    app.use(`${prefix}/election`, electionRouter);
    app.use(`${prefix}/warroom`, warroomRouter);
    app.use(`${prefix}/users`, usersRouter);
    app.use(`${prefix}/notifications`, notificationsRouter);
    app.use(`${prefix}/system-config`, systemConfigRouter);
  });

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

  // Initialize default system configs
  try {
    await systemConfigService.initializeDefaults();
    console.log('[SYSTEM] Default system configurations initialized');
  } catch (error: any) {
    console.error('[SYSTEM] Error initializing system configurations:', error);
    if (error.code === 'P2021') {
      console.error('[FATAL] Database tables missing (P2021).');
      console.error('[FATAL] Please run `npx prisma db push` and `npx tsx seed.ts` manually to initialize the database schema.');
      // process.exit(1); // Keep server alive for debugging
    }
  }

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
