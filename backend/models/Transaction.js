const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'loan_payment', 'loan_disbursement', 'interest_earned', 'fee'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add transaction amount'],
    min: [0, 'Amount cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Please add transaction description'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  reference: {
    type: String
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },
  category: {
    type: String,
    enum: ['savings', 'loan', 'fee', 'interest'],
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'mobile_money', 'airtel_money', 'card', 'cheque', 'savings_deduction'],
    required: true
  },
  receiptNumber: {
    type: String
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
TransactionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Generate receipt number before saving
TransactionSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.reference = `TXN${String(count + 1).padStart(8, '0')}`;

    // Only generate receiptNumber if not already set
    if (!this.receiptNumber) {
      this.receiptNumber = `RCPT${String(count + 1).padStart(8, '0')}`;
    }
  }
  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema); 