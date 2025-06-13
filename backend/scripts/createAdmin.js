const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://muronhumfix:Muron%40123@cluster0.8kovk.mongodb.net/sacco_db?retryWrites=true&w=majority';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create admin account
const createAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@sacco.com' });
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
      phoneNumber: '+1234567890',
      address: 'Admin Office'
    });

    console.log('Admin account created successfully:', {
      email: admin.email,
      role: admin.role,
      memberId: admin.memberId
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin(); 