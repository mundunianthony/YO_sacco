const Transaction = require('../models/Transaction');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const { validationResult } = require('express-validator');

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }

  try {
    const { type, amount, description } = req.body;

    // Create transaction
    const transaction = await Transaction.create({
      user: req.user.id,
      type,
      amount,
      description,
      status: 'completed'
    });

    // Check for large transaction
    const LARGE_TRANSACTION_THRESHOLD = 10000; // $10,000
    if (amount >= LARGE_TRANSACTION_THRESHOLD) {
      // Find all admin users
      const adminUsers = await User.find({ role: 'admin' });

      // Notify all admin users about large transaction
      for (const admin of adminUsers) {
        if (type === 'deposit') {
          await NotificationService.notifyLargeDeposit(
            admin._id,
            `${req.user.firstName} ${req.user.lastName}`,
            amount
          );
        } else if (type === 'withdrawal') {
          await NotificationService.notifyLargeWithdrawal(
            admin._id,
            `${req.user.firstName} ${req.user.lastName}`,
            amount
          );
        }
      }
    }

    // Check for unusual transaction pattern
    const recentTransactions = await Transaction.find({
      user: req.user.id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (recentTransactions.length >= 5) {
      // Find all admin users
      const adminUsers = await User.find({ role: 'admin' });

      // Notify all admin users about unusual pattern
      for (const admin of adminUsers) {
        await NotificationService.notifyUnusualTransaction(
          admin._id,
          `${req.user.firstName} ${req.user.lastName}`
        );
      }
    }

    // Create notification for the user
    await NotificationService.createNotification({
      type: 'transaction_completed',
      message: `Your ${type} of $${amount} has been processed successfully`,
      user: req.user.id,
      relatedTo: transaction._id,
      onModel: 'Transaction',
      priority: 'medium'
    });

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
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

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
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