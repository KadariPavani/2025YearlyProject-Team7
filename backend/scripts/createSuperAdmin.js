const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if super admin exists
    const existingAdmin = await Admin.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('⚠️ Super admin already exists:', process.env.SUPER_ADMIN_EMAIL);
      process.exit(0);
    }

    // Create super admin
    const admin = await Admin.create({
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.SUPER_ADMIN_PASSWORD,
      name: 'Super Admin',
    });

    console.log('✅ Super admin created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', admin.name);
    console.log('\nYou can now login with these credentials.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
