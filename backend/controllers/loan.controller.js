const Loan = require('../models/Loan');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { TotalSavingsPool } = require('../models/Savings');
const NotificationService = require('../services/notificationService');
const { validationResult } = require('express-validator');

// @desc    Apply for a loan
// @route   POST /api/loans
// @access  Private
exports.applyForLoan = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }

  try {
    const { amount, purpose, term, collateral, guarantors } = req.body;

    // Fetch user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if user already has an active loan
    const existingLoan = await Loan.findOne({
      user: req.user.id,
      status: { $in: ['pending', 'approved', 'active'] }
    });

    if (existingLoan) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active loan application or loan. Please clear your existing loan before applying for a new one.'
      });
    }

    // Rule 1: Minimum savings
    if ((user.savingsBalance || 0) < 1000000) {
      return res.status(400).json({ success: false, error: 'You must have at least UGX 1,000,000 in savings to qualify for a loan.' });
    }

    // Rule 2: Account age
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    if (user.createdAt > oneDayAgo) {
      return res.status(400).json({ success: false, error: 'You must be a member for at least one day to qualify for a loan.' });
    }

    // Rule 3: Max loan is 3x savings
    if (amount > 3 * (user.savingsBalance || 0)) {
      return res.status(400).json({ success: false, error: 'You can only borrow up to 3 times your savings balance.' });
    }

    // Rule 3: Loan privilege suspension
    if (user.loanPrivilegeSuspended && user.loanPrivilegeSuspendedUntil && user.loanPrivilegeSuspendedUntil > new Date()) {
      return res.status(403).json({ success: false, error: `You are temporarily suspended from applying for new loans until ${user.loanPrivilegeSuspendedUntil.toLocaleDateString()}.` });
    }

    // Create loan application
    const interestRate = 20; // 20% annual interest rate (for display)
    // Calculate total interest as 20% of principal amount
    const totalInterestRate = 0.20; // 20% total interest
    const totalInterest = amount * totalInterestRate;
    const totalPayment = amount + totalInterest;
    const monthlyPayment = totalPayment / term;

    const loan = await Loan.create({
      user: req.user.id,
      amount,
      purpose,
      term,
      interestRate,
      monthlyPayment,
      totalPayment,
      remainingBalance: totalPayment,
      status: 'pending',
      collateral: collateral || '',
      guarantors: guarantors || [],
      loanNumber: `LN${Date.now()}`
    });

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });

    // Notify all admin users about new loan application
    for (const admin of adminUsers) {
      await NotificationService.notifyNewLoanApplication(
        admin._id,
        `${req.user.firstName} ${req.user.lastName}`,
        amount
      );
    }

    // Create notification for the applicant
    await NotificationService.createNotification({
      type: 'loan_application',
      message: `Your loan application for UGX${amount.toLocaleString()} has been received and is pending approval.`,
      user: req.user.id,
      relatedTo: loan._id,
      onModel: 'Loan',
      priority: 'high'
    });

    res.status(201).json({
      success: true,
      data: loan
    });
  } catch (err) {
    console.error('Error applying for loan:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Get all loans for a user
// @route   GET /api/loans/my-loans
// @access  Private
exports.getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get all loans
// @route   GET /api/loans
// @access  Private/Admin
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate('user', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: loans
    });
  } catch (err) {
    console.error('Error fetching loans:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Update loan status
// @route   PUT /api/loans/:id/status
// @access  Private/Admin
exports.updateLoanStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }

  try {
    const { status, reason } = req.body;
    const loan = await Loan.findById(req.params.id).populate('user');

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    const oldStatus = loan.status;
    loan.status = status;
    if (reason) loan.rejectionReason = reason;

    if (status === 'approved') {
      loan.approvedBy = req.user.id;
      loan.approvedAt = Date.now();
    }

    // If loan is being activated, deduct from the total savings pool
    if (status === 'active' && oldStatus !== 'active') {
      const totalSavingsPool = await TotalSavingsPool.getPool();

      // Check if there's enough money in the savings pool
      if (totalSavingsPool.availableAmount < loan.amount) {
        return res.status(400).json({
          success: false,
          error: `Insufficient funds in savings pool. Available: UGX${totalSavingsPool.availableAmount.toLocaleString()}, Required: UGX${loan.amount.toLocaleString()}`
        });
      }

      // Deduct loan amount from available savings pool
      const oldAvailableAmount = totalSavingsPool.availableAmount;
      totalSavingsPool.availableAmount = Math.max(0, totalSavingsPool.availableAmount - loan.amount);
      totalSavingsPool.loanedAmount = totalSavingsPool.loanedAmount + loan.amount;
      totalSavingsPool.lastUpdated = new Date();
      await totalSavingsPool.save();

      // Create transaction record for the loan activation
      await Transaction.create({
        user: loan.user._id,
        type: 'loan_disbursement',
        amount: loan.amount,
        status: 'completed',
        category: 'loan',
        paymentMethod: 'bank_transfer',
        description: `Loan #${loan.loanNumber} activated - amount deducted from savings pool`,
        balanceAfter: totalSavingsPool.availableAmount,
        loan: loan._id,
        processedBy: req.user.id
      });

      console.log(`Loan activation: Total savings pool available amount reduced from ${oldAvailableAmount.toLocaleString()} to ${totalSavingsPool.availableAmount.toLocaleString()}`);
    }

    await loan.save();

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });

    // Notify all admin users about loan status change
    for (const admin of adminUsers) {
      await NotificationService.createNotification({
        type: 'loan_status_change',
        message: `Loan #${loan.loanNumber} status changed from ${oldStatus} to ${status}`,
        user: admin._id,
        relatedTo: loan._id,
        onModel: 'Loan',
        priority: 'high'
      });
    }

    // Create notification for the loan applicant
    let message = `Your loan application status has been updated to ${status}`;
    if (status === 'rejected' && reason) {
      message += `. Reason: ${reason}`;
    } else if (status === 'active') {
      message += `. Your loan of UGX${loan.amount.toLocaleString()} has been activated and disbursed.`;
    }

    await NotificationService.createNotification({
      type: 'loan_status_change',
      message,
      user: loan.user._id,
      relatedTo: loan._id,
      onModel: 'Loan',
      priority: 'high'
    });

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (err) {
    console.error('Error updating loan status:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Make loan payment
// @route   POST /api/loans/:id/payment
// @access  Private
exports.makeLoanPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }

  try {
    const { amount, paymentMethod } = req.body;
    const loan = await Loan.findById(req.params.id).populate('user');

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    // Verify loan belongs to the user
    if (loan.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to make payments on this loan'
      });
    }

    // Check if loan is active
    if (loan.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Can only make payments on active loans'
      });
    }

    // Validate payment amount
    if (amount > loan.remainingBalance) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount cannot exceed remaining balance'
      });
    }

    // Create payment record
    const payment = {
      amount,
      date: Date.now(),
      paymentMethod,
      receiptNumber: `RCP${Date.now()}`
    };

    // Add payment to history
    loan.paymentHistory.push(payment);
    loan.lastPaymentDate = Date.now();

    // Update remaining balance
    loan.remainingBalance = Math.max(0, loan.remainingBalance - amount);

    // Check if loan is fully paid
    if (loan.remainingBalance <= 0) {
      loan.status = 'paid'; // This will show as "Cleared" in the frontend
      loan.remainingBalance = 0;
      loan.nextPaymentDate = null;

      // Check if loan was overdue
      const now = new Date();
      let overdue = false;
      if (loan.term && loan.createdAt) {
        const expectedEndDate = new Date(loan.createdAt);
        expectedEndDate.setMonth(expectedEndDate.getMonth() + loan.term);
        if (now > expectedEndDate) {
          overdue = true;
        }
      }

      if (overdue) {
        // Suspend loan privilege for 1 month
        const user = await User.findById(loan.user._id);
        user.loanPrivilegeSuspended = true;
        user.loanPrivilegeSuspendedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await user.save();
      }

      // Create loan completion notification
      await NotificationService.createNotification({
        type: 'loan_completed',
        message: `Congratulations! Your loan #${loan.loanNumber} has been fully paid and is now cleared.`,
        user: req.user.id,
        relatedTo: loan._id,
        onModel: 'Loan',
        priority: 'high'
      });
    } else {
      // Set next payment date (30 days from now)
      loan.nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    await loan.save();

    // Create transaction record
    await Transaction.create({
      user: req.user.id,
      type: 'loan_payment',
      amount,
      paymentMethod,
      status: 'completed',
      description: `Loan payment for loan #${loan.loanNumber}`,
      loan: loan._id,
      balanceAfter: loan.remainingBalance
    });

    // Create loan payment notification
    console.log('Creating loan payment notification...');
    try {
      const notification = await NotificationService.createNotification({
        type: 'loan_payment',
        message: `Your loan payment of UGX${amount.toLocaleString()} has been received and processed successfully.${loan.remainingBalance <= 0 ? ' Your loan is now cleared!' : ` Remaining balance: UGX${loan.remainingBalance.toLocaleString()}`}`,
        user: req.user.id,
        relatedTo: loan._id,
        onModel: 'Loan',
        priority: 'medium'
      });
      console.log('Notification created successfully:', {
        id: notification._id,
        type: notification.type,
        message: notification.message,
        user: notification.user
      });
    } catch (notificationError) {
      console.error('Error creating loan payment notification:', {
        message: notificationError.message,
        stack: notificationError.stack,
        code: notificationError.code,
        name: notificationError.name
      });
      // Continue with the response even if notification fails
    }

    res.status(200).json({
      success: true,
      data: loan,
      message: loan.remainingBalance <= 0 ? 'Loan fully paid and cleared!' : 'Payment processed successfully'
    });
  } catch (err) {
    console.error('Error making loan payment:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

