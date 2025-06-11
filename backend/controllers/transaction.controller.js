const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

// @desc    Create a transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { type, amount, description, loan } = req.body;

    const transaction = await Transaction.create({
      user: req.user.id,
      type,
      amount,
      description,
      loan,
      reference: `TRX-${Date.now()}`
    });

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all transactions for a user
// @route   GET /api/transactions/my-transactions
// @access  Private
exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all transactions (admin only)
// @route   GET /api/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'name email')
      .populate('loan', 'amount purpose')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Update transaction status
// @route   PUT /api/transactions/:id
// @access  Private/Admin
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    transaction.status = status;
    await transaction.save();

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}; 