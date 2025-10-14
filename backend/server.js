// server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads/profile-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Connect to database
connectDB();

const app = express();

// File upload middleware setup (must be before routes)
// app.use(
//   fileUpload({
//     createParentPath: true,
//     limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max file size
//     abortOnLimit: true,
//   })
// );

// app.use(fileUpload({
//   useTempFiles: true,
//   tempFileDir: '/tmp/',
//   createParentPath: true,
//   limits: { fileSize: 10 * 1024 * 1024 },
//   abortOnLimit: true,
// }));

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  abortOnLimit: true,
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL, // environment variable, if set
      'http://localhost:5173',
      'http://localhost:5174'
    ].filter(Boolean), // removes undefined/null values
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


// Serve uploaded profile images statically
app.use('/uploads/profile-images', express.static(uploadDir));

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

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tpo', tpoRoutes);
app.use('/api/trainer', require('./routes/trainerRoutes'));
app.use('/api/student', studentRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/syllabi', syllabusRoutes);
app.use('/api/placement-training-batches', PlacementTrainingBatches);

// Global error handler (last middleware)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message, err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
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
