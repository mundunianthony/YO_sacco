require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sacco');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin account already exists');
      process.exit(0);
    }

    // Create admin account
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@sacco.com',
      password: 'Admin@123',
      role: 'admin',
      status: 'active',
      memberId: 'ADMIN001',
      phoneNumber: '1234567890',
      address: 'Admin Address'
    });

    console.log('Admin account created successfully:', {
      id: admin._id,
      email: admin.email,
      role: admin.role
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin(); 