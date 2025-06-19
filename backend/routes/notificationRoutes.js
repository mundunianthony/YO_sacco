const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Member routes
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/unread', notificationController.markAsUnread);

// Admin routes
router.use(restrictTo('admin'));
router.get('/admin', notificationController.getAdminNotifications);
router.post('/system', notificationController.createSystemNotification);
router.post('/maintenance', notificationController.createMaintenanceNotification);
router.post('/broadcast', notificationController.createBroadcastNotification);
router.get('/admin/unread-count', notificationController.getAdminUnreadCount);
router.put('/admin/:id/read', notificationController.markAdminNotificationAsRead);
router.put('/admin/read-all', notificationController.markAllAdminNotificationsAsRead);

module.exports = router; 