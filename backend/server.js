require('dotenv').config();
<<<<<<< HEAD
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// SECURITY MIDDLEWARE
// =====================================================
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
=======
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const { connectDB } = require('./config/database');
const routes     = require('./routes/index');

const app  = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// Security — allow images to be served cross-origin
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin:  process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
>>>>>>> a01f1c1 (Initial commit - NUAITS Voting System)
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
<<<<<<< HEAD
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const votingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many voting attempts. Please try again in 15 minutes.' },
=======
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message:  { success:false, message:'Too many requests. Please try again later.' },
});
const votingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { success:false, message:'Too many voting attempts. Please try again in 15 minutes.' },
>>>>>>> a01f1c1 (Initial commit - NUAITS Voting System)
});

app.use(limiter);
app.use('/api/vote', votingLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

<<<<<<< HEAD
// =====================================================
// ROUTES
// =====================================================
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// =====================================================
// START SERVER
// =====================================================
=======
// ── Serve uploaded candidate photos as static files ──
// Accessible at: http://localhost:5000/uploads/candidates/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

// ── API routes ───────────────────────────────────────
app.use('/api', routes);

// 404
app.use((req, res) => res.status(404).json({ success:false, message:'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ success:false, message:'File too large. Maximum size is 5MB.' });
  if (err.message && err.message.includes('Only image'))
    return res.status(400).json({ success:false, message: err.message });
  console.error('Unhandled error:', err);
  res.status(500).json({ success:false, message:'Internal server error' });
});

>>>>>>> a01f1c1 (Initial commit - NUAITS Voting System)
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 NUAITS Voting System Backend`);
<<<<<<< HEAD
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 API Base: http://localhost:${PORT}/api\n`);
=======
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🖼  Photos: http://localhost:${PORT}/uploads/candidates/`);
    console.log(`📊 API:    http://localhost:${PORT}/api\n`);
>>>>>>> a01f1c1 (Initial commit - NUAITS Voting System)
  });
};

start();
<<<<<<< HEAD

=======
>>>>>>> a01f1c1 (Initial commit - NUAITS Voting System)
module.exports = app;
