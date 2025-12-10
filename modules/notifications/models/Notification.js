/**
 * Notification Model
 * Represents a user notification
 */

class Notification {
    constructor(data) {
        this.id = data.id;
        this.userId = data.user_id;
        this.type = data.type;
        this.title = data.title;
        this.message = data.message;
        this.data = data.data;
        this.isRead = data.is_read;
        this.readAt = data.read_at;
        this.createdAt = data.created_at;
    }

    /**
     * Convert to JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            type: this.type,
            title: this.title,
            message: this.message,
            data: this.data,
            isRead: this.isRead,
            readAt: this.readAt,
            createdAt: this.createdAt
        };
    }
}

module.exports = Notification;
