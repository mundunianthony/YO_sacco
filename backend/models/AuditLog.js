const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'userType',
        required: true
    },
    userType: {
        type: String,
        enum: ['admin', 'member'],
        required: true
    },
    action: {
        type: String,
        required: true
    },
    entityType: {
        type: String,
        enum: ['loan', 'member', 'transaction', 'settings', 'notification'],
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    changes: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

module.exports = mongoose.model('AuditLog', AuditLogSchema); 