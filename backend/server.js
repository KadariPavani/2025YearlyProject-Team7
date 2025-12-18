const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const cookieParser = require('cookie-parser');
const path = require('path');



dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware (increased limits for multipart requests)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5176'
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

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
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`, err.stack);
  server.close(() => process.exit(1));
});
