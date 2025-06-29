const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  // Create a notification
  static async createNotification(data) {
    console.log('=== CREATING NOTIFICATION ===');
    console.log('Notification data:', data);

    try {
      const notification = await Notification.create({
        type: data.type,
        message: data.message,
        user: data.user,
        relatedTo: data.relatedTo,
        onModel: data.onModel,
        priority: data.priority || 'medium',
        category: data.category || 'general',
        read: false
      });

      console.log('Notification created successfully:', {
        id: notification._id,
        type: notification.type,
        user: notification.user,
        message: notification.message
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', {
        message: error.message,
        stack: error.stack,
        data: data
      });
      throw error;
    }
  }

  // Get user notifications with pagination
  static async getUserNotifications(userId, page = 1, limit = 20, filters = {}) {
    console.log('=== GETTING USER NOTIFICATIONS ===');
    console.log('User ID:', userId);
    console.log('Filters:', filters);

    try {
      const query = { user: userId, ...filters };
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('relatedTo')
        .lean();

      console.log('Found notifications:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    console.log('=== MARKING NOTIFICATION AS READ ===');
    console.log('Notification ID:', notificationId);
    console.log('User ID:', userId);

    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true, readAt: new Date() },
        { new: true }
      );

      console.log('Notification marked as read:', notification ? 'Success' : 'Not found');
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    console.log('=== MARKING ALL NOTIFICATIONS AS READ ===');
    console.log('User ID:', userId);

    try {
      const result = await Notification.updateMany(
        { user: userId, read: false },
        { read: true, readAt: new Date() }
      );

      console.log('Marked notifications as read:', result.modifiedCount);
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread count for a user
  static async getUnreadCount(userId) {
    console.log('=== GETTING UNREAD COUNT ===');
    console.log('User ID:', userId);

    try {
      const count = await Notification.countDocuments({
        user: userId,
        read: false
      });

      console.log('Unread count:', count);
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Notify all admins
  static async notifyAllAdmins(data) {
    console.log('=== NOTIFYING ALL ADMINS ===');
    console.log('Notification data:', data);

    try {
      const adminUsers = await User.find({ role: 'admin' });
      console.log('Found admin users:', adminUsers.length);

      const notifications = [];
      for (const admin of adminUsers) {
        const notification = await this.createNotification({
          ...data,
          user: admin._id
        });
        notifications.push(notification);
      }

      console.log('Created admin notifications:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('Error notifying all admins:', error);
      throw error;
    }
  }

  // Specific notification types
  static async notifyNewLoanApplication(adminId, memberName, amount) {
    return this.createNotification({
      type: 'new_loan_application',
      message: `New loan application from ${memberName} for UGX${amount.toLocaleString()}`,
      user: adminId,
      priority: 'high',
      category: 'loan'
    });
  }

  static async notifyLoanStatusChange(userId, loanId, status) {
    let message = '';
    switch (status) {
      case 'approved':
        message = 'Your loan application has been approved!';
        break;
      case 'rejected':
        message = 'Your loan application has been rejected.';
        break;
      case 'active':
        message = 'Your loan has been activated and funds have been disbursed.';
        break;
      default:
        message = `Your loan status has been updated to ${status}.`;
    }

    return this.createNotification({
      type: 'loan_status_change',
      message,
      user: userId,
      relatedTo: loanId,
      onModel: 'Loan',
      priority: 'high',
      category: 'loan'
    });
  }

  static async notifyLoanPayment(userId, loanId, amount) {
    return this.createNotification({
      type: 'loan_payment',
      message: `Your loan payment of UGX${amount.toLocaleString()} has been received and processed.`,
      user: userId,
      relatedTo: loanId,
      onModel: 'Loan',
      priority: 'medium',
      category: 'payment'
    });
  }

  static async notifyLoanCompleted(userId, loanId) {
    return this.createNotification({
      type: 'loan_completed',
      message: 'Congratulations! Your loan has been fully paid and is now cleared.',
      user: userId,
      relatedTo: loanId,
      onModel: 'Loan',
      priority: 'high',
      category: 'loan'
    });
  }

  static async notifySavingsDeposit(userId, transactionId, amount) {
    return this.createNotification({
      type: 'savings_deposit',
      message: `Your deposit of UGX${amount.toLocaleString()} has been processed successfully.`,
      user: userId,
      relatedTo: transactionId,
      onModel: 'Transaction',
      priority: 'medium',
      category: 'savings'
    });
  }

  static async notifyWithdrawalRequest(userId, transactionId, amount) {
    // Notify admins about withdrawal request
    const adminUsers = await User.find({ role: 'admin' });
    const user = await User.findById(userId);
    
    for (const admin of adminUsers) {
      await this.createNotification({
        type: 'withdrawal_request',
        message: `${user.firstName} ${user.lastName} has requested a withdrawal of UGX${amount.toLocaleString()}`,
        user: admin._id,
        relatedTo: transactionId,
        onModel: 'Transaction',
        priority: 'high',
        category: 'withdrawal'
      });
    }

    // Notify user about request submission
    return this.createNotification({
      type: 'withdrawal_request_submitted',
      message: `Your withdrawal request for UGX${amount.toLocaleString()} has been submitted and is pending approval.`,
      user: userId,
      relatedTo: transactionId,
      onModel: 'Transaction',
      priority: 'medium',
      category: 'withdrawal'
    });
  }

  static async notifyWithdrawalApproved(userId, transactionId, amount) {
    return this.createNotification({
      type: 'withdrawal_approved',
      message: `Your withdrawal request for UGX${amount.toLocaleString()} has been approved and processed.`,
      user: userId,
      relatedTo: transactionId,
      onModel: 'Transaction',
      priority: 'high',
      category: 'withdrawal'
    });
  }

  static async notifyWithdrawalRejected(userId, transactionId, amount, reason) {
    return this.createNotification({
      type: 'withdrawal_rejected',
      message: `Your withdrawal request for UGX${amount.toLocaleString()} has been rejected. Reason: ${reason}`,
      user: userId,
      relatedTo: transactionId,
      onModel: 'Transaction',
      priority: 'high',
      category: 'withdrawal'
    });
  }

  static async notifyLargeTransaction(adminId, memberName, amount, type) {
    return this.createNotification({
      type: 'large_transaction',
      message: `Large ${type} of UGX${amount.toLocaleString()} by ${memberName}`,
      user: adminId,
      priority: 'high',
      category: 'transaction'
    });
  }

  static async notifyLargeDeposit(adminId, memberName, amount) {
    return this.notifyLargeTransaction(adminId, memberName, amount, 'deposit');
  }

  static async notifyLargeWithdrawal(adminId, memberName, amount) {
    return this.notifyLargeTransaction(adminId, memberName, amount, 'withdrawal');
  }

  static async notifyUnusualTransaction(adminId, memberName) {
    return this.createNotification({
      type: 'unusual_transaction',
      message: `Unusual transaction pattern detected for ${memberName} (5+ transactions in 24 hours)`,
      user: adminId,
      priority: 'medium',
      category: 'security'
    });
  }

  static async notifyMaintenance(adminId, details) {
    return this.createNotification({
      type: 'maintenance',
      message: `System maintenance scheduled: ${details}`,
      user: adminId,
      priority: 'medium',
      category: 'system'
    });
  }

  static async notifySystemAlert(adminId, message) {
    return this.createNotification({
      type: 'system_alert',
      message,
      user: adminId,
      priority: 'high',
      category: 'system'
    });
  }

  // Clean up old notifications (older than 30 days)
  static async cleanupOldNotifications() {
    console.log('=== CLEANING UP OLD NOTIFICATIONS ===');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        read: true
      });

      console.log('Cleaned up old notifications:', result.deletedCount);
      return result;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  // Get notification statistics
  static async getNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } },
            byType: {
              $push: {
                type: '$type',
                read: '$read'
              }
            }
          }
        }
      ]);

      return stats[0] || { total: 0, unread: 0, byType: [] };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;

