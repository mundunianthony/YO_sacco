const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Load env vars
dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sacco_db')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function checkNotifications() {
  try {
    console.log('=== CHECKING NOTIFICATIONS ===');
    
    // Get all users
    const users = await User.find();
    console.log('Found users:', users.length);
    
    // Check notifications for each user
    for (const user of users) {
      console.log('\nChecking notifications for user:', {
        id: user._id,
        email: user.email,
        role: user.role
      });
      
      const notifications = await Notification.find({ user: user._id });
      console.log('Found notifications:', notifications.length);
      
      if (notifications.length > 0) {
        console.log('First notification:', {
          id: notifications[0]._id,
          type: notifications[0].type,
          message: notifications[0].message,
          read: notifications[0].read,
          createdAt: notifications[0].createdAt
        });
      }
    }
    
    // Get total notifications
    const totalNotifications = await Notification.countDocuments();
    console.log('\nTotal notifications in system:', totalNotifications);
    
  } catch (error) {
    console.error('Error checking notifications:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkNotifications(); 