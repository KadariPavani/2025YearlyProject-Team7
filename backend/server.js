const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config();

// Use serverless-optimized database connection
const connectDB = process.env.VERCEL === '1' 
  ? require('./config/database.serverless')
  : require('./config/database');

// Initialize database connection (fire and forget for serverless)
// Connection will complete in background; mongoose will buffer commands if needed
connectDB().catch(err => {
});

const app = express();

// Body parser middleware (increased limits for multipart requests)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Configure CORS to support multiple frontend URLs (comma-separated) and local dev origins
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : []),
  // Vercel provides VERCEL_URL at deploy-time, add it automatically so backend accepts requests from the deployed frontend
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5176'
].filter(Boolean);


app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g., Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    const err = new Error('Not allowed by CORS');
    err.status = 403;
    return callback(err);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200,
}));

// Middleware: Ensure a DB connection is available for serverless invocations
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (err) {
    // proceed to let handlers return appropriate errors; this avoids blocking requests indefinitely
  }
  return next();
});

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


app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to INFOVERSE API',
    version: '1.0.1',
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
const publicRoutes = require('./routes/publicRoutes');
const pastStudentRoutes = require('./routes/pastStudentRoutes');

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

// Public routes (no auth required)
app.use('/api/public', publicRoutes);

// Past student self-service portal
app.use('/api/past-student', pastStudentRoutes);



// Global error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    server.close(() => process.exit(1));
  });
} else {
}

// Export the Express app for Vercel serverless
module.exports = app;
