const express = require('express');
const { authenticate } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const savingsController = require('../controllers/savings.controller');
const NotificationService = require('../services/notificationService');

const router = express.Router();

// @desc    Get member profile
// @route   GET /api/members/profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
  res.status(200).json({
    success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Update member profile
// @route   PUT /api/members/profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email, phone, address, dob } = req.body;
    
    // Build update object
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (dob) updateFields.dob = dob;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    // Send notification for profile update
    await NotificationService.notifyProfileUpdate(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Change password
// @route   PUT /api/members/change-password
// @access  Private
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get member dashboard data
// @route   GET /api/members/dashboard
// @access  Private
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Get recent transactions
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get active loans
    const activeLoans = await Loan.find({
      user: req.user.id,
      status: 'active'
    });

    // Calculate total loan amount
    const totalLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.amount, 0);

    // Get interest earned this year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const interestEarned = await Transaction.find({
      user: req.user.id,
      type: 'interest_earned',
      createdAt: { $gte: startOfYear }
    }).then(transactions => 
      transactions.reduce((sum, t) => sum + t.amount, 0)
    );

    // Get next loan payment
    const nextPayment = activeLoans.length > 0 ? 
      activeLoans[0].monthlyPayment : 0;
    const nextPaymentDate = activeLoans.length > 0 ? 
      activeLoans[0].nextPaymentDate : null;

    res.status(200).json({
      success: true,
      data: {
        savingsBalance: user.savingsBalance,
        loanBalance: user.loanBalance,
        totalLoanAmount,
        interestEarned,
        nextPayment,
        nextPaymentDate,
        recentTransactions: transactions,
        activeLoans: activeLoans.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get member savings history
// @route   GET /api/members/savings
// @access  Private
router.get('/savings', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const transactions = await Transaction.find({
      user: req.user.id,
      type: { $in: ['deposit', 'withdrawal', 'interest_earned'] }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        currentBalance: user.savingsBalance,
        transactions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Make a deposit
// @route   POST /api/members/savings/deposit
// @access  Private
router.post('/savings/deposit', authenticate, savingsController.makeDeposit);

// @desc    Request withdrawal
// @route   POST /api/members/savings/withdraw
// @access  Private
router.post('/savings/withdraw', authenticate, savingsController.makeWithdrawal);

// @desc    Validate deposit OTP
// @route   POST /api/members/savings/deposit/validate-otp
// @access  Private
router.post('/savings/deposit/validate-otp', authenticate, savingsController.validateDepositOtp);

// @desc    Get member loans
// @route   GET /api/members/loans
// @access  Private
router.get('/loans', authenticate, async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user.id })
      .populate('user', 'firstName lastName email memberId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (err) {
    console.error('Error fetching loans:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
});

// @desc    Apply for a loan
// @route   POST /api/members/loans
// @access  Private
router.post('/loans', authenticate, [
  check('amount', 'Amount is required').isNumeric(),
  check('amount', 'Minimum loan amount is 1000').isFloat({ min: 1000 }),
  check('purpose', 'Purpose is required').not().isEmpty(),
  check('term', 'Term is required').isNumeric(),
  check('term', 'Term must be between 1 and 36 months').isInt({ min: 1, max: 36 }),
  check('collateral', 'Collateral is optional').optional(),
  check('guarantors', 'Guarantors must be an array').optional().isArray(),
  check('guarantors.*.name', 'Guarantor name is required').optional().not().isEmpty(),
  check('guarantors.*.phone', 'Guarantor phone is required').optional().not().isEmpty(),
  check('guarantors.*.address', 'Guarantor address is required').optional().not().isEmpty(),
  check('guarantors.*.relationship', 'Guarantor relationship is required').optional().not().isEmpty()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }

  try {
    const { amount, purpose, term, collateral, guarantors } = req.body;

    // Validate user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate loan details
    const interestRate = 10; // 10% interest rate
    const totalInterest = (amount * interestRate * term) / 100;
    const totalPayment = amount + totalInterest;
    const monthlyPayment = totalPayment / term;

    // Create loan with all required fields
    const loan = await Loan.create({
      user: req.user.id,
      amount,
      purpose,
      term,
      interestRate,
      monthlyPayment,
      totalPayment,
      remainingBalance: totalPayment,
      collateral: collateral || '',
      guarantors: guarantors || [],
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'pending'
    });

    // Populate user details in response
    await loan.populate('user', 'firstName lastName email memberId');

    res.status(201).json({
      success: true,
      data: loan
    });
  } catch (err) {
    console.error('Loan application error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
});

// @desc    Make a loan payment
// @route   POST /api/members/loans/:id/payment
// @access  Private
router.post('/loans/:id/payment', authenticate, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const loan = await Loan.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    if (loan.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Loan is not active'
      });
    }

    if (amount > loan.remainingBalance) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount exceeds remaining balance'
      });
    }

    const user = await User.findById(req.user.id);
    const newBalance = loan.remainingBalance - amount;

    // Create transaction
    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'loan_payment',
      amount,
      description: 'Loan payment',
      status: 'completed',
      category: 'loan',
      paymentMethod,
      balanceAfter: newBalance
    });

    // Update loan
    loan.remainingBalance = newBalance;
    if (newBalance === 0) {
      loan.status = 'paid';
    }
    loan.nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    await loan.save();

    // Update user loan balance
    user.loanBalance = Math.max(0, user.loanBalance - amount);
    await user.save();

  res.status(200).json({
    success: true,
      data: {
        transaction,
        loan
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router; 