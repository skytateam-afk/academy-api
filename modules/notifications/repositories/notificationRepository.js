/**
 * Notification Repository
 * Handles database operations for notifications
 */

const knex = require('../../../config/knex');
const Notification = require('../models/Notification');

class NotificationRepository {
    /**
     * Create a new notification
     */
    async create(notificationData) {
        const [notification] = await knex('notifications')
            .insert({
                user_id: notificationData.userId,
                type: notificationData.type,
                title: notificationData.title,
                message: notificationData.message,
                data: notificationData.data ? JSON.stringify(notificationData.data) : null
            })
            .returning('*');

        return new Notification(notification);
    }

    /**
     * Create multiple notifications at once
     */
    async createBulk(notifications) {
        const notificationRecords = notifications.map(n => ({
            user_id: n.userId,
            type: n.type,
            title: n.title,
            message: n.message,
            data: n.data ? JSON.stringify(n.data) : null
        }));

        const created = await knex('notifications')
            .insert(notificationRecords)
            .returning('*');

        return created.map(n => new Notification(n));
    }

    /**
     * Get notifications for a user
     */
    async findByUserId(userId, options = {}) {
        const { page = 1, limit = 20, isRead, type } = options;
        const offset = (page - 1) * limit;

        let query = knex('notifications')
            .where({ user_id: userId })
            .orderBy('created_at', 'desc');

        if (typeof isRead === 'boolean') {
            query = query.where({ is_read: isRead });
        }

        if (type) {
            query = query.where({ type });
        }

        const notifications = await query.limit(limit).offset(offset);
        const [{ count }] = await knex('notifications')
            .where({ user_id: userId })
            .modify(qb => {
                if (typeof isRead === 'boolean') qb.where({ is_read: isRead });
                if (type) qb.where({ type });
            })
            .count('* as count');

        return {
            notifications: notifications.map(n => new Notification(n)),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(count),
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId) {
        const [{ count }] = await knex('notifications')
            .where({ user_id: userId, is_read: false })
            .count('* as count');

        return parseInt(count);
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        const [notification] = await knex('notifications')
            .where({ id: notificationId, user_id: userId })
            .update({
                is_read: true,
                read_at: knex.fn.now()
            })
            .returning('*');

        return notification ? new Notification(notification) : null;
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        const count = await knex('notifications')
            .where({ user_id: userId, is_read: false })
            .update({
                is_read: true,
                read_at: knex.fn.now()
            });

        return count;
    }

    /**
     * Mark notification as unread
     */
    async markAsUnread(notificationId, userId) {
        const [notification] = await knex('notifications')
            .where({ id: notificationId, user_id: userId })
            .update({
                is_read: false,
                read_at: null
            })
            .returning('*');

        return notification ? new Notification(notification) : null;
    }

    /**
     * Delete a notification
     */
    async delete(notificationId, userId) {
        const count = await knex('notifications')
            .where({ id: notificationId, user_id: userId })
            .delete();

        return count > 0;
    }

    /**
     * Delete all notifications for a user
     */
    async deleteAll(userId) {
        const count = await knex('notifications')
            .where({ user_id: userId })
            .delete();

        return count;
    }

    /**
     * Get notification by ID
     */
    async findById(notificationId, userId) {
        const notification = await knex('notifications')
            .where({ id: notificationId, user_id: userId })
            .first();

        return notification ? new Notification(notification) : null;
    }
}

module.exports = new NotificationRepository();
