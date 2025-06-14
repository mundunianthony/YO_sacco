const mongoose = require('mongoose');

const LoanRepaymentSchema = new mongoose.Schema({
  amountPaid: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'mobile_money', 'check'],
    required: true
  },
  remainingBalance: {
    type: Number,
    required: true
  },
  penaltyAmount: Number,
  receiptNumber: {
    type: String,
    required: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const LoanSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  loanType: {
    type: String,
    enum: ['personal', 'emergency', 'business', 'education', 'housing'],
    required: true
  },
  amountRequested: {
    type: Number,
    required: true
  },
  amountApproved: Number,
  repaymentPeriod: {
    type: Number,
    required: true
  },
  interestRate: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted'],
    default: 'pending'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: Date,
  rejectionReason: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  totalRepayable: Number,
  monthlyRepayment: Number,
  repaymentHistory: [LoanRepaymentSchema],
  remainingBalance: {
    type: Number,
    default: 0
  },
  nextPaymentDate: Date,
  collateral: String,
  purpose: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Loan', LoanSchema); 