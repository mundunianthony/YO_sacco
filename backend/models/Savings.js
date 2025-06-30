const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  balance: { type: Number, required: true },
  // Add other fields as needed
}, {
  timestamps: true
});

// Total Savings Pool Schema
const totalSavingsPoolSchema = new mongoose.Schema({
  totalAmount: {
    type: Number,
    default: 0,
    required: true
  },
  availableAmount: {
    type: Number,
    default: 0,
    required: true
  },
  loanedAmount: {
    type: Number,
    default: 0,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one total savings pool document exists
totalSavingsPoolSchema.statics.getPool = async function () {
  let pool = await this.findOne();
  if (!pool) {
    pool = await this.create({
      totalAmount: 0,
      availableAmount: 0,
      loanedAmount: 0
    });
  }
  return pool;
};

module.exports = {
  Savings: mongoose.model('Savings', savingsSchema),
  TotalSavingsPool: mongoose.model('TotalSavingsPool', totalSavingsPoolSchema)
}; 