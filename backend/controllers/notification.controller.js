const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    console.log('=== GET NOTIFICATIONS REQUEST ===');
    console.log('User ID:', req.user.id);
    console.log('User object:', {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    });
    
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log('Found notifications:', notifications.length);
    if (notifications.length > 0) {
      console.log('First notification:', {
        id: notifications[0]._id,
        type: notifications[0].type,
        message: notifications[0].message,
        read: notifications[0].read,
        createdAt: notifications[0].createdAt
      });
    } else {
      console.log('No notifications found for user');
    }

    // Set cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (err) {
    console.error('Error fetching notifications:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    console.log('=== MARK AS READ REQUEST ===');
    console.log('Notification ID:', req.params.id);
    console.log('User ID:', req.user.id);

    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      console.log('Notification not found or does not belong to user');
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    console.log('Found notification:', {
      id: notification._id,
      type: notification.type,
      message: notification.message,
      read: notification.read
    });

    notification.read = true;
    await notification.save();

    console.log('Notification marked as read successfully');

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    console.error('Error marking notification as read:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    console.log('=== MARK ALL AS READ REQUEST ===');
    console.log('User ID:', req.user.id);

    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    console.log('Update result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    console.log('=== GET UNREAD COUNT REQUEST ===');
    console.log('User ID:', req.user.id);

    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    console.log('Unread count:', count);

    // Set cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (err) {
    console.error('Error getting unread count:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
}; 