const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  balance: { type: Number, required: true },
  // Add other fields as needed
}, {
  timestamps: true
});

module.exports = mongoose.model('Savings', savingsSchema); 