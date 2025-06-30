const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  getMemberTransactions,
  generateMemberReport,
  generateMonthlyReport,
  updateUserStatus,
  getAllLoans,
  getLoanById,
  updateLoanStatus,
  getDashboardStats,
  getUserStats,
  getLoanStats,
  getTransactions,
  getLoanPayments,
  getPendingWithdrawals,
  sendReminder,
  getNotifications,
  markNotificationAsRead
} = require('../controllers/admin.controller');

// Import savings controller for withdrawal approval
const { approveWithdrawal } = require('../controllers/savings.controller');

const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/stats', getUserStats);
router.get('/users/:id', getUserById);
router.get('/users/:id/transactions', getMemberTransactions);
router.get('/users/:id/report', generateMemberReport);
router.put('/users/:id/status', [
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], updateUserStatus);
router.post('/users/:id/reminder', [
  body('message').notEmpty().withMessage('Message is required')
], sendReminder);

// Loan management routes
router.get('/loans', getAllLoans);
router.get('/loans/stats', getLoanStats);
router.get('/loans/:id', getLoanById);
router.get('/loans/:id/payments', getLoanPayments);
router.put('/loans/:id/status', [
  body('status').isIn(['approved', 'rejected', 'active']).withMessage('Invalid status')
], updateLoanStatus);

// Transaction routes
router.get('/transactions', getTransactions);
router.get('/withdrawals/pending', getPendingWithdrawals);
router.put('/withdrawals/:id/approve', [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be either approved or rejected'),
  body('rejectionReason').optional().notEmpty().withMessage('Rejection reason is required when status is rejected')
], approveWithdrawal);

// Report routes
router.get('/reports/monthly', generateMonthlyReport);

// Dashboard routes
router.get('/dashboard', getDashboardStats);

// Notification routes
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);

// Interest management routes
router.get('/interest/stats', async (req, res) => {
  try {
    const InterestService = require('../services/interestService');
    const stats = await InterestService.getInterestStatistics();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching interest statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

router.post('/interest/calculate', [
  body('fromDate').isISO8601().withMessage('Valid fromDate is required'),
  body('toDate').isISO8601().withMessage('Valid toDate is required'),
  body('interestRate').optional().isFloat({ min: 0, max: 20 }).withMessage('Interest rate must be between 0 and 20%')
], async (req, res) => {
  try {
    const { fromDate, toDate, interestRate } = req.body;

    const InterestService = require('../services/interestService');
    const result = await InterestService.calculateAndApplyInterestForAllUsers(
      new Date(fromDate),
      new Date(toDate),
      interestRate || InterestService.DEFAULT_INTEREST_RATE
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error calculating interest:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

router.get('/interest/history', async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, userId } = req.query;

    const query = { type: 'interest_earned' };

    // Add date filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Add user filter if provided
    if (userId) {
      query.user = userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await require('../models/Transaction').find(query)
      .populate('user', 'firstName lastName email memberId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await require('../models/Transaction').countDocuments(query);

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

module.exports = router;

