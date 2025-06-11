const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  interestRate: {
    type: Number,
    required: true
  },
  term: {
    type: Number,  // in months
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted'],
    default: 'pending'
  },
  monthlyPayment: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  remainingBalance: {
    type: Number,
    default: 0
  },
  guarantors: [{
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  documents: [{
    type: String,
    url: String,
    uploadedAt: Date
  }]
}, {
  timestamps: true
});

// Create indexes for frequently queried fields
loanSchema.index({ memberId: 1 });
loanSchema.index({ loanId: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ createdAt: -1 });

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan; 