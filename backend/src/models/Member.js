const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  occupation: {
    type: String,
    required: true
  },
  monthlyIncome: {
    type: Number,
    required: true
  },
  membershipDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  shares: {
    type: Number,
    default: 0
  },
  savingsBalance: {
    type: Number,
    default: 0
  },
  loanBalance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes for frequently queried fields
memberSchema.index({ memberId: 1 });
memberSchema.index({ email: 1 });
memberSchema.index({ phoneNumber: 1 });

const Member = mongoose.model('Member', memberSchema);

module.exports = Member; 