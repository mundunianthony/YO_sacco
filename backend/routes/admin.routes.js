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

// Report routes
router.get('/reports/monthly', generateMonthlyReport);

// Dashboard routes
router.get('/dashboard', getDashboardStats);

// Notification routes
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);

module.exports = router;

