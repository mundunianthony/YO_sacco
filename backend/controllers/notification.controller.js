const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');
const { validationResult } = require('express-validator');

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    console.log('=== GET NOTIFICATIONS API ===');
    console.log('User:', req.user._id);

    const notifications = await NotificationService.getUserNotifications(req.user._id);
    
    console.log('Sending response:', {
      status: 'success',
      count: notifications.length
    });

    res.status(200).json({
      success: true,
      data: {
        notifications
      }
    });
  } catch (err) {
    console.error('Error in getNotifications API:', err);
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
    console.log('=== GET UNREAD COUNT API ===');
    console.log('User:', req.user._id);

    const count = await NotificationService.getUnreadCount(req.user._id);
    
    console.log('Sending response:', {
      status: 'success',
      count
    });

    res.status(200).json({
      success: true,
      data: {
        count
      }
    });
  } catch (err) {
    console.error('Error in getUnreadCount API:', err);
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
    console.log('=== MARK AS READ API ===');
    console.log('User:', req.user._id);
    console.log('Notification ID:', req.params.id);

    const notification = await NotificationService.markAsRead(req.params.id, req.user._id);
    
    if (!notification) {
      console.log('Notification not found or unauthorized');
      return res.status(404).json({
        success: false,
        error: 'Notification not found or unauthorized'
      });
    }

    console.log('Sending response:', {
      status: 'success',
      notificationId: notification._id
    });

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    console.error('Error in markAsRead API:', err);
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
    console.log('=== MARK ALL AS READ API ===');
    console.log('User:', req.user._id);

    await NotificationService.markAllAsRead(req.user._id);
    
    console.log('Sending response:', {
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    console.error('Error in markAllAsRead API:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Create broadcast notification
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
exports.createBroadcastNotification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }

  try {
    console.log('=== CREATE BROADCAST NOTIFICATION API ===');
    console.log('User:', req.user._id);
    console.log('Request body:', req.body);

    if (req.user.role !== 'admin') {
      console.log('Unauthorized: User is not an admin');
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create broadcast notifications'
      });
    }

    const notifications = await NotificationService.notifyAllAdmins(req.body);
    
    console.log('Sending response:', {
      status: 'success',
      count: notifications.length
    });

    res.status(201).json({
      success: true,
      data: {
        notifications
      }
    });
  } catch (err) {
    console.error('Error in createBroadcastNotification API:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
};

// @desc    Mark notification as unread
// @route   PUT /api/notifications/:id/unread
// @access  Private
exports.markAsUnread = async (req, res) => {
  try {
    console.log('=== MARK AS UNREAD API ===');
    console.log('User:', req.user._id);
    console.log('Notification ID:', req.params.id);

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: false },
      { new: true }
    );

    if (!notification) {
      console.log('Notification not found or unauthorized');
      return res.status(404).json({
        success: false,
        error: 'Notification not found or unauthorized'
      });
    }

    console.log('Notification marked as unread:', {
      id: notification._id,
      type: notification.type,
      message: notification.message
    });

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    console.error('Error in markAsUnread API:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Server error'
    });
  }
}; 