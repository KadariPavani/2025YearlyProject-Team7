const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload'); // Add this

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// File upload middleware setup (must be before routes)
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max file size
  abortOnLimit: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Route files
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
const adminBatchRoutes = require('./routes/adminBatchRoutes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminBatchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tpo', tpoRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/references', referenceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/syllabi', syllabusRoutes); // Added

// Error handler middleware (should be last)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message, err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`, err.stack);
  server.close(() => {
    process.exit(1);
  });
});
