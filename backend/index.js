/**
 * @fileoverview Backend Server Entry Point
 * 
 * Main Express application server for the Cricket Match Feedback & Team Management System.
 * Handles routing, middleware setup, and error handling.
 * 
 * @module index
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/database');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const whatsappRoutes = require('./routes/whatsapp');
const whatsappAnalyticsRoutes = require('./routes/whatsapp-analytics');
const matchRoutes = require('./routes/matches');
const availabilityRoutes = require('./routes/availability');
const paymentRoutes = require('./routes/payments');
const seedRoutes = require('./routes/seed');
const publicRoutes = require('./routes/public');
const profileRoutes = require('./routes/profile');
const eventsRoutes = require('./routes/events');
const webhookProxyRoutes = require('./routes/webhookProxy');
const developerRoutes = require('./routes/developer');
const groundRoutes = require('./routes/grounds');
const organizationRoutes = require('./routes/organizations');
const tournamentRoutes = require('./routes/tournaments');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Redact sensitive query params (e.g. JWT) from URL for logging
function urlForLog(url) {
  if (!url || typeof url !== 'string') return url;
  try {
    const i = url.indexOf('?');
    if (i === -1) return url;
    const path = url.slice(0, i);
    const search = url.slice(i + 1);
    const params = new URLSearchParams(search);
    const redactKeys = ['token', 'authorization', 'key', 'api_key', 'apikey'];
    redactKeys.forEach(k => {
      if (params.has(k)) params.set(k, '***');
    });
    const safe = params.toString();
    return safe ? `${path}?${safe}` : path;
  } catch {
    return url.replace(/token=[^&]+/gi, 'token=***');
  }
}

morgan.token('url', (req) => urlForLog(req.originalUrl || req.url));

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Request logging (URL redacted: no tokens or API keys in logs)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${urlForLog(req.originalUrl || req.url)}`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/organizations', organizationRoutes);  // Multi-tenant org management
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/whatsapp/analytics', whatsappAnalyticsRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/webhook-proxy', webhookProxyRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/grounds', groundRoutes);
app.use('/api/tournaments', tournamentRoutes);  // Tournament management

/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 * 
 * @route GET /api/health
 * @access Public
 * @returns {Object} 200 - Health status with timestamp and uptime
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/version
 * Returns version information for deployed services
 * 
 * @route GET /api/version
 * @access Public
 * @returns {Object} 200 - Version info for backend service
 */
app.get('/api/version', (req, res) => {
  const packageJson = require('./package.json');
  res.json({
    service: 'backend',
    version: process.env.APP_VERSION || packageJson.version,
    buildDate: process.env.BUILD_DATE || null,
    packageVersion: packageJson.version,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * GET /api/version/ai-service
 * Fetches version information from the AI service
 * 
 * @route GET /api/version/ai-service
 * @access Public
 * @returns {Object} 200 - Version info for AI service
 */
app.get('/api/version/ai-service', async (req, res) => {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
  
  if (!AI_SERVICE_URL) {
    return res.json({
      service: 'ai-service',
      version: 'N/A',
      buildDate: null,
      error: 'AI service URL not configured'
    });
  }

  try {
    const axios = require('axios');
    const response = await axios.get(`${AI_SERVICE_URL}/version`, {
      timeout: 5000,
      headers: {
        // For Cloud Run internal service-to-service auth
        ...(process.env.AI_SERVICE_ID_TOKEN && {
          'Authorization': `Bearer ${process.env.AI_SERVICE_ID_TOKEN}`
        })
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching AI service version:', error.message);
    res.json({
      service: 'ai-service',
      version: 'N/A',
      buildDate: null,
      error: 'Failed to fetch AI service version'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${urlForLog(req.originalUrl || req.url)}`);
  res.status(404).json({
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
