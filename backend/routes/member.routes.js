const express = require('express');
const { authenticate } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const savingsController = require('../controllers/savings.controller');
const NotificationService = require('../services/notificationService');
const { getAllMembers } = require('../controllers/user.controller');

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
      type: { $in: ['deposit', 'withdrawal', 'interest_earned'] },
      $or: [
        { type: { $ne: 'withdrawal' } },
        { type: 'withdrawal', status: 'completed' }
      ]
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

    // Notify each selected guarantor
    if (Array.isArray(guarantors)) {
      for (const guarantorId of guarantors) {
        await NotificationService.notifyGuarantorChosen(
          guarantorId,
          `${user.firstName} ${user.lastName}`,
          loan._id
        );
      }
    }

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
  console.log('=== LOAN PAYMENT ROUTE STARTED ===');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('User from auth:', req.user);

  try {
    const { amount } = req.body;

    console.log('Extracted amount:', amount);
    console.log('Amount type:', typeof amount);

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      console.log('Amount validation failed');
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid positive amount'
      });
    }

    // Ensure amount is an integer (no decimals)
    const paymentAmount = Math.floor(Number(amount));
    if (paymentAmount !== Number(amount)) {
      console.log('Integer validation failed');
      return res.status(400).json({
        success: false,
        error: 'Amount must be a whole number (no decimals)'
      });
    }

    // Additional validation for reasonable amount
    if (paymentAmount > 1000000000) { // 1 billion UGX limit
      console.log('Amount too high');
      return res.status(400).json({
        success: false,
        error: 'Payment amount is too high'
      });
    }

    console.log('Processing loan payment:', {
      loanId: req.params.id,
      userId: req.user.id,
      amount: paymentAmount
    });

    console.log('About to find loan...');
    const loan = await Loan.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    console.log('Loan query result:', loan ? 'Found' : 'Not found');

    if (!loan) {
      console.log('Loan not found');
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    console.log('Loan found:', {
      loanId: loan._id,
      status: loan.status,
      remainingBalance: loan.remainingBalance
    });

    if (loan.status !== 'active') {
      console.log('Loan not active');
      return res.status(400).json({
        success: false,
        error: 'Loan is not active'
      });
    }

    if (paymentAmount > loan.remainingBalance) {
      console.log('Payment amount exceeds remaining balance');
      return res.status(400).json({
        success: false,
        error: 'Payment amount exceeds remaining balance'
      });
    }

    console.log('About to find user...');
    const user = await User.findById(req.user.id);
    console.log('User query result:', user ? 'Found' : 'Not found');

    if (!user) {
      console.log('User not found');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('User found:', {
      userId: user._id,
      savingsBalance: user.savingsBalance,
      loanBalance: user.loanBalance
    });

    // Check if user has sufficient savings balance
    if ((user.savingsBalance || 0) < paymentAmount) {
      console.log('Insufficient savings balance');
      return res.status(400).json({
        success: false,
        error: 'Insufficient savings balance. Please add money to your savings account first.'
      });
    }

    const newLoanBalance = loan.remainingBalance - paymentAmount;
    const newSavingsBalance = user.savingsBalance - paymentAmount;
    const isFullPayment = newLoanBalance === 0;

    console.log('Calculated balances:', {
      newLoanBalance,
      newSavingsBalance,
      isFullPayment
    });

    console.log('About to create loan transaction...');
    // Create transaction for loan payment
    const loanTransaction = await Transaction.create({
      user: req.user.id,
      type: 'loan_payment',
      amount: paymentAmount,
      description: `Loan payment for loan #${loan.loanNumber || loan._id}`,
      status: 'completed',
      category: 'loan',
      paymentMethod: 'savings_deduction',
      balanceAfter: newLoanBalance,
      loan: loan._id
    });

    console.log('Loan transaction created:', loanTransaction._id);

    console.log('About to create savings transaction...');
    // Create transaction for savings deduction
    const savingsTransaction = await Transaction.create({
      user: req.user.id,
      type: 'withdrawal',
      amount: paymentAmount,
      description: `Deduction for loan payment - loan #${loan.loanNumber || loan._id}`,
      status: 'completed',
      category: 'savings',
      paymentMethod: 'savings_deduction',
      balanceAfter: newSavingsBalance
    });

    console.log('Savings transaction created:', savingsTransaction._id);

    console.log('About to update loan...');
    // Update loan with new payment tracking fields
    loan.remainingBalance = newLoanBalance;
    loan.lastPaymentDate = new Date();

    // Ensure paymentHistory is an array
    if (!loan.paymentHistory) {
      loan.paymentHistory = [];
    }

    // Add payment to history with enhanced tracking
    loan.paymentHistory.push({
      amount: paymentAmount,
      date: new Date(),
      receiptNumber: loanTransaction.receiptNumber,
      transaction: loanTransaction._id,
      paymentType: isFullPayment ? 'full' : 'partial',
      remainingBalanceAfterPayment: newLoanBalance
    });

    // Explicitly calculate progress and total paid amount
    const totalPaid = loan.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    loan.totalPaidAmount = totalPaid;
    loan.remainingBalance = Math.max(0, loan.totalPayment - totalPaid);
    loan.paymentProgress = loan.totalPayment > 0 ? totalPaid / loan.totalPayment : 0;

    // Update loan status and next payment date
    if (isFullPayment) {
      loan.status = 'paid';
      loan.nextPaymentDate = null;
      loan.paymentProgress = 1; // Force 100% for fully paid loans
    } else {
      loan.nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    await loan.save();
    console.log('Loan updated successfully');
    console.log('Returning loan:', {
      totalPaidAmount: loan.totalPaidAmount,
      paymentProgress: loan.paymentProgress,
      paymentHistory: loan.paymentHistory.length
    });

    console.log('About to update user balances...');
    // Update user balances
    user.savingsBalance = newSavingsBalance;
    user.loanBalance = Math.max(0, user.loanBalance - paymentAmount);
    await user.save();
    console.log('User balances updated');

    console.log('About to send admin notifications...');
    // Notify admins about the loan payment
    try {
      const paymentTypeText = isFullPayment ? 'full payment' : 'partial payment';
      await NotificationService.notifyAllAdmins({
        type: 'loan_payment_made',
        message: `${user.firstName} ${user.lastName} made a ${paymentTypeText} of UGX${paymentAmount.toLocaleString()} for loan #${loan.loanNumber || loan._id}. ${isFullPayment ? 'Loan is now fully paid!' : `Remaining balance: UGX${newLoanBalance.toLocaleString()}`}`,
        relatedTo: loan._id,
        onModel: 'Loan',
        priority: 'medium',
        category: 'loan'
      });
      console.log('Admin notifications sent');
    } catch (notificationError) {
      console.error('Error creating admin notification:', notificationError);
      // Continue with the response even if notification fails
    }

    console.log('About to send user notification...');
    // Notify user about successful payment
    try {
      await NotificationService.notifyLoanPaymentSuccessful(
        req.user.id,
        paymentAmount,
        newLoanBalance,
        loan._id
      );
      console.log('User notification sent');
    } catch (notificationError) {
      console.error('Error creating user notification:', notificationError);
    }

    console.log('Payment processed successfully');

    res.status(200).json({
      success: true,
      data: {
        loanTransaction,
        savingsTransaction,
        loan,
        newSavingsBalance: user.savingsBalance,
        newLoanBalance: loan.remainingBalance,
        isFullPayment,
        paymentType: isFullPayment ? 'full' : 'partial'
      }
    });
  } catch (error) {
    console.error('=== LOAN PAYMENT ERROR ===');
    console.error('Error processing loan payment:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Check for specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: ' + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }

    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate entry error. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
});

// @desc    Get all members
// @route   GET /api/members/all
// @access  Private
router.get('/all', authenticate, getAllMembers);

// @desc    Get member interest summary
// @route   GET /api/members/interest/summary
// @access  Private
router.get('/interest/summary', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to current year if no dates provided
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), 11, 31);

    const InterestService = require('../services/interestService');
    const summary = await InterestService.getUserInterestSummary(req.user.id, start, end);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching interest summary:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get member interest history
// @route   GET /api/members/interest/history
// @access  Private
router.get('/interest/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const query = {
      user: req.user.id,
      type: 'interest_earned'
    };

    // Add date filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching interest history:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get member interest projection
// @route   GET /api/members/interest/projection
// @access  Private
router.get('/interest/projection', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const InterestService = require('../services/interestService');
    const currentBalance = user.savingsBalance || 0;
    const interestRate = InterestService.DEFAULT_INTEREST_RATE;

    // Calculate projections for different time periods
    const now = new Date();
    const projections = {
      monthly: InterestService.calculateInterest(user, now, new Date(now.getFullYear(), now.getMonth() + 1, 0), interestRate),
      quarterly: InterestService.calculateInterest(user, now, new Date(now.getFullYear(), now.getMonth() + 3, 0), interestRate),
      yearly: InterestService.calculateInterest(user, now, new Date(now.getFullYear() + 1, now.getMonth(), 0), interestRate)
    };

    res.status(200).json({
      success: true,
      data: {
        currentBalance,
        interestRate,
        projections
      }
    });
  } catch (error) {
    console.error('Error calculating interest projection:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router; 