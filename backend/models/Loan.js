const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add loan amount'],
    min: [1000, 'Minimum loan amount is 1000']
  },
  purpose: {
    type: String,
    required: [true, 'Please add loan purpose'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  interestRate: {
    type: Number,
    required: true,
    default: 10 // 10% interest rate
  },
  term: {
    type: Number,
    required: [true, 'Please add loan term in months'],
    min: [1, 'Minimum term is 1 month'],
    max: [36, 'Maximum term is 36 months']
  },
  monthlyPayment: {
    type: Number,
    required: true
  },
  totalPayment: {
    type: Number,
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Loan', LoanSchema); 