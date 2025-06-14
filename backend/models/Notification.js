const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [
            'loan_application',
            'loan_approved',
            'loan_rejected',
            'payment_reminder',
            'payment_overdue',
            'account_status',
            'system_announcement',
            'savings_milestone'
        ],
        required: true
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'recipientType',
        required: true
    },
    recipientType: {
        type: String,
        enum: ['member', 'admin'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    readStatus: {
        type: Boolean,
        default: false
    },
    actionRequired: {
        type: Boolean,
        default: false
    },
    relatedEntityId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedEntityType'
    },
    relatedEntityType: {
        type: String,
        enum: ['loan', 'transaction', 'member']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema); 