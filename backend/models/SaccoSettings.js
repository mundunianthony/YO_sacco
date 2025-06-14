const mongoose = require('mongoose');

const SaccoSettingsSchema = new mongoose.Schema({
    saccoName: {
        type: String,
        required: true
    },
    registrationNumber: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    interestRates: {
        personal: {
            type: Map,
            of: Number
        },
        emergency: {
            type: Map,
            of: Number
        },
        business: {
            type: Map,
            of: Number
        },
        education: {
            type: Map,
            of: Number
        },
        housing: {
            type: Map,
            of: Number
        }
    },
    minimumSavings: {
        type: Number,
        required: true
    },
    maximumLoanAmount: {
        type: Number,
        required: true
    },
    penaltyRate: {
        type: Number,
        required: true
    },
    gracePeriod: {
        type: Number,
        required: true
    },
    operatingHours: {
        open: {
            type: String,
            required: true
        },
        close: {
            type: String,
            required: true
        },
        workingDays: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SaccoSettings', SaccoSettingsSchema); 