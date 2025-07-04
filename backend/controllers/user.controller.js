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

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log('Found admin users:', adminUsers.length);

    // Notify all admin users about new registration
    for (const admin of adminUsers) {
      console.log('Notifying admin:', admin._id);
      await NotificationService.notifyNewMemberRegistration(
        admin._id,
        `${firstName} ${lastName}`
      );
    }

    // Create registration notification for the new user
    await NotificationService.createNotification({
      type: 'new_member',
      message: `Welcome ${firstName}! Your registration is pending approval.`,
      user: user._id,
      relatedTo: user._id,
      onModel: 'User',
      priority: 'medium',
      category: 'member'
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

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // Notify all admins about the status change
    await NotificationService.notifyAllAdmins({
      type: 'member_status',
      message: `Member ${user.firstName} ${user.lastName}'s status changed from ${oldStatus} to ${status}`,
      priority: 'high',
      category: 'member'
    });

    // Create status change notification for the user
    await NotificationService.createNotification({
      type: 'member_status',
      message: `Your account status has been changed from ${oldStatus} to ${status}`,
      user: user._id,
      relatedTo: user._id,
      onModel: 'User',
      priority: 'high',
      category: 'member'
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

exports.getAllMembers = async (req, res) => {
  try {
    const members = await User.find({ role: 'member' }).select('-password');
    res.status(200).json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 