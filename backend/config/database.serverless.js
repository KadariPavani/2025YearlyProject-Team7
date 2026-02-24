const mongoose = require('mongoose');

// Global connection cache for serverless
let cachedDb = null;

const connectDB = async () => {
  // Return cached connection if available (serverless optimization)
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const opts = {
      serverSelectionTimeoutMS: 10000, // Increased to 10s for serverless cold starts
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Minimum 1 connection for serverless
      bufferCommands: true, // Enable buffering for serverless to handle slow connections
    };

    // Retry logic for serverless cold-starts and transient network issues
    let conn;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        conn = await mongoose.connect(process.env.MONGO_URI, opts);
        break;
      } catch (err) {
        if (attempt < maxRetries) {
          // Backoff before retrying
          await new Promise(res => setTimeout(res, 1000 * attempt));
        } else {
          throw err;
        }
      }
    }


    // Cache the connection
    cachedDb = conn;

    // Add seed data only if NODE_ENV is development (skip in production)
    if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
      try {
        const seedUsers = require('./seeder');
        await seedUsers();
      } catch (seedError) {
      }
    }

    return conn;
  } catch (error) {
    
    // Don't exit process in serverless environment
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
    
    throw error;
  }
};

// Handle connection events for better debugging
mongoose.connection.on('connected', () => {
});

mongoose.connection.on('error', (err) => {
});

mongoose.connection.on('disconnected', () => {
});

// Graceful shutdown (not needed in serverless but useful for local dev)
if (process.env.VERCEL !== '1') {
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
}

module.exports = connectDB;
