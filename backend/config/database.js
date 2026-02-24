const mongoose = require('mongoose');
const seedUsers = require('./seeder');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);


    // Add seed data if NODE_ENV is development
    if (process.env.NODE_ENV === 'development') {
      await seedUsers();
    }
  } catch (error) {
    process.exit(1);
  }
};

module.exports = connectDB;