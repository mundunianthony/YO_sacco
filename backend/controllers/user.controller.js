const User = require('../models/User');
const { validationResult } = require('express-validator');
const NotificationService = require('../services/notificationService');

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }

  try {
    const { firstName, lastName, email, password, phoneNumber, address } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user
    user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      address,
      role: 'member',
      status: 'pending'
    });

    // Create registration notification
    await NotificationService.createNotification({
      type: 'member_registration',
      message: `New member registration: ${firstName} ${lastName}`,
      user: user._id,
      relatedTo: user._id,
      onModel: 'User',
      priority: 'medium'
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }

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

    // Create status change notification
    await NotificationService.createNotification({
      type: 'member_status_change',
      message: `Your account status has been changed to ${status}`,
      user: user._id,
      relatedTo: user._id,
      onModel: 'User',
      priority: 'high'
    });

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