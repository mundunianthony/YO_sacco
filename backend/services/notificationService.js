const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  static async createNotification({
    type,
    message,
    user,
    relatedTo,
    onModel,
    priority = 'medium',
    category = 'general'
  }) {
    try {
      console.log('=== CREATE NOTIFICATION ===');
      console.log('Notification data:', {
        type,
        message,
        user,
        relatedTo,
        onModel,
        priority,
        category
      });

      // Validate user exists
      const userExists = await User.findById(user);
      if (!userExists) {
        console.error('User not found:', user);
        throw new Error('User not found');
      }
      console.log('User validated:', userExists.email);

      const notification = await Notification.create({
        type,
        message,
        user,
        relatedTo,
        onModel,
        priority,
        category,
        read: false
      });

      console.log('Notification created successfully:', {
        id: notification._id,
        type: notification.type,
        message: notification.message,
        user: notification.user,
        read: notification.read
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId, page = 1, limit = 20, query = {}) {
    try {
      console.log('Getting notifications for user:', userId);
      console.log('Query:', query);

      const skip = (page - 1) * limit;

      // First get notifications without population to avoid schema errors
      const notifications = await Notification.find({
        user: userId,
        ...query
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      console.log('Found notifications:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      console.log('=== GET UNREAD COUNT ===');
      console.log('User ID:', userId);

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

  static async markAsRead(notificationId, userId) {
    try {
      console.log('=== MARK AS READ ===');
      console.log('Notification ID:', notificationId);
      console.log('User ID:', userId);

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        console.log('Notification not found or does not belong to user');
        return null;
      }

      console.log('Notification marked as read:', {
        id: notification._id,
        type: notification.type,
        message: notification.message
      });

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      console.log('=== MARK ALL AS READ ===');
      console.log('User ID:', userId);

      const result = await Notification.updateMany(
        { user: userId, read: false },
        { read: true }
      );

      console.log('Updated notifications:', {
        matched: result.matchedCount,
        modified: result.modifiedCount
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Admin-specific notification methods
  static async notifyNewMemberRegistration(adminId, memberName) {
    try {
      console.log('Creating new member notification for admin:', adminId);
      return await this.createNotification({
        type: 'new_member',
        message: `New member registration: ${memberName}`,
        user: adminId,
        priority: 'high',
        category: 'member'
      });
    } catch (error) {
      console.error('Error creating new member notification:', error);
      throw error;
    }
  }

  static async notifyMemberStatusChange(adminId, memberName, newStatus) {
    try {
      console.log('Creating member status notification for admin:', adminId);
      return await this.createNotification({
        type: 'member_status',
        message: `Member ${memberName}'s status changed to ${newStatus}`,
        user: adminId,
        priority: 'high',
        category: 'member'
      });
    } catch (error) {
      console.error('Error creating member status notification:', error);
      throw error;
    }
  }

  static async notifyNewLoanApplication(adminId, memberName, amount) {
    try {
      console.log('Creating loan application notification for admin:', adminId);
      return await this.createNotification({
        type: 'new_loan',
        message: `New loan application from ${memberName} for UGX${amount}`,
        user: adminId,
        priority: 'high',
        category: 'loan'
      });
    } catch (error) {
      console.error('Error creating loan application notification:', error);
      throw error;
    }
  }

  static async notifyLargeDeposit(adminId, memberName, amount) {
    try {
      console.log('Creating large deposit notification for admin:', adminId);
      return await this.createNotification({
        type: 'large_deposit',
        message: `Large deposit of UGX${amount} from ${memberName}`,
        user: adminId,
        priority: 'urgent',
        category: 'transaction'
      });
    } catch (error) {
      console.error('Error creating large deposit notification:', error);
      throw error;
    }
  }

  static async notifyLargeWithdrawal(adminId, memberName, amount) {
    try {
      console.log('Creating large withdrawal notification for admin:', adminId);
      return await this.createNotification({
        type: 'large_withdrawal',
        message: `Large withdrawal of UGX${amount} by ${memberName}`,
        user: adminId,
        priority: 'urgent',
        category: 'transaction'
      });
    } catch (error) {
      console.error('Error creating large withdrawal notification:', error);
      throw error;
    }
  }

  static async notifyUnusualTransaction(adminId, memberName) {
    try {
      console.log('Creating unusual transaction notification for admin:', adminId);
      return await this.createNotification({
        type: 'unusual_activity',
        message: `Unusual transaction pattern detected for ${memberName}`,
        user: adminId,
        priority: 'urgent',
        category: 'transaction'
      });
    } catch (error) {
      console.error('Error creating unusual transaction notification:', error);
      throw error;
    }
  }

  // Helper method to notify all admins
  static async notifyAllAdmins(notificationData) {
    try {
      console.log('=== NOTIFY ALL ADMINS ===');
      console.log('Notification data:', notificationData);

      const admins = await User.find({ role: 'admin' });
      console.log('Found admins:', admins.length);
      console.log('Admin IDs:', admins.map(admin => admin._id));

      const notifications = [];
      for (const admin of admins) {
        console.log('Creating notification for admin:', admin.email);
        const notification = await this.createNotification({
          ...notificationData,
          user: admin._id
        });
        notifications.push(notification);
        console.log('Notification created for admin:', {
          admin: admin.email,
          notificationId: notification._id
        });
      }

      console.log('Created notifications for all admins:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('Error notifying all admins:', error);
      throw error;
    }
  }

  // Loan Notifications
  static async notifyLoanApplication(userId, loanId, amount) {
    return this.createNotification({
      type: 'loan_application',
      message: `Your loan application for UGX${amount} has been submitted successfully`,
      user: userId,
      relatedTo: loanId,
      onModel: 'Loan',
      priority: 'medium'
    });
  }

  static async notifyLoanApproval(userId, loanId, amount, monthlyPayment) {
    return this.createNotification({
      type: 'loan_approved',
      message: `Congratulations! Your loan application for UGX${amount} has been approved. Monthly payment: UGX${monthlyPayment}`,
      user: userId,
      relatedTo: loanId,
      onModel: 'Loan',
      priority: 'high'
    });
  }

  static async notifyLoanRejection(userId, loanId, amount, reason) {
    return this.createNotification({
      type: 'loan_rejected',
      message: `Your loan application for UGX${amount} has been rejected. Reason: ${reason}`,
      user: userId,
      relatedTo: loanId,
      onModel: 'Loan',
      priority: 'medium'
    });
  }

  static async notifyLoanPaymentReminder(userId, loanId, amount, dueDate) {
    return this.createNotification({
      type: 'loan_payment_reminder',
      message: `Reminder: Your loan payment of UGX${amount} is due on ${dueDate}`,
      user: userId,
      relatedTo: loanId,
      onModel: 'Loan',
      priority: 'high',
      actionRequired: true
    });
  }

  static async notifyLoanPaymentOverdue(userId, loanId, amount) {
    return this.createNotification({
      type: 'loan_payment_overdue',
      message: `URGENT: Your loan payment of UGX${amount} is overdue. Please make the payment immediately`,
      user: userId,
      relatedTo: loanId,
      onModel: 'Loan',
      priority: 'urgent',
      actionRequired: true
    });
  }

  // Savings Notifications
  static async notifySavingsDeposit(userId, savingsId, amount) {
    return this.createNotification({
      type: 'savings_deposit',
      message: `Your deposit of UGX${amount} has been processed successfully`,
      user: userId,
      relatedTo: savingsId,
      onModel: 'Savings',
      priority: 'medium'
    });
  }

  static async notifySavingsWithdrawal(userId, savingsId, amount) {
    return this.createNotification({
      type: 'savings_withdrawal',
      message: `Your withdrawal of UGX${amount} has been processed successfully`,
      user: userId,
      relatedTo: savingsId,
      onModel: 'Savings',
      priority: 'medium'
    });
  }

  // Withdrawal Request Notifications
  static async notifyWithdrawalRequest(userId, transactionId, amount) {
    // Notify all admin users about the withdrawal request
    const adminUsers = await User.find({ role: 'admin' });
    const user = await User.findById(userId);

    const notifications = adminUsers.map(admin =>
      this.createNotification({
        type: 'withdrawal_request',
        message: `${user.firstName} ${user.lastName} has requested a withdrawal of UGX${amount}`,
        user: admin._id,
        relatedTo: transactionId,
        onModel: 'Transaction',
        priority: 'high'
      })
    );

    return Promise.all(notifications);
  }

  static async notifyWithdrawalApproved(userId, transactionId, amount) {
    return this.createNotification({
      type: 'withdrawal_approved',
      message: `Your withdrawal request of UGX${amount} has been approved and processed`,
      user: userId,
      relatedTo: transactionId,
      onModel: 'Transaction',
      priority: 'medium'
    });
  }

  static async notifyWithdrawalRejected(userId, transactionId, amount, reason) {
    return this.createNotification({
      type: 'withdrawal_rejected',
      message: `Your withdrawal request of UGX${amount} has been rejected. Reason: ${reason}`,
      user: userId,
      relatedTo: transactionId,
      onModel: 'Transaction',
      priority: 'medium'
    });
  }

  static async notifySavingsMilestone(userId, savingsId, amount) {
    return this.createNotification({
      type: 'savings_milestone',
      message: `Congratulations! You've reached a savings milestone of UGX${amount}`,
      user: userId,
      relatedTo: savingsId,
      onModel: 'Savings',
      priority: 'high'
    });
  }

  // Account Notifications
  static async notifyAccountActivation(userId) {
    return this.createNotification({
      type: 'account_activated',
      message: 'Your account has been activated successfully',
      user: userId,
      onModel: 'User',
      priority: 'high'
    });
  }

  static async notifyAccountStatusChange(userId, status) {
    return this.createNotification({
      type: 'account_status_change',
      message: `Your account status has been updated to ${status}`,
      user: userId,
      onModel: 'User',
      priority: 'high'
    });
  }

  static async notifyProfileUpdate(userId) {
    return this.createNotification({
      type: 'profile_updated',
      message: 'Your profile has been updated successfully',
      user: userId,
      onModel: 'User',
      priority: 'low'
    });
  }

  // System Notifications
  static async notifySystemUpdate(userId, announcement) {
    return this.createNotification({
      type: 'system_update',
      message: `System Update: ${announcement}`,
      user: userId,
      priority: 'medium'
    });
  }

  static async notifyMaintenance(userId, details) {
    return this.createNotification({
      type: 'maintenance_notice',
      message: `Scheduled Maintenance: ${details}`,
      user: userId,
      priority: 'high'
    });
  }

  // Security Notifications
  static async notifyPasswordChange(userId) {
    return this.createNotification({
      type: 'password_changed',
      message: 'Your password has been changed successfully',
      user: userId,
      onModel: 'User',
      priority: 'high'
    });
  }

  static async notifyNewLogin(userId, deviceInfo) {
    return this.createNotification({
      type: 'new_login',
      message: `New login detected from ${deviceInfo}`,
      user: userId,
      onModel: 'User',
      priority: 'high'
    });
  }

  // Admin Notifications
  static async notifyNewMember(adminId, memberName) {
    return this.createNotification({
      type: 'new_member',
      message: `New member registration: ${memberName}`,
      user: adminId,
      priority: 'medium'
    });
  }

  static async notifyLoanReviewRequired(adminId, amount) {
    return this.createNotification({
      type: 'loan_review_required',
      message: `New loan application requires review: UGX${amount}`,
      user: adminId,
      priority: 'high',
      actionRequired: true
    });
  }

  static async notifyPaymentAlert(adminId, memberName, amount) {
    return this.createNotification({
      type: 'payment_alert',
      message: `Payment alert: ${memberName} has made a payment of UGX${amount}`,
      user: adminId,
      priority: 'medium'
    });
  }

  // Member Management Notifications
  static async notifyMemberDeactivation(adminId, memberName) {
    return this.createNotification({
      type: 'member_deactivation',
      message: `Member ${memberName} has deactivated their account`,
      user: adminId,
      category: 'member_management',
      priority: 'high'
    });
  }

  // Loan Management Notifications
  static async notifyLoanApprovalRequired(adminId, loanId) {
    return this.createNotification({
      type: 'loan_approval_required',
      message: `Loan application #${loanId} requires your approval`,
      user: adminId,
      category: 'loan_management',
      priority: 'high',
      actionRequired: true
    });
  }

  static async notifyLoanPaymentOverdue(adminId, memberName, amount) {
    return this.createNotification({
      type: 'loan_payment_overdue',
      message: `URGENT: Loan payment overdue for ${memberName} - UGX${amount}`,
      user: adminId,
      category: 'loan_management',
      priority: 'urgent',
      actionRequired: true
    });
  }

  static async notifyLargeLoanRequest(adminId, memberName, amount) {
    return this.createNotification({
      type: 'large_loan_request',
      message: `High-value loan request: UGX${amount} from ${memberName}`,
      user: adminId,
      category: 'loan_management',
      priority: 'high',
      actionRequired: true
    });
  }

  // Financial Notifications
  static async notifyDailyFinancialSummary(adminId, totalDeposits, totalWithdrawals) {
    return this.createNotification({
      type: 'daily_financial_summary',
      message: `Daily Summary: UGX${totalDeposits} in deposits, UGX${totalWithdrawals} in withdrawals`,
      user: adminId,
      category: 'financial',
      priority: 'low'
    });
  }

  // System Notifications
  static async notifySystemError(adminId, errorDescription) {
    return this.createNotification({
      type: 'system_error',
      message: `System Error: ${errorDescription}`,
      user: adminId,
      category: 'system',
      priority: 'urgent',
      actionRequired: true
    });
  }

  static async notifyDatabaseBackup(adminId, status) {
    return this.createNotification({
      type: 'database_backup',
      message: `Database backup ${status}`,
      user: adminId,
      category: 'system',
      priority: 'medium'
    });
  }

  static async notifySystemMaintenance(adminId, hours) {
    return this.createNotification({
      type: 'system_maintenance',
      message: `Scheduled maintenance in ${hours} hours`,
      user: adminId,
      category: 'system',
      priority: 'high'
    });
  }

  // Compliance Notifications
  static async notifyKycDocumentUpdate(adminId, memberName) {
    return this.createNotification({
      type: 'kyc_document_update',
      message: `New KYC documents uploaded by ${memberName}`,
      user: adminId,
      category: 'compliance',
      priority: 'high',
      actionRequired: true
    });
  }

  static async notifyComplianceDeadline(adminId, days) {
    return this.createNotification({
      type: 'compliance_deadline',
      message: `Compliance report due in ${days} days`,
      user: adminId,
      category: 'compliance',
      priority: 'high',
      actionRequired: true
    });
  }

  // Emergency Notifications
  static async notifyCriticalSystemIssue(adminId, description) {
    return this.createNotification({
      type: 'critical_system_issue',
      message: `CRITICAL: ${description}`,
      user: adminId,
      category: 'emergency',
      priority: 'urgent',
      actionRequired: true
    });
  }

  static async notifySecurityBreach(adminId, details) {
    return this.createNotification({
      type: 'security_breach',
      message: `SECURITY ALERT: ${details}`,
      user: adminId,
      category: 'emergency',
      priority: 'urgent',
      actionRequired: true
    });
  }

  // Staff Management Notifications
  static async notifyStaffLogin(adminId, staffName, location) {
    return this.createNotification({
      type: 'staff_login',
      message: `Admin ${staffName} logged in from ${location}`,
      user: adminId,
      category: 'staff_management',
      priority: 'low'
    });
  }

  static async notifyStaffAction(adminId, staffName, action) {
    return this.createNotification({
      type: 'staff_action',
      message: `Admin ${staffName} ${action}`,
      user: adminId,
      category: 'staff_management',
      priority: 'medium'
    });
  }

  static async notifyStaffPerformanceAlert(adminId, staffName, tasks) {
    return this.createNotification({
      type: 'staff_performance_alert',
      message: `Performance alert: ${staffName} has ${tasks} pending tasks`,
      user: adminId,
      category: 'staff_management',
      priority: 'medium'
    });
  }

  // Admin Reminder Notifications
  static async notifyAdminReminder(userId, message, adminName) {
    return this.createNotification({
      type: 'admin_reminder',
      message: `Reminder from ${adminName}: ${message}`,
      user: userId,
      category: 'general',
      priority: 'high'
    });
  }

  static async notifyGuarantorChosen(guarantorId, applicantName, loanId) {
    return this.createNotification({
      type: 'guarantor_chosen',
      message: `${applicantName} has selected you as a guarantor for their loan application`,
      user: guarantorId,
      relatedTo: loanId,
      onModel: 'Loan',
      priority: 'high'
    });
  }
}

module.exports = NotificationService; 