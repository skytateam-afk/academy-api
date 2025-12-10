/**
 * Notification Controller
 * Handles HTTP requests for notifications
 */

const notificationRepository = require('../repositories/notificationRepository');
const logger = require('../../../config/winston');

class NotificationController {
    /**
     * Get all notifications for authenticated user
     * GET /api/notifications
     */
    async getNotifications(req, res) {
        try {
            const userId = req.user.userId;
            const { page, limit, isRead, type } = req.query;

            const result = await notificationRepository.findByUserId(userId, {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
                type
            });

            res.json({
                success: true,
                data: result.notifications.map(n => n.toJSON()),
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error fetching notifications', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to fetch notifications'
            });
        }
    }

    /**
     * Get unread notification count
     * GET /api/notifications/unread/count
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.userId;
            const count = await notificationRepository.getUnreadCount(userId);

            res.json({
                success: true,
                data: { count }
            });
        } catch (error) {
            logger.error('Error fetching unread count', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to fetch unread count'
            });
        }
    }

    /**
     * Mark notification as read
     * PATCH /api/notifications/:id/read
     */
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const notification = await notificationRepository.markAsRead(id, userId);

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification not found'
                });
            }

            res.json({
                success: true,
                data: notification.toJSON()
            });
        } catch (error) {
            logger.error('Error marking notification as read', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to mark notification as read'
            });
        }
    }

    /**
     * Mark all notifications as read
     * PATCH /api/notifications/read-all
     */
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.userId;
            const count = await notificationRepository.markAllAsRead(userId);

            res.json({
                success: true,
                message: `${count} notification(s) marked as read`,
                data: { count }
            });
        } catch (error) {
            logger.error('Error marking all notifications as read', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to mark all notifications as read'
            });
        }
    }

    /**
     * Mark notification as unread
     * PATCH /api/notifications/:id/unread
     */
    async markAsUnread(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const notification = await notificationRepository.markAsUnread(id, userId);

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification not found'
                });
            }

            res.json({
                success: true,
                data: notification.toJSON()
            });
        } catch (error) {
            logger.error('Error marking notification as unread', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to mark notification as unread'
            });
        }
    }

    /**
     * Delete a notification
     * DELETE /api/notifications/:id
     */
    async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const deleted = await notificationRepository.delete(id, userId);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification not found'
                });
            }

            res.json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting notification', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to delete notification'
            });
        }
    }

    /**
     * Delete all notifications
     * DELETE /api/notifications
     */
    async deleteAllNotifications(req, res) {
        try {
            const userId = req.user.userId;
            const count = await notificationRepository.deleteAll(userId);

            res.json({
                success: true,
                message: `${count} notification(s) deleted`,
                data: { count }
            });
        } catch (error) {
            logger.error('Error deleting all notifications', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to delete notifications'
            });
        }
    }
}

module.exports = new NotificationController();
