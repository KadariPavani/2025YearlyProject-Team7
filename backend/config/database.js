const mongoose = require('mongoose');
const seedUsers = require('./seeder');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Add seed data if NODE_ENV is development
    if (process.env.NODE_ENV === 'development') {
      await seedUsers();
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;