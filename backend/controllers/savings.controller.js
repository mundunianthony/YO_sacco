const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');
const NotificationService = require('../services/notificationService');
const flw = require('../services/flutterwaveService');

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
    const { amount, paymentMethod, phone_number, email } = req.body;
    console.log('Processing deposit request:', { amount, paymentMethod, userId: req.user.id });

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Use user's email if not provided
    const userEmail = email || user.email;

    // Initiate Flutterwave MTN Mobile Money payment
    if (paymentMethod === 'mtn_mobile_money') {
      const tx_ref = `DEP-${Date.now()}-${user._id}`;
      const payload = {
        phone_number,
        network: 'MTN',
        amount,
        currency: 'UGX',
        email: userEmail,
        tx_ref,
        redirect_url: 'https://example.com/payment-callback',
      };
      try {
        const response = await flw.MobileMoney.uganda(payload);
        console.log('Flutterwave response:', response);
        if (response.status === 'success' && response.meta && response.meta.authorization && response.meta.authorization.mode === 'otp') {
          // OTP required, send flw_ref to frontend
          return res.status(200).json({
            success: true,
            otp_required: true,
            flw_ref: response.data.flw_ref,
            message: 'OTP required. Please enter the OTP sent to your phone.'
          });
        } else if (response.status === 'success') {
          // Payment successful without OTP, proceed to credit account
          const newBalance = (user.savingsBalance || 0) + amount;
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
          user.savingsBalance = newBalance;
          await user.save();
          await NotificationService.notifySavingsDeposit(user._id, transaction._id, amount);
          return res.status(200).json({
            success: true,
            otp_required: false,
            data: { transaction, newBalance: user.savingsBalance }
          });
        } else {
          return res.status(400).json({ success: false, error: response.message || 'Payment initiation failed' });
        }
      } catch (err) {
        console.error('Flutterwave payment error:', err);
        return res.status(500).json({ success: false, error: err.message || JSON.stringify(err) || 'Flutterwave payment error' });
      }
    }
    // ... fallback for other payment methods ...
    // (existing deposit logic for non-MTN payments)
    const newBalance = (user.savingsBalance || 0) + amount;
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
    user.savingsBalance = newBalance;
    await user.save();
    await NotificationService.notifySavingsDeposit(user._id, transaction._id, amount);
    res.status(200).json({
      success: true,
      data: { transaction, newBalance: user.savingsBalance }
    });
  } catch (err) {
    console.error('Error making deposit:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

// New controller for OTP validation
exports.validateDepositOtp = async (req, res) => {
  try {
    const { flw_ref, otp, amount, paymentMethod, phone_number, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    // Use user's email if not provided
    const userEmail = email || user.email;
    // Validate OTP with Flutterwave
    const response = await flw.Misc.verifyOtp({
      flw_ref,
      otp,
      type: 'mobilemoneyuganda'
    });
    if (response.status === 'success') {
      // OTP validated, credit user's account
      const newBalance = (user.savingsBalance || 0) + amount;
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
      user.savingsBalance = newBalance;
      await user.save();
      await NotificationService.notifySavingsDeposit(user._id, transaction._id, amount);
      return res.status(200).json({
        success: true,
        data: { transaction, newBalance: user.savingsBalance }
      });
    } else {
      return res.status(400).json({ success: false, error: response.message || 'OTP validation failed' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'OTP validation error' });
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
      status: 'completed',
      balanceAfter: user.savingsBalance - amount,
      category: 'savings',
      description: 'Savings withdrawal'
    });
    console.log('Transaction created:', transaction._id);

    // Update user's savings balance
    user.savingsBalance = user.savingsBalance - amount;
    await user.save();
    console.log('User balance updated:', user.savingsBalance);

    // Create withdrawal notification
    console.log('Creating withdrawal notification...');
    try {
      await NotificationService.notifySavingsWithdrawal(user._id, transaction._id, amount);
      console.log('Notification created successfully for withdrawal');
    } catch (notificationError) {
      console.error('Error creating withdrawal notification:', notificationError);
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