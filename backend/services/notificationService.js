const Notification = require('../models/Notification');

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
      const notification = await Notification.create({
        type,
        message,
        user,
        relatedTo,
        onModel,
        priority,
        read: false
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getNotifications(userId) {
    try {
      const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(50);
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { user: userId, read: false },
        { read: true }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        user: userId,
        read: false
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
}

module.exports = NotificationService; 