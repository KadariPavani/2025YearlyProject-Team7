const mongoose = require('mongoose');

// Global connection cache for serverless
let cachedDb = null;

const connectDB = async () => {
  // Return cached connection if available (serverless optimization)
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached MongoDB connection');
    return cachedDb;
  }

  try {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Minimum 2 connections in the pool
      bufferCommands: false, // Disable mongoose buffering
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, opts);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Connection State: ${mongoose.connection.readyState}`);

    // Cache the connection
    cachedDb = conn;

    // Add seed data only if NODE_ENV is development (skip in production)
    if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
      try {
        const seedUsers = require('./seeder');
        await seedUsers();
      } catch (seedError) {
        console.warn('⚠️ Seeder not available or failed:', seedError.message);
      }
    }

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Don't exit process in serverless environment
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
    
    throw error;
  }
};

// Handle connection events for better debugging
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected');
});

// Graceful shutdown (not needed in serverless but useful for local dev)
if (process.env.VERCEL !== '1') {
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('✅ Mongoose connection closed due to app termination');
    process.exit(0);
  });
}

module.exports = connectDB;
