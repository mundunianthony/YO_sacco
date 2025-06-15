const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  static async createNotification({
    type,
    message,
    user,
    relatedTo,
    onModel,
    priority = 'medium'
  }) {
    try {
      console.log('=== CREATING NOTIFICATION ===');
      console.log('Input data:', {
        type,
        message,
        user,
        relatedTo,
        onModel,
        priority
      });

      // Validate required fields
      if (!type || !message || !user) {
        console.error('Missing required fields:', { type, message, user });
        throw new Error('Missing required fields: type, message, and user are required');
      }

      // Validate type
      const validTypes = [
        'loan_application',
        'loan_approval',
        'loan_rejection',
        'loan_payment',
        'savings_deposit',
        'savings_withdrawal',
        'member_registration',
        'member_status_change',
        'system_alert'
      ];
      if (!validTypes.includes(type)) {
        console.error('Invalid notification type:', type);
        throw new Error(`Invalid notification type: ${type}`);
      }

      // Check if user exists
      console.log('Checking if user exists:', user);
      const userExists = await User.findById(user);
      if (!userExists) {
        console.error('User not found:', user);
        throw new Error(`User not found: ${user}`);
      }
      console.log('User found:', {
        id: userExists._id,
        email: userExists.email,
        role: userExists.role
      });

      console.log('Creating notification in database...');
      const notification = await Notification.create({
        type,
        message,
        user,
        relatedTo,
        onModel,
        priority,
        read: false
      });

      console.log('Notification created successfully:', {
        id: notification._id,
        type: notification.type,
        message: notification.message,
        user: notification.user,
        createdAt: notification.createdAt
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      throw error;
    }
  }

  static async getNotifications(userId) {
    try {
      console.log('=== GETTING NOTIFICATIONS ===');
      console.log('User ID:', userId);

      if (!userId) {
        console.error('User ID is required');
        throw new Error('User ID is required');
      }

      console.log('Finding notifications...');
      const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(50);

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

      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      console.log('=== MARKING NOTIFICATION AS READ ===');
      console.log('Notification ID:', notificationId);
      console.log('User ID:', userId);

      if (!notificationId || !userId) {
        console.error('Missing required fields:', { notificationId, userId });
        throw new Error('Notification ID and User ID are required');
      }

      console.log('Finding notification...');
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        console.error('Notification not found or does not belong to user');
        throw new Error('Notification not found or does not belong to user');
      }

      console.log('Notification marked as read:', {
        id: notification._id,
        type: notification.type,
        message: notification.message,
        read: notification.read
      });

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      console.log('=== MARKING ALL NOTIFICATIONS AS READ ===');
      console.log('User ID:', userId);

      if (!userId) {
        console.error('User ID is required');
        throw new Error('User ID is required');
      }

      console.log('Updating notifications...');
      const result = await Notification.updateMany(
        { user: userId, read: false },
        { read: true }
      );

      console.log('Update result:', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      console.log('=== GETTING UNREAD COUNT ===');
      console.log('User ID:', userId);

      if (!userId) {
        console.error('User ID is required');
        throw new Error('User ID is required');
      }

      console.log('Counting unread notifications...');
      const count = await Notification.countDocuments({
        user: userId,
        read: false
      });

      console.log('Unread count:', count);
      return count;
    } catch (error) {
      console.error('Error getting unread count:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      throw error;
    }
  }
}

module.exports = NotificationService; 