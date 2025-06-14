const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');
const NotificationService = require('../services/notificationService');

// @desc    Make a deposit
// @route   POST /api/savings/deposit
// @access  Private
exports.makeDeposit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }

  try {
    const { amount, paymentMethod } = req.body;
    console.log('Processing deposit request:', { amount, paymentMethod, userId: req.user.id });

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate new balance
    const newBalance = (user.savingsBalance || 0) + amount;

    // Create transaction record
    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'deposit',
      amount,
      paymentMethod,
      status: 'completed',
      category: 'savings',
      description: 'Savings deposit',
      balanceAfter: newBalance
    });
    console.log('Transaction created:', transaction._id);

    // Update user's savings balance
    user.savingsBalance = newBalance;
    await user.save();
    console.log('User balance updated:', user.savingsBalance);

    // Create deposit notification
    console.log('Creating deposit notification...');
    try {
      const notification = await NotificationService.createNotification({
        type: 'savings_deposit',
        message: `Your deposit of $${amount} has been received and is pending approval. We will notify you once it's approved.`,
        user: req.user.id,
        relatedTo: transaction._id,
        onModel: 'Transaction',
        priority: 'medium'
      });
      console.log('Notification created successfully:', {
        id: notification._id,
        type: notification.type,
        message: notification.message,
        user: notification.user
      });
    } catch (notificationError) {
      console.error('Error creating deposit notification:', {
        message: notificationError.message,
        stack: notificationError.stack,
        code: notificationError.code,
        name: notificationError.name
      });
      // Continue with the response even if notification fails
    }

    res.status(200).json({
      success: true,
      data: {
        transaction,
        newBalance: user.savingsBalance
      }
    });
  } catch (err) {
    console.error('Error making deposit:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Make a withdrawal
// @route   POST /api/savings/withdraw
// @access  Private
exports.makeWithdrawal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }

  try {
    const { amount, paymentMethod } = req.body;
    console.log('Processing withdrawal request:', { amount, paymentMethod, userId: req.user.id });

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has sufficient balance
    if ((user.savingsBalance || 0) < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }

    // Create transaction record
    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'withdrawal',
      amount,
      paymentMethod,
      status: 'completed'
    });
    console.log('Transaction created:', transaction._id);

    // Update user's savings balance
    user.savingsBalance = user.savingsBalance - amount;
    await user.save();
    console.log('User balance updated:', user.savingsBalance);

    // Create withdrawal notification
    console.log('Creating withdrawal notification...');
    try {
      const notification = await NotificationService.createNotification({
        type: 'savings_withdrawal',
        message: `Your withdrawal request of $${amount} has been received and is pending approval. We will notify you once it's approved.`,
        user: req.user.id,
        relatedTo: transaction._id,
        onModel: 'Transaction',
        priority: 'medium'
      });
      console.log('Notification created successfully:', {
        id: notification._id,
        type: notification.type,
        message: notification.message,
        user: notification.user
      });
    } catch (notificationError) {
      console.error('Error creating withdrawal notification:', {
        message: notificationError.message,
        stack: notificationError.stack,
        code: notificationError.code,
        name: notificationError.name
      });
      // Continue with the response even if notification fails
    }

    res.status(200).json({
      success: true,
      data: {
        transaction,
        newBalance: user.savingsBalance
      }
    });
  } catch (err) {
    console.error('Error making withdrawal:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
}; 