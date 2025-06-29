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
      await NotificationService.notifySavingsDeposit(user._id, transaction._id, amount);
      console.log('Notification created successfully for deposit');
    } catch (notificationError) {
      console.error('Error creating deposit notification:', notificationError);
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
    console.log('=== WITHDRAWAL REQUEST START ===');
    console.log('Processing withdrawal request:', { amount, paymentMethod, userId: req.user.id });

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('User found:', {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      currentBalance: user.savingsBalance
    });

    // Check if user has sufficient balance
    if ((user.savingsBalance || 0) < amount) {
      console.log('Insufficient balance check failed');
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }

    console.log('Balance check passed. Creating pending transaction...');

    // Create withdrawal request transaction (pending status)
    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'withdrawal',
      amount,
      paymentMethod,
      status: 'pending', // Changed from 'completed' to 'pending'
      balanceAfter: user.savingsBalance, // Keep current balance until approved
      category: 'savings',
      description: 'Withdrawal request - pending approval'
    });
    console.log('Withdrawal request created:', {
      transactionId: transaction._id,
      status: transaction.status,
      balanceAfter: transaction.balanceAfter
    });

    // IMPORTANT: DO NOT UPDATE USER BALANCE HERE
    console.log('User balance remains unchanged:', user.savingsBalance);

    // Create withdrawal request notification for admins
    console.log('Creating withdrawal request notification for admins...');
    try {
      await NotificationService.notifyWithdrawalRequest(user._id, transaction._id, amount);
      console.log('Admin notification created successfully for withdrawal request');
    } catch (notificationError) {
      console.error('Error creating admin notification:', notificationError);
      // Continue with the response even if notification fails
    }

    console.log('=== WITHDRAWAL REQUEST END ===');
    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully. Please wait for admin approval.',
      data: {
        transaction,
        currentBalance: user.savingsBalance
      }
    });
  } catch (err) {
    console.error('Error making withdrawal request:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Approve or reject withdrawal request
// @route   PUT /api/savings/withdrawals/:id/approve
// @access  Private/Admin
exports.approveWithdrawal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }

  try {
    const { status, rejectionReason } = req.body;
    const { id } = req.params;

    console.log('=== WITHDRAWAL APPROVAL START ===');
    console.log('Processing withdrawal approval:', { id, status, rejectionReason });

    const transaction = await Transaction.findById(id).populate('user', 'firstName lastName email savingsBalance');

    if (!transaction) {
      console.log('Transaction not found');
      return res.status(404).json({
        success: false,
        error: 'Withdrawal request not found'
      });
    }

    console.log('Transaction found:', {
      id: transaction._id,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      user: transaction.user
    });

    if (transaction.type !== 'withdrawal') {
      console.log('Not a withdrawal transaction');
      return res.status(400).json({
        success: false,
        error: 'This is not a withdrawal transaction'
      });
    }

    if (transaction.status !== 'pending') {
      console.log('Transaction already processed');
      return res.status(400).json({
        success: false,
        error: 'This withdrawal request has already been processed'
      });
    }

    const user = await User.findById(transaction.user._id);

    if (!user) {
      console.log('User not found');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('User found:', {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      currentBalance: user.savingsBalance
    });

    if (status === 'approved') {
      console.log('Approving withdrawal...');

      // Check if user still has sufficient balance
      if ((user.savingsBalance || 0) < transaction.amount) {
        console.log('User no longer has sufficient balance');
        return res.status(400).json({
          success: false,
          error: 'User no longer has sufficient balance for this withdrawal'
        });
      }

      console.log('Balance check passed. Updating transaction and user balance...');

      // Update transaction status
      transaction.status = 'completed';
      transaction.balanceAfter = user.savingsBalance - transaction.amount;
      transaction.description = 'Withdrawal approved and processed';
      transaction.processedBy = req.user.id;
      await transaction.save();

      console.log('Transaction updated:', {
        newStatus: transaction.status,
        newBalanceAfter: transaction.balanceAfter
      });

      // Update user's savings balance
      const oldBalance = user.savingsBalance;
      user.savingsBalance = user.savingsBalance - transaction.amount;
      await user.save();

      console.log('User balance updated:', {
        oldBalance,
        newBalance: user.savingsBalance,
        amountDeducted: transaction.amount
      });

      // Create approval notification for user
      try {
        await NotificationService.notifyWithdrawalApproved(user._id, transaction._id, transaction.amount);
        console.log('Approval notification sent to user');
      } catch (notificationError) {
        console.error('Error creating approval notification:', notificationError);
      }

      console.log('=== WITHDRAWAL APPROVAL END ===');
      res.status(200).json({
        success: true,
        message: 'Withdrawal request approved successfully',
        data: {
          transaction,
          newBalance: user.savingsBalance
        }
      });
    } else if (status === 'rejected') {
      console.log('Rejecting withdrawal...');

      // Update transaction status
      transaction.status = 'cancelled';
      transaction.description = `Withdrawal rejected: ${rejectionReason}`;
      transaction.processedBy = req.user.id;
      transaction.notes = rejectionReason;
      await transaction.save();

      console.log('Transaction marked as cancelled');

      // Create rejection notification for user
      try {
        await NotificationService.notifyWithdrawalRejected(user._id, transaction._id, transaction.amount, rejectionReason);
        console.log('Rejection notification sent to user');
      } catch (notificationError) {
        console.error('Error creating rejection notification:', notificationError);
      }

      console.log('=== WITHDRAWAL REJECTION END ===');
      res.status(200).json({
        success: true,
        message: 'Withdrawal request rejected successfully',
        data: {
          transaction,
          currentBalance: user.savingsBalance
        }
      });
    } else {
      console.log('Invalid status provided');
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be either "approved" or "rejected"'
      });
    }
  } catch (err) {
    console.error('Error processing withdrawal approval:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
}; 