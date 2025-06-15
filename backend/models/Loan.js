const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  receiptNumber: {
    type: String,
    required: true,
    default: function() {
      return `REC${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }
});

const LoanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loanNumber: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `LOAN${timestamp}${random}`;
    }
  },
  amount: {
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
    enum: ['pending', 'approved', 'rejected', 'active', 'paid', 'defaulted'],
    default: 'pending'
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
  remainingBalance: {
    type: Number,
    required: true
  },
  nextPaymentDate: {
    type: Date
  },
  lastPaymentDate: {
    type: Date
  },
  paymentHistory: [PaymentSchema],
  collateral: {
    type: String,
    trim: true
  },
  guarantors: [{
    name: String,
    phone: String,
    address: String,
    relationship: String
  }],
  documents: [{
    type: String,
    name: String,
    uploadedAt: Date
  }],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
LoanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate remaining balance before saving
LoanSchema.pre('save', function(next) {
  if (this.isModified('paymentHistory')) {
    const totalPaid = this.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    this.remainingBalance = this.totalPayment - totalPaid;
  }
  next();
});

module.exports = mongoose.model('Loan', LoanSchema); 