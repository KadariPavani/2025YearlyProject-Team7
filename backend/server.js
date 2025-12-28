const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

dotenv.config();

// Use serverless-optimized database connection
const connectDB = process.env.VERCEL === '1' 
  ? require('./config/database.serverless')
  : require('./config/database');

// Initialize database connection (fire and forget for serverless)
// Connection will complete in background; mongoose will buffer commands if needed
connectDB().catch(err => {
  console.error('❌ Failed to initialize database connection:', err.message);
});

const app = express();

// Body parser middleware (increased limits for multipart requests)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Configure CORS to support multiple frontend URLs (comma-separated) and local dev origins
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : []),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5176'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g., Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn('Blocked CORS origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200,
}));

// Health check endpoint (crucial for serverless monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'INFOVERSE Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: process.env.VERCEL ? 'Vercel Serverless' : 'Standard Node.js'
  });
});

// Debug endpoint to check environment variables (remove in production after testing)
app.get('/api/debug/env-check', (req, res) => {
  res.status(200).json({
    hasMongoUri: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasFrontendUrl: !!process.env.FRONTEND_URL,
    hasSuperAdminEmail: !!process.env.SUPER_ADMIN_EMAIL,
    mongoUriPrefix: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'NOT SET',
    jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    frontendUrl: process.env.FRONTEND_URL || 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'NOT SET',
    isVercel: process.env.VERCEL || 'NOT SET'
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to INFOVERSE API',
    version: '1.0.0',
    docs: '/api'
  });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tpoRoutes = require('./routes/tpoRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const studentRoutes = require('./routes/studentRoutes');
const coordinatorRoutes = require('./routes/coordinatorRoutes');
const quizRoutes = require('./routes/quizroutes');
const referenceRoutes = require('./routes/referenceRoutes');
const assignmentRoutes = require('./routes/AssignmentRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const PlacementTrainingBatches = require('./routes/placementTrainingRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const studentActivityRoutes = require('./routes/studentActivityRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const contactRoutes = require("./routes/contactRoutes");
const contestsRoutes = require('./routes/contests');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tpo', tpoRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/syllabi', syllabusRoutes);
app.use('/api/placement-training-batches', PlacementTrainingBatches);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/references', referenceRoutes);
app.use('/api/student-activity', studentActivityRoutes);
app.use('/api/contests', contestsRoutes);
app.use("/api", contactRoutes);



// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message, err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`, err.stack);
    server.close(() => process.exit(1));
  });
} else {
  console.log('🔥 Running in Vercel Serverless Mode');
}

// Export the Express app for Vercel serverless
module.exports = app;
