const Loan = require('../models/Loan');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const NotificationService = require('../services/notificationService');

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

    // Check for existing unpaid loans
    const existingLoan = await Loan.findOne({
      user: req.user.id,
      status: { $in: ['pending', 'approved', 'active'] }
    });

    if (existingLoan) {
      return res.status(400).json({
        success: false,
        error: 'You have an existing unpaid loan. Please clear your current loan before applying for a new one.'
      });
    }

    // Calculate loan details
    const interestRate = 10; // 10% interest rate
    const totalInterest = (amount * interestRate * term) / 100;
    const totalPayment = amount + totalInterest;
    const monthlyPayment = totalPayment / term;

    // Create loan application
    const loan = await Loan.create({
      user: req.user.id,
      amount,
      purpose,
      term,
      collateral,
      guarantors,
      status: 'pending',
      interestRate,
      monthlyPayment,
      totalPayment,
      remainingBalance: totalPayment,
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    // Populate user details for notification
    await loan.populate('user', 'firstName lastName');

    // Get admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('No admin user found for notification');
    }

    // Create loan application notification
    console.log('Creating loan application notification...');
    try {
      const notification = await NotificationService.createNotification({
        type: 'loan_application',
        message: `Your loan application for $${amount} has been received and is pending approval. We will notify you once it's reviewed.`,
        user: req.user.id,
        relatedTo: loan._id,
        onModel: 'Loan',
        priority: 'high'
      });
      console.log('Notification created successfully:', {
        id: notification._id,
        type: notification.type,
        message: notification.message,
        user: notification.user
      });
    } catch (notificationError) {
      console.error('Error creating loan application notification:', {
        message: notificationError.message,
        stack: notificationError.stack,
        code: notificationError.code,
        name: notificationError.name
      });
      // Continue with the response even if notification fails
    }

    // Create notification for admin if admin user exists
    if (adminUser) {
      try {
        await NotificationService.createNotification({
          type: 'loan_application',
          message: `New loan application from ${loan.user.firstName} ${loan.user.lastName} for $${amount}`,
          user: adminUser._id,
          relatedTo: loan._id,
          onModel: 'Loan',
          priority: 'high'
        });
      } catch (notificationError) {
        console.error('Error creating admin notification:', {
          error: notificationError.message,
          stack: notificationError.stack,
          code: notificationError.code
        });
        // Continue with loan creation even if notification fails
      }
    }

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

// @desc    Get all loans (admin only)
// @route   GET /api/loans
// @access  Private/Admin
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate('user', 'firstName lastName email memberId')
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
    const { status, rejectionReason } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    // Update loan status
    loan.status = status;
    
    if (status === 'approved') {
      loan.approvedBy = req.user.id;
      loan.approvedAt = Date.now();
      
      // Update user's loan balance
      const user = await User.findById(loan.user);
      if (user) {
        user.loanBalance = (user.loanBalance || 0) + loan.amount;
        await user.save();
      }

      // Create approval notification
      await NotificationService.createNotification({
        type: 'loan_approval',
        message: `Your loan application for $${loan.amount} has been approved`,
        user: loan.user,
        relatedTo: loan._id,
        onModel: 'Loan',
        priority: 'high'
      });
    } else if (status === 'rejected') {
      loan.rejectionReason = rejectionReason;

      // Create rejection notification
      await NotificationService.createNotification({
        type: 'loan_rejection',
        message: `Your loan application for $${loan.amount} has been rejected. Reason: ${rejectionReason}`,
        user: loan.user,
        relatedTo: loan._id,
        onModel: 'Loan',
        priority: 'high'
      });
    }

    await loan.save();

    // Populate user and approver details
    await loan.populate('user', 'firstName lastName email memberId');
    await loan.populate('approvedBy', 'firstName lastName');

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
    }

    await loan.save();

    // Create loan payment notification
    console.log('Creating loan payment notification...');
    try {
      const notification = await NotificationService.createNotification({
        type: 'loan_payment',
        message: `Your loan payment of $${amount} has been received and is being processed. We will notify you once it's confirmed.`,
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