const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'new_member',
      'member_status',
      'new_loan',
      'loan_status',
      'large_deposit',
      'large_withdrawal',
      'unusual_activity',
      'system',
      'transaction',
      'general',
      'savings_deposit',
      'savings_withdrawal',
      'profile_updated',
      'withdrawal_request',
      'withdrawal_approved',
      'withdrawal_rejected',
      'loan_application',
      'loan_approval',
      'loan_rejection',
      'loan_payment_reminder',
      'loan_payment_overdue',
      'loan_payment_made',
      'loan_payment_successful',
      'savings_milestone',
      'account_activated',
      'account_status_change',
      'system_update',
      'maintenance_notice',
      'password_changed',
      'new_login',
      'loan_review_required',
      'payment_alert',
      'member_deactivation',
      'loan_approval_required',
      'large_loan_request',
      'daily_financial_summary',
      'system_error',
      'database_backup',
      'system_maintenance',
      'kyc_document_update',
      'compliance_deadline',
      'critical_system_issue',
      'security_breach',
      'staff_login',
      'staff_action',
      'staff_performance_alert',
      'admin_reminder',
      'guarantor_chosen'
    ]
  },
  message: {
    type: String,
    required: [true, 'Notification message is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  relatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    enum: ['User', 'Loan', 'Transaction', 'Savings']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['member', 'loan', 'transaction', 'system', 'general', 'savings', 'withdrawal'],
    default: 'general'
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ priority: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 