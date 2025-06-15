const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get member profile
// @route   GET /api/members/profile
// @access  Private
router.get('/profile', protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// @desc    Update member profile
// @route   PUT /api/members/profile
// @access  Private
router.put('/profile', protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

module.exports = router; 