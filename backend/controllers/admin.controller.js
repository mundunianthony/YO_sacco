const User = require('../models/User');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const { TotalSavingsPool } = require('../models/Savings');
const { validationResult } = require('express-validator');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Get member transactions
// @route   GET /api/admin/users/:id/transactions
// @access  Private/Admin
exports.getMemberTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    console.log('Fetching transactions for user:', id);
    const transactions = await Transaction.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('user', 'firstName lastName memberId');

    console.log('Transactions found:', transactions ? transactions.length : 0);
    res.status(200).json({
      success: true,
      count: transactions ? transactions.length : 0,
      data: transactions || []
    });
  } catch (err) {
    console.error('Error fetching member transactions:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error',
      data: []
    });
  }
};

// @desc    Generate member report
// @route   GET /api/admin/users/:id/report
// @access  Private/Admin
exports.generateMemberReport = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const transactions = await Transaction.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(50);

    const loans = await Loan.find({ user: id })
      .sort({ createdAt: -1 });

    const reportData = {
      member: user,
      transactions,
      loans,
      summary: {
        totalTransactions: transactions.length,
        totalDeposits: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
        totalWithdrawals: transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0),
        totalLoans: loans.length,
        activeLoans: loans.filter(l => l.status === 'active').length,
        totalLoanAmount: loans.reduce((sum, l) => sum + l.amount, 0),
      }
    };

    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (err) {
    console.error('Error generating member report:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Generate monthly report
// @route   GET /api/admin/reports/monthly
// @access  Private/Admin
exports.generateMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Year and month are required'
      });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const transactions = await Transaction.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('user', 'firstName lastName memberId');

    const loans = await Loan.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('user', 'firstName lastName memberId');

    const summary = {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      transactions: {
        total: transactions.length,
        deposits: transactions.filter(t => t.type === 'deposit').length,
        withdrawals: transactions.filter(t => t.type === 'withdrawal').length,
        totalDepositAmount: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
        totalWithdrawalAmount: transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0),
      },
      loans: {
        total: loans.length,
        totalAmount: loans.reduce((sum, l) => sum + l.amount, 0),
        approved: loans.filter(l => l.status === 'approved').length,
        active: loans.filter(l => l.status === 'active').length,
        paid: loans.filter(l => l.status === 'paid').length,
      }
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        transactions,
        loans
      }
    });
  } catch (err) {
    console.error('Error generating monthly report:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Get all loans
// @route   GET /api/admin/loans
// @access  Private/Admin
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate('user', 'firstName lastName email memberId')
      .populate('approvedBy', 'firstName lastName')
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
};

// @desc    Get loan by ID
// @route   GET /api/admin/loans/:id
// @access  Private/Admin
exports.getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('user', 'firstName lastName email memberId')
      .populate('approvedBy', 'firstName lastName');

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (err) {
    console.error('Error fetching loan:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Update loan status
// @route   PUT /api/admin/loans/:id/status
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

    const oldStatus = loan.status;

    // Update loan status
    loan.status = status;

    if (status === 'approved') {
      // Check if the loan amount is more than the available balance in the savings pool
      const totalSavingsPool = await TotalSavingsPool.getPool();
      if (totalSavingsPool.availableAmount < loan.amount) {
        loan.status = 'rejected';
        loan.rejectionReason = 'Insufficient funds in savings pool';
        await loan.save();
        const NotificationService = require('../services/notificationService');
        await NotificationService.createNotification({
          type: 'loan_status_change',
          message: `Your loan application for UGX${loan.amount.toLocaleString()} could not be approved because the requested amount is not available at the moment. Please try again later.`,
          user: loan.user,
          relatedTo: loan._id,
          onModel: 'Loan',
          priority: 'high'
        });
        return res.status(400).json({
          success: false,
          error: `This amount is not available at the moment, please try again later.`
        });
      }
      loan.approvedBy = req.user.id;
      loan.approvedAt = Date.now();
      // Update user's loan balance
      const user = await User.findById(loan.user);
      if (user) {
        user.loanBalance = (user.loanBalance || 0) + loan.amount;
        await user.save();
      }
    } else if (status === 'rejected') {
      loan.rejectionReason = rejectionReason;
    } else if (status === 'active' && oldStatus !== 'active') {
      // If loan is being activated, deduct from the total savings pool
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
        user: loan.user,
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
    } else if (status === 'paid') {
      // When a loan is marked as paid, reduce the user's loan balance
      const user = await User.findById(loan.user);
      if (user) {
        user.loanBalance = Math.max(0, (user.loanBalance || 0) - loan.amount);
        await user.save();
      }
    }

    await loan.save();

    // Populate user and approver details
    await loan.populate('user', 'firstName lastName email memberId');
    await loan.populate('approvedBy', 'firstName lastName');

    // Create notification for the loan applicant
    let message = `Your loan application status has been${status}`;
    if (status === 'rejected' && rejectionReason) {
      message += `. Reason: ${rejectionReason}`;
    } else if (status === 'active') {
      message += `. Your loan of UGX${loan.amount.toLocaleString()} has been activated and disbursed.`;
    }

    const NotificationService = require('../services/notificationService');
    await NotificationService.createNotification({
      type: 'loan_status_change',
      message: message,
      user: loan.user,
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

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });

    // Get loan statistics
    const totalLoans = await Loan.countDocuments();
    const pendingLoans = await Loan.countDocuments({ status: 'pending' });
    const activeLoans = await Loan.countDocuments({ status: 'active' });
    const totalLoanAmount = await Loan.aggregate([
      { $match: { status: { $in: ['active', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get savings statistics
    const savingsStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalSavings: { $sum: '$savingsBalance' },
          previousMonthSavings: {
            $sum: {
              $cond: [
                { $lt: ['$createdAt', new Date(new Date().setMonth(new Date().getMonth() - 1))] },
                '$savingsBalance',
                0
              ]
            }
          }
        }
      }
    ]);

    // Get total savings pool information
    const totalSavingsPool = await TotalSavingsPool.getPool();

    const totalSavings = savingsStats[0]?.totalSavings || 0;
    const previousMonthSavings = savingsStats[0]?.previousMonthSavings || 0;
    const monthlyGrowth = previousMonthSavings > 0
      ? ((totalSavings - previousMonthSavings) / previousMonthSavings) * 100
      : 0;

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .populate('user', 'firstName lastName email memberId')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent loans
    const recentLoans = await Loan.find()
      .populate('user', 'firstName lastName email memberId')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get pending withdrawal requests
    const pendingWithdrawals = await Transaction.find({
      type: 'withdrawal',
      status: 'pending'
    })
      .populate('user', 'firstName lastName email memberId')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers
        },
        loans: {
          total: totalLoans,
          pending: pendingLoans,
          active: activeLoans,
          totalAmount: totalLoanAmount[0]?.total || 0
        },
        savings: {
          total: totalSavings,
          monthlyGrowth: parseFloat(monthlyGrowth.toFixed(1)),
          pool: {
            totalAmount: totalSavingsPool.totalAmount,
            availableAmount: totalSavingsPool.availableAmount,
            loanedAmount: totalSavingsPool.loanedAmount,
            lastUpdated: totalSavingsPool.lastUpdated
          }
        },
        recentTransactions,
        recentLoans,
        pendingWithdrawals
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });

    // Get users with loans
    const usersWithLoans = await User.countDocuments({ loanBalance: { $gt: 0 } });

    // Get total savings
    const totalSavings = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$savingsBalance' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
        withLoans: usersWithLoans,
        totalSavings: totalSavings[0]?.total || 0
      }
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Get detailed loan statistics
// @route   GET /api/admin/loans/stats
// @access  Private/Admin
exports.getLoanStats = async (req, res) => {
  try {
    const totalLoans = await Loan.countDocuments();
    const pendingLoans = await Loan.countDocuments({ status: 'pending' });
    const activeLoans = await Loan.countDocuments({ status: 'active' });
    const paidLoans = await Loan.countDocuments({ status: { $in: ['paid', 'cleared'] } });
    const defaultedLoans = await Loan.countDocuments({ status: 'defaulted' });

    // Get total loan amount and total interest
    const loanAmounts = await Loan.aggregate([
      { $match: { status: { $in: ['active', 'approved'] } } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalInterest: { $sum: '$interestAmount' }
        }
      }
    ]);

    // Get loans by term
    const loansByTerm = await Loan.aggregate([
      {
        $group: {
          _id: '$term',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalLoans,
        pending: pendingLoans,
        active: activeLoans,
        paid: paidLoans,
        defaulted: defaultedLoans,
        totalAmount: loanAmounts[0]?.totalAmount || 0,
        totalInterest: loanAmounts[0]?.totalInterest || 0,
        byTerm: loansByTerm
      }
    });
  } catch (err) {
    console.error('Error fetching loan stats:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Get transaction history
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getTransactions = async (req, res) => {
  try {
    const { type, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('user', 'firstName lastName email memberId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Get loan payment history
// @route   GET /api/admin/loans/:id/payments
// @access  Private/Admin
exports.getLoanPayments = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    const payments = await Transaction.find({
      loan: req.params.id,
      type: 'loan_payment'
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        loan: {
          id: loan._id,
          amount: loan.amount,
          remainingBalance: loan.remainingBalance,
          status: loan.status
        },
        payments
      }
    });
  } catch (err) {
    console.error('Error fetching loan payments:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Get pending withdrawal requests
// @route   GET /api/admin/withdrawals/pending
// @access  Private/Admin
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const pendingWithdrawals = await Transaction.find({
      type: 'withdrawal',
      status: 'pending'
    })
      .populate('user', 'firstName lastName email memberId')
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: pendingWithdrawals
    });
  } catch (error) {
    console.error('Error fetching pending withdrawals:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Send reminder to member
// @route   POST /api/admin/users/:id/reminder
// @access  Private/Admin
exports.sendReminder = async (req, res) => {
  try {
    const { message } = req.body;
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create notification for the user
    const NotificationService = require('../services/notificationService');
    await NotificationService.createNotification({
      type: 'admin_reminder',
      message: message,
      user: id,
      priority: 'high',
      category: 'general'
    });

    res.status(200).json({
      success: true,
      message: 'Reminder sent successfully'
    });
  } catch (err) {
    console.error('Error sending reminder:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Get admin notifications
// @route   GET /api/admin/notifications
// @access  Private/Admin
exports.getNotifications = async (req, res) => {
  try {
    const NotificationService = require('../services/notificationService');
    const notifications = await NotificationService.getUserNotifications(req.user._id, 1, 50);

    res.status(200).json({
      success: true,
      data: {
        notifications
      }
    });
  } catch (err) {
    console.error('Error fetching admin notifications:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Mark admin notification as read
// @route   PUT /api/admin/notifications/:id/read
// @access  Private/Admin
exports.markNotificationAsRead = async (req, res) => {
  try {
    const NotificationService = require('../services/notificationService');
    const notification = await NotificationService.markAsRead(req.params.id, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

