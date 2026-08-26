import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB, getDBStatus } from './server/config/db.js';
import { errorMiddleware } from './server/middleware/errorMiddleware.js';
import authRoutes from './server/routes/authRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import predictionRoutes from './server/routes/predictionRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import { ModelService } from './server/services/modelService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Trust reverse proxy (Cloud Run / Nginx) for accurate IP resolution behind proxy
app.set('trust proxy', 1);

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Permissive for CDN styles & charts in preview
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const clientUrl = process.env.CLIENT_URL || '*';
app.use(
  cors({
    origin: clientUrl === '*' ? true : [clientUrl, 'http://localhost:3000', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    trustProxy: false,
  },
});
app.use('/api', generalLimiter);

// Specific Prediction Rate Limiter
const predictionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Rate limit reached for job predictions. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    trustProxy: false,
  },
});
app.use('/api/predictions', predictionLimiter);

// Start Python ML Microservice on port 8000 in background
let pyServiceProcess: any = null;
function startPythonMLService() {
  try {
    const mlScript = path.resolve(__dirname, 'ml/predict.py');
    if (fs.existsSync(mlScript)) {
      pyServiceProcess = spawn('python3', [mlScript, '--server', '8000'], {
        detached: false,
        stdio: 'pipe',
      });

      pyServiceProcess.stdout?.on('data', (data: any) => {
        const msg = data.toString().trim();
        if (msg) console.log(`[Python ML Service] ${msg}`);
      });

      pyServiceProcess.stderr?.on('data', (data: any) => {
        const msg = data.toString().trim();
        if (msg && !msg.includes('GET /health')) console.warn(`[Python ML] ${msg}`);
      });

      pyServiceProcess.on('error', (err: any) => {
        console.log(`[ML Engine] Running built-in native vectorized Logistic Regression engine (Python background server inactive: ${err.message})`);
      });

      pyServiceProcess.on('exit', (code: number) => {
        console.log(`[Python ML Service] Process stopped with code ${code}`);
      });
    }
  } catch (err) {
    console.warn('Could not launch background Python server process:', err);
  }
}

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/admin', adminRoutes);

// Public configuration route (safe publishable keys only, never secrets)
app.get('/api/config', (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  const isRealSupabaseConfigured =
    supabaseUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    !supabaseUrl.includes('your_supabase_project_url');

  res.json({
    success: true,
    data: {
      supabaseUrl: isRealSupabaseConfigured ? supabaseUrl : '',
      supabaseAnonKey: isRealSupabaseConfigured ? supabaseAnonKey : '',
      demoMode: !isRealSupabaseConfigured,
      appName: 'CareerPredict AI',
      modelVersion: '1.0.0',
    },
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = getDBStatus();
  const metadata = ModelService.getModelMetadata();

  let mlStatus = 'offline';
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 1000);
    const mlRes = await fetch('http://localhost:8000/health', { signal: controller.signal });
    clearTimeout(t);
    if (mlRes.ok) mlStatus = 'connected (HTTP :8000)';
    else mlStatus = 'fallback (CLI inference)';
  } catch (e) {
    mlStatus = 'available (Direct Logistic Engine)';
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    api: 'healthy',
    database: dbStatus.type === 'mongodb' ? 'MongoDB connected' : 'Embedded DB active',
    mlService: mlStatus,
    modelLoaded: true,
    modelVersion: metadata.modelVersion,
    metrics: metadata.metrics,
  });
});

// Serve client static files
const clientPath = path.resolve(__dirname, 'client');
if (fs.existsSync(clientPath)) {
  app.use(express.static(clientPath));

  // Friendly HTML routing
  const htmlPages = [
    'login',
    'register',
    'dashboard',
    'predict',
    'history',
    'prediction-details',
    'profile',
    'about',
    'model',
    'admin',
    'privacy',
  ];

  for (const page of htmlPages) {
    app.get(`/${page}`, (req, res) => {
      res.sendFile(path.join(clientPath, `${page}.html`));
    });
    app.get(`/${page}.html`, (req, res) => {
      res.sendFile(path.join(clientPath, `${page}.html`));
    });
  }

  app.get('/', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });

  // Fallback for client navigation
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Error middleware
app.use(errorMiddleware);

// Server startup
async function startServer() {
  await connectDB();
  startPythonMLService();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`  CAREERPREDICT AI SERVER RUNNING ON PORT ${PORT} `);
    console.log(`  URL: http://localhost:${PORT}                   `);
    console.log(`  Model: Logistic Regression (scikit-learn)       `);
    console.log(`=================================================`);
  });

  // Graceful shutdown
  const handleShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Closing server gracefully...`);
    if (pyServiceProcess) {
      try {
        pyServiceProcess.kill('SIGTERM');
      } catch (e) {}
    }
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

startServer();
