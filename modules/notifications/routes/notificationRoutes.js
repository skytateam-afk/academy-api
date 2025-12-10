/**
 * Notification Routes
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../../../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for authenticated user
 * @access  Protected
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   GET /api/notifications/unread/count
 * @desc    Get unread notification count
 * @access  Protected
 */
router.get('/unread/count', notificationController.getUnreadCount);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Protected
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark specific notification as read
 * @access  Protected
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * @route   PATCH /api/notifications/:id/unread
 * @desc    Mark specific notification as unread
 * @access  Protected
 */
router.patch('/:id/unread', notificationController.markAsUnread);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a specific notification
 * @access  Protected
 */
router.delete('/:id', notificationController.deleteNotification);

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications
 * @access  Protected
 */
router.delete('/', notificationController.deleteAllNotifications);

module.exports = router;
