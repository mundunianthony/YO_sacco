const Loan = require('../models/Loan');
const User = require('../models/User');
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
    const { amount, purpose, term } = req.body;

    // Fetch user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Rule 1: Minimum savings
    if ((user.savingsBalance || 0) < 10000) {
      return res.status(400).json({ success: false, error: 'You must have at least UGX 10,000 in savings to qualify for a loan.' });
    }

    // Rule 2: Max loan is 3x savings
    if (amount > 3 * (user.savingsBalance || 0)) {
      return res.status(400).json({ success: false, error: 'You can only borrow up to 3 times your savings balance.' });
    }

    // Rule 3: Loan privilege suspension
    if (user.loanPrivilegeSuspended && user.loanPrivilegeSuspendedUntil && user.loanPrivilegeSuspendedUntil > new Date()) {
      return res.status(403).json({ success: false, error: `You are temporarily suspended from applying for new loans until ${user.loanPrivilegeSuspendedUntil.toLocaleDateString()}.` });
    }

    // Create loan application
    const loan = await Loan.create({
      user: req.user.id,
      amount,
      purpose,
      term,
      status: 'pending'
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
      message: `Your loan application for UGX${amount} has been received and is pending approval.`,
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
    await loan.save();

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });

    // Notify all admin users about loan status change
    for (const admin of adminUsers) {
      await NotificationService.createNotification({
        type: 'loan_status_change',
        message: `Loan #${loan._id} status changed from ${oldStatus} to ${status}`,
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
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    // Create payment record
    const payment = {
      amount,
      date: Date.now(),
      paymentMethod
    };

    // Add payment to history
    loan.paymentHistory.push(payment);
    loan.lastPaymentDate = Date.now();
    loan.nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Next payment in 30 days

    // Update remaining balance
    const totalPaid = loan.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    loan.remainingBalance = loan.totalPayment - totalPaid;

    // Update loan status if fully paid
    if (loan.remainingBalance <= 0) {
      loan.status = 'paid';
      loan.remainingBalance = 0;

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
        const user = await User.findById(loan.user);
        user.loanPrivilegeSuspended = true;
        user.loanPrivilegeSuspendedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await user.save();
      }
    }

    await loan.save();

    // Create loan payment notification
    console.log('Creating loan payment notification...');
    try {
      const notification = await NotificationService.createNotification({
        type: 'loan_payment',
        message: `Your loan payment of UGX${amount} has been received and is being processed. We will notify you once it's confirmed.`,
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
      data: loan
    });
  } catch (err) {
    console.error('Error making loan payment:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
}; 