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
      'savings_withdrawal'
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
    enum: ['member', 'loan', 'transaction', 'system', 'general'],
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