const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAllLoans,
  getLoanById,
  updateLoanStatus,
  getDashboardStats,
  getUserStats,
  getLoanStats,
  getTransactions,
  getLoanPayments,
  getPendingWithdrawals
} = require('../controllers/admin.controller');
const { approveWithdrawal } = require('../controllers/savings.controller');
const User = require('../models/User');

const router = express.Router();

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', authenticate, authorize('admin'), getDashboardStats);

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', authenticate, authorize('admin'), getAllUsers);

// @desc    Get user stats
// @route   GET /api/admin/users/stats
// @access  Private/Admin
router.get('/users/stats', authenticate, authorize('admin'), getUserStats);

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get('/users/:id', authenticate, authorize('admin'), getUserById);

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', authenticate, authorize('admin'), [
  check('status', 'Status is required').isIn(['active', 'inactive', 'suspended'])
], updateUserStatus);

// @desc    Get all loans
// @route   GET /api/admin/loans
// @access  Private/Admin
router.get('/loans', authenticate, authorize('admin'), getAllLoans);

// @desc    Get loan stats
// @route   GET /api/admin/loans/stats
// @access  Private/Admin
router.get('/loans/stats', authenticate, authorize('admin'), getLoanStats);

// @desc    Get loan by ID
// @route   GET /api/admin/loans/:id
// @access  Private/Admin
router.get('/loans/:id', authenticate, authorize('admin'), getLoanById);

// @desc    Get loan payments
// @route   GET /api/admin/loans/:id/payments
// @access  Private/Admin
router.get('/loans/:id/payments', authenticate, authorize('admin'), getLoanPayments);

// @desc    Update loan status
// @route   PUT /api/admin/loans/:id/status
// @access  Private/Admin
router.put('/loans/:id/status', authenticate, authorize('admin'), [
  check('status', 'Status is required').isIn(['approved', 'rejected', 'active', 'paid', 'defaulted']),
  check('rejectionReason', 'Rejection reason is required when status is rejected')
    .if((req) => req.body.status === 'rejected')
    .notEmpty()
], updateLoanStatus);

// @desc    Get transactions
// @route   GET /api/admin/transactions
// @access  Private/Admin
router.get('/transactions', authenticate, authorize('admin'), getTransactions);

// @desc    Get pending withdrawal requests
// @route   GET /api/admin/withdrawals/pending
// @access  Private/Admin
router.get('/withdrawals/pending', authenticate, authorize('admin'), getPendingWithdrawals);

// @desc    Approve or reject withdrawal request
// @route   PUT /api/admin/withdrawals/:id/approve
// @access  Private/Admin
router.put('/withdrawals/:id/approve', authenticate, authorize('admin'), [
  check('status', 'Status is required').isIn(['approved', 'rejected']),
  check('rejectionReason', 'Rejection reason is required when status is rejected')
    .if((req) => req.body.status === 'rejected')
    .notEmpty()
], approveWithdrawal);

// @desc    Send reminder to member
// @route   POST /api/admin/members/:id/reminder
// @access  Private/Admin
router.post('/members/:id/reminder', authenticate, authorize('admin'), [
  check('message', 'Message is required').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }

  try {
    const { message } = req.body;
    const { id } = req.params;
    const adminId = req.user.id;

    // Find the member
    const member = await User.findById(id);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Find the admin
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Create notification for the member
    const NotificationService = require('../services/notificationService');

    // Handle admin name with fallback
    const adminFirstName = admin.firstName || 'Admin';
    const adminLastName = admin.lastName || '';
    const adminName = `${adminFirstName} ${adminLastName}`.trim();

    await NotificationService.notifyAdminReminder(
      member._id,
      message,
      adminName
    );

    res.status(200).json({
      success: true,
      message: 'Reminder sent successfully',
      data: {
        memberId: member._id,
        memberName: `${member.firstName} ${member.lastName}`,
        message,
        sentBy: `${admin.firstName} ${admin.lastName}`
      }
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send reminder'
    });
  }
});

module.exports = router; 