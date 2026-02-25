import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import queueRoutes from './routes/queue.js';
import reportsRoutes from './routes/reports.js';
import subscriptionRoutes from './routes/subscriptions.js';
import userRoutes from './routes/users.js';
import webhookRoutes from './routes/webhooks.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://accounts.google.com',
          'https://apis.google.com',
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://accounts.google.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: [
          "'self'",
          'data:',
          'https://*.googleusercontent.com',
          'https://lh3.googleusercontent.com',
        ],
        connectSrc: ["'self'", 'https://accounts.google.com', 'https://www.googleapis.com'],
        frameSrc: ["'self'", 'https://accounts.google.com'],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.WEB_DASHBOARD_URL,
      'http://localhost:3000',
      'https://aivideointel.thenewfuse.com',
      'https://accounts.google.com',
    ];

    // Check if origin is in allowed list or is a chrome extension
    if (allowedOrigins.includes(origin) || origin.startsWith('chrome-extension://')) {
      callback(null, true);
    } else {
      console.log('Blocked CORS origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Body parsing middleware
// Note: Stripe webhooks need raw body, so we handle that separately
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Serve static files from the local directory
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Explicit routes for cleaner URLs
app.get('/support', (req, res) => {
  res.sendFile(path.join(publicPath, 'support.html'));
});

// Root endpoint serves index.html via express.static, but we can verify
// Or we can leave this specific handler if we want to confirm backend is running at /api/health
console.log(`📂 Serving static files from: ${publicPath}`);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/webhooks', webhookRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'AI Video Intelligence Suite API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      subscriptions: '/api/subscriptions',
      queue: '/api/queue',
      reports: '/api/reports',
      webhooks: '/api/webhooks',
    },
    documentation: 'https://docs.aivideointelligence.com',
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
