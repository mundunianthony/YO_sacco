const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      totalMembers: 0,
      totalLoans: 0,
      pendingLoans: 0,
      totalTransactions: 0
    }
  });
});

// @desc    Get all members
// @route   GET /api/admin/members
// @access  Private/Admin
router.get('/members', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    data: []
  });
});

// @desc    Get member details
// @route   GET /api/admin/members/:id
// @access  Private/Admin
router.get('/members/:id', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = router; 