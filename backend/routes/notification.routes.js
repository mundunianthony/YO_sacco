const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { check } = require('express-validator');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  createSystemNotification,
  createMaintenanceNotification,
  createBroadcastNotification
} = require('../controllers/notificationController');

const router = express.Router();

// Member routes
router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.put('/:id/read', authenticate, markAsRead);
router.put('/read-all', authenticate, markAllAsRead);

// Admin routes
router.get('/admin', authenticate, authorize('admin'), getAdminNotifications);
router.get('/admin/unread-count', authenticate, authorize('admin'), getAdminUnreadCount);
router.put('/admin/:id/read', authenticate, authorize('admin'), markAdminNotificationAsRead);
router.put('/admin/read-all', authenticate, authorize('admin'), markAllAdminNotificationsAsRead);
router.post('/system', authenticate, authorize('admin'), [
  check('message', 'Message is required').notEmpty(),
  check('type', 'Type is required').notEmpty()
], createSystemNotification);
router.post('/maintenance', authenticate, authorize('admin'), [
  check('details', 'Maintenance details are required').notEmpty()
], createMaintenanceNotification);
router.post('/broadcast', authenticate, authorize('admin'), [
  check('message', 'Message is required').notEmpty(),
  check('type', 'Type is required').notEmpty()
], createBroadcastNotification);

module.exports = router; 