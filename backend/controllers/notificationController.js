const NotificationService = require('../services/notificationService');
const { catchAsync } = require('../utils/errorHandler');

// Member endpoints
exports.getNotifications = catchAsync(async (req, res) => {
  console.log('=== GET NOTIFICATIONS REQUEST ===');
  console.log('User ID:', req.user._id);
  console.log('User object:', {
    id: req.user._id,
    role: req.user.role,
    email: req.user.email
  });

  const { page = 1, limit = 20, category, priority, unreadOnly } = req.query;
  
  try {
    // Build query based on filters
    const query = { user: req.user._id };
    
    if (category) {
      query.category = category;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (unreadOnly === 'true') {
      query.read = false;
    }

    console.log('Query filters:', query);

    const notifications = await NotificationService.getUserNotifications(
      req.user._id,
      parseInt(page),
      parseInt(limit),
      query
    );

    const unreadCount = await NotificationService.getUnreadCount(req.user._id);

    console.log('Found notifications:', notifications.length);
    if (notifications.length === 0) {
      console.log('No notifications found for user');
    }

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        unreadCount,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
});

exports.markAsRead = catchAsync(async (req, res) => {
  console.log('=== MARK NOTIFICATION AS READ ===');
  console.log('Notification ID:', req.params.id);
  console.log('User ID:', req.user._id);

  try {
    const notification = await NotificationService.markAsRead(
      req.params.id,
      req.user._id
    );

    if (!notification) {
      console.log('Notification not found');
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    console.log('Notification marked as read successfully');
    res.status(200).json({
      status: 'success',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read'
    });
  }
});

exports.markAllAsRead = catchAsync(async (req, res) => {
  console.log('=== MARK ALL NOTIFICATIONS AS READ ===');
  console.log('User ID:', req.user._id);

  try {
    await NotificationService.markAllAsRead(req.user._id);
    console.log('All notifications marked as read successfully');

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read'
    });
  }
});

exports.getUnreadCount = catchAsync(async (req, res) => {
  console.log('=== GET UNREAD COUNT ===');
  console.log('User ID:', req.user._id);

  try {
    const count = await NotificationService.getUnreadCount(req.user._id);
    console.log('Unread count:', count);

    res.status(200).json({
      status: 'success',
      data: { count }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get unread count'
    });
  }
});

// Admin endpoints
exports.getAdminNotifications = catchAsync(async (req, res) => {
  console.log('=== GET ADMIN NOTIFICATIONS ===');
  console.log('Admin ID:', req.user._id);

  const { page = 1, limit = 20, category, priority, unreadOnly } = req.query;
  
  try {
    // Build query based on filters
    const query = { user: req.user._id };
    
    if (category) {
      query.category = category;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (unreadOnly === 'true') {
      query.read = false;
    }

    console.log('Admin query filters:', query);

    const notifications = await NotificationService.getUserNotifications(
      req.user._id,
      parseInt(page),
      parseInt(limit),
      query
    );

    console.log('Found admin notifications:', notifications.length);

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch admin notifications'
    });
  }
});

exports.getAdminUnreadCount = catchAsync(async (req, res) => {
  console.log('=== GET ADMIN UNREAD COUNT ===');
  console.log('Admin ID:', req.user._id);

  try {
    const count = await NotificationService.getUnreadCount(req.user._id);
    console.log('Admin unread count:', count);

    res.status(200).json({
      status: 'success',
      data: { count }
    });
  } catch (error) {
    console.error('Error getting admin unread count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get admin unread count'
    });
  }
});

exports.markAdminNotificationAsRead = catchAsync(async (req, res) => {
  console.log('=== MARK ADMIN NOTIFICATION AS READ ===');
  console.log('Notification ID:', req.params.id);
  console.log('Admin ID:', req.user._id);

  try {
    const notification = await NotificationService.markAsRead(
      req.params.id,
      req.user._id
    );

    if (!notification) {
      console.log('Admin notification not found');
      return res.status(404).json({
        status: 'error',
        message: 'Admin notification not found'
      });
    }

    console.log('Admin notification marked as read successfully');
    res.status(200).json({
      status: 'success',
      data: notification
    });
  } catch (error) {
    console.error('Error marking admin notification as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark admin notification as read'
    });
  }
});

exports.markAllAdminNotificationsAsRead = catchAsync(async (req, res) => {
  console.log('=== MARK ALL ADMIN NOTIFICATIONS AS READ ===');
  console.log('Admin ID:', req.user._id);

  try {
    await NotificationService.markAllAsRead(req.user._id);
    console.log('All admin notifications marked as read successfully');

    res.status(200).json({
      status: 'success',
      message: 'All admin notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all admin notifications as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all admin notifications as read'
    });
  }
});

exports.createSystemNotification = catchAsync(async (req, res) => {
  console.log('=== CREATE SYSTEM NOTIFICATION ===');
  console.log('Admin ID:', req.user._id);
  console.log('Notification data:', req.body);

  const { message, type, priority = 'medium', category = 'system' } = req.body;
  
  try {
    const notification = await NotificationService.createNotification({
      type,
      message,
      user: req.user._id,
      priority,
      category
    });

    console.log('System notification created successfully');
    res.status(201).json({
      status: 'success',
      data: notification
    });
  } catch (error) {
    console.error('Error creating system notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create system notification'
    });
  }
});

exports.createMaintenanceNotification = catchAsync(async (req, res) => {
  console.log('=== CREATE MAINTENANCE NOTIFICATION ===');
  console.log('Admin ID:', req.user._id);
  console.log('Maintenance details:', req.body);

  const { details } = req.body;
  
  try {
    const notification = await NotificationService.notifyMaintenance(
      req.user._id,
      details
    );

    console.log('Maintenance notification created successfully');
    res.status(201).json({
      status: 'success',
      data: notification
    });
  } catch (error) {
    console.error('Error creating maintenance notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create maintenance notification'
    });
  }
});

exports.createBroadcastNotification = catchAsync(async (req, res) => {
  console.log('=== CREATE BROADCAST NOTIFICATION ===');
  console.log('Admin ID:', req.user._id);
  console.log('Broadcast data:', req.body);

  const { message, type, priority = 'medium', category = 'system' } = req.body;
  
  try {
    const notifications = await NotificationService.notifyAllAdmins({
      type,
      message,
      priority,
      category
    });

    console.log('Broadcast notification created successfully');
    res.status(201).json({
      status: 'success',
      data: notifications
    });
  } catch (error) {
    console.error('Error creating broadcast notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create broadcast notification'
    });
  }
}); 