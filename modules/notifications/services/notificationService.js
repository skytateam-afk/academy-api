/**
 * Notification Service
 * Handles notification creation for various user actions
 */

const notificationRepository = require('../repositories/notificationRepository');
const logger = require('../../../config/winston');

class NotificationService {
    /**
     * Notification types
     */
    static TYPES = {
        // Authentication
        WELCOME: 'welcome',
        ACCOUNT_CREATED: 'account_created',
        PASSWORD_CHANGED: 'password_changed',
        
        // Course related
        COURSE_CREATED: 'course_created',
        COURSE_ENROLLED: 'course_enrolled',
        COURSE_PUBLISHED: 'course_published',
        COURSE_UPDATED: 'course_updated',
        COURSE_DELETED: 'course_deleted',
        NEW_LESSON_ADDED: 'new_lesson_added',
        
        // Lesson related
        LESSON_CREATED: 'lesson_created',
        LESSON_UPDATED: 'lesson_updated',
        LESSON_COMPLETED: 'lesson_completed',
        LESSON_PUBLISHED: 'lesson_published',
        LESSON_DELETED: 'lesson_deleted',
        MODULE_ADDED: 'module_added',
        ATTACHMENT_ADDED: 'attachment_added',
        
        // Library related
        LIBRARY_ITEM_ADDED: 'library_item_added',
        BOOK_BORROWED: 'book_borrowed',
        BOOK_RETURNED: 'book_returned',
        BOOK_RESERVED: 'book_reserved',
        BOOK_AVAILABLE: 'book_available',
        BOOK_OVERDUE: 'book_overdue',
        
        // Payment related
        PAYMENT_SUCCESSFUL: 'payment_successful',
        PAYMENT_FAILED: 'payment_failed',
        REFUND_PROCESSED: 'refund_processed',
        
        // User management
        ROLE_CHANGED: 'role_changed',
        PERMISSION_GRANTED: 'permission_granted',
        ACCOUNT_STATUS_CHANGED: 'account_status_changed',
        PROFILE_UPDATED: 'profile_updated',
        
        // Announcements & Promotions
        NEW_ANNOUNCEMENT: 'new_announcement',
        NEW_PROMOTION: 'new_promotion',
        
        // Pathway related
        PATHWAY_CREATED: 'pathway_created',
        PATHWAY_PUBLISHED: 'pathway_published',
        COURSE_ADDED_TO_PATHWAY: 'course_added_to_pathway',
        
        // General
        SYSTEM_ANNOUNCEMENT: 'system_announcement'
    };

    /**
     * Create a notification
     */
    async createNotification(userId, type, title, message, data = null) {
        try {
            const notification = await notificationRepository.create({
                userId,
                type,
                title,
                message,
                data
            });

            logger.info('Notification created', {
                userId,
                type,
                notificationId: notification.id
            });

            return notification;
        } catch (error) {
            logger.error('Failed to create notification', {
                userId,
                type,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Send welcome notification to new user
     */
    async sendWelcomeNotification(userId, username) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.WELCOME,
            'Welcome to Skyta Academy!',
            `Hi ${username}! Welcome to our learning platform. Start exploring courses and begin your learning journey.`,
            { username }
        );
    }

    /**
     * Notify user of successful course enrollment
     */
    async sendCourseEnrollmentNotification(userId, courseId, courseTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.COURSE_ENROLLED,
            'Successfully Enrolled!',
            `You have been enrolled in "${courseTitle}". Start learning now!`,
            { courseId, courseTitle }
        );
    }

    /**
     * Notify user of successful payment
     */
    async sendPaymentSuccessNotification(userId, courseTitle, amount, currency) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.PAYMENT_SUCCESSFUL,
            'Payment Successful',
            `Your payment of ${currency} ${amount} for "${courseTitle}" was successful. You can now access the course.`,
            { courseTitle, amount, currency }
        );
    }

    /**
     * Notify user of failed payment
     */
    async sendPaymentFailedNotification(userId, courseTitle, reason) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.PAYMENT_FAILED,
            'Payment Failed',
            `Your payment for "${courseTitle}" failed. ${reason || 'Please try again.'}`,
            { courseTitle, reason }
        );
    }

    /**
     * Notify user of refund
     */
    async sendRefundNotification(userId, courseTitle, amount, currency) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.REFUND_PROCESSED,
            'Refund Processed',
            `Your refund of ${currency} ${amount} for "${courseTitle}" has been processed.`,
            { courseTitle, amount, currency }
        );
    }

    /**
     * Notify user when their role changes
     */
    async sendRoleChangedNotification(userId, newRole) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.ROLE_CHANGED,
            'Role Updated',
            `Your role has been updated to "${newRole}". You now have access to new features.`,
            { newRole }
        );
    }

    /**
     * Notify user when permission is granted
     */
    async sendPermissionGrantedNotification(userId, permissionName) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.PERMISSION_GRANTED,
            'New Permission Granted',
            `You have been granted the "${permissionName}" permission.`,
            { permissionName }
        );
    }

    /**
     * Notify user when account status changes
     */
    async sendAccountStatusNotification(userId, isActive) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.ACCOUNT_STATUS_CHANGED,
            isActive ? 'Account Activated' : 'Account Deactivated',
            isActive 
                ? 'Your account has been activated. You can now access the platform.'
                : 'Your account has been deactivated. Please contact support if you believe this is an error.',
            { isActive }
        );
    }

    /**
     * Notify user when password is changed
     */
    async sendPasswordChangedNotification(userId) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.PASSWORD_CHANGED,
            'Password Changed',
            'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
            {}
        );
    }

    /**
     * Notify instructor when new student enrolls in their course
     */
    async sendNewEnrollmentNotification(instructorId, courseTitle, studentName) {
        return this.createNotification(
            instructorId,
            this.constructor.TYPES.COURSE_ENROLLED,
            'New Student Enrolled',
            `${studentName} has enrolled in your course "${courseTitle}".`,
            { courseTitle, studentName }
        );
    }

    /**
     * Notify students when a new lesson is added to their enrolled course
     */
    async sendNewLessonNotification(userId, courseTitle, lessonTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.NEW_LESSON_ADDED,
            'New Lesson Available',
            `A new lesson "${lessonTitle}" has been added to "${courseTitle}".`,
            { courseTitle, lessonTitle }
        );
    }

    /**
     * Notify user when they complete a lesson
     */
    async sendLessonCompletedNotification(userId, lessonTitle, courseTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.LESSON_COMPLETED,
            'Lesson Completed!',
            `Congratulations! You've completed "${lessonTitle}" in "${courseTitle}".`,
            { lessonTitle, courseTitle }
        );
    }

    /**
     * Notify enrolled students when course is updated
     */
    async sendCourseUpdatedNotification(userId, courseTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.COURSE_UPDATED,
            'Course Updated',
            `The course "${courseTitle}" has been updated with new content.`,
            { courseTitle }
        );
    }

    // ==================== COURSE NOTIFICATIONS ====================
    
    /**
     * Notify instructor when course is created
     */
    async sendCourseCreatedNotification(userId, courseTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.COURSE_CREATED,
            'Course Created Successfully',
            `Your course "${courseTitle}" has been created. You can now add lessons and publish it.`,
            { courseTitle }
        );
    }

    /**
     * Notify instructor when course is published
     */
    async sendCoursePublishedNotification(userId, courseTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.COURSE_PUBLISHED,
            'Course Published',
            `Your course "${courseTitle}" is now live and available to students!`,
            { courseTitle }
        );
    }

    /**
     * Notify instructor when course is deleted
     */
    async sendCourseDeletedNotification(userId, courseTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.COURSE_DELETED,
            'Course Deleted',
            `Your course "${courseTitle}" has been deleted.`,
            { courseTitle }
        );
    }

    // ==================== LESSON NOTIFICATIONS ====================

    /**
     * Notify instructor when lesson is created
     */
    async sendLessonCreatedNotification(userId, lessonTitle, courseTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.LESSON_CREATED,
            'Lesson Created',
            `New lesson "${lessonTitle}" has been added to "${courseTitle}".`,
            { lessonTitle, courseTitle }
        );
    }

    /**
     * Notify instructor when lesson is updated
     */
    async sendLessonUpdatedNotification(userId, lessonTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.LESSON_UPDATED,
            'Lesson Updated',
            `Lesson "${lessonTitle}" has been updated successfully.`,
            { lessonTitle }
        );
    }

    /**
     * Notify instructor when lesson is published
     */
    async sendLessonPublishedNotification(userId, lessonTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.LESSON_PUBLISHED,
            'Lesson Published',
            `Lesson "${lessonTitle}" is now available to students.`,
            { lessonTitle }
        );
    }

    /**
     * Notify instructor when module is added
     */
    async sendModuleAddedNotification(userId, moduleTitle, lessonTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.MODULE_ADDED,
            'Module Added',
            `Module "${moduleTitle}" has been added to "${lessonTitle}".`,
            { moduleTitle, lessonTitle }
        );
    }

    /**
     * Notify instructor when attachment is added
     */
    async sendAttachmentAddedNotification(userId, attachmentTitle, lessonTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.ATTACHMENT_ADDED,
            'Attachment Added',
            `Attachment "${attachmentTitle}" has been added to "${lessonTitle}".`,
            { attachmentTitle, lessonTitle }
        );
    }

    // ==================== LIBRARY NOTIFICATIONS ====================

    /**
     * Notify user when library item is added
     */
    async sendLibraryItemAddedNotification(userId, itemTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.LIBRARY_ITEM_ADDED,
            'New Library Item',
            `"${itemTitle}" is now available in the library.`,
            { itemTitle }
        );
    }

    /**
     * Notify user when book is borrowed
     */
    async sendBookBorrowedNotification(userId, bookTitle, dueDate) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.BOOK_BORROWED,
            'Book Borrowed Successfully',
            `You have borrowed "${bookTitle}". Please return it by ${new Date(dueDate).toLocaleDateString()}.`,
            { bookTitle, dueDate }
        );
    }

    /**
     * Notify user when book is returned
     */
    async sendBookReturnedNotification(userId, bookTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.BOOK_RETURNED,
            'Book Returned',
            `You have successfully returned "${bookTitle}". Thank you!`,
            { bookTitle }
        );
    }

    /**
     * Notify user when book is reserved
     */
    async sendBookReservedNotification(userId, bookTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.BOOK_RESERVED,
            'Book Reserved',
            `You have reserved "${bookTitle}". We'll notify you when it becomes available.`,
            { bookTitle }
        );
    }

    /**
     * Notify user when reserved book becomes available
     */
    async sendBookAvailableNotification(userId, bookTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.BOOK_AVAILABLE,
            'Reserved Book Available',
            `Your reserved book "${bookTitle}" is now available for borrowing!`,
            { bookTitle }
        );
    }

    /**
     * Notify user when book is overdue
     */
    async sendBookOverdueNotification(userId, bookTitle, daysOverdue) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.BOOK_OVERDUE,
            'Book Overdue',
            `"${bookTitle}" is ${daysOverdue} day(s) overdue. Please return it as soon as possible.`,
            { bookTitle, daysOverdue }
        );
    }

    // ==================== USER MANAGEMENT NOTIFICATIONS ====================

    /**
     * Notify user when profile is updated
     */
    async sendProfileUpdatedNotification(userId) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.PROFILE_UPDATED,
            'Profile Updated',
            'Your profile has been updated successfully.',
            {}
        );
    }

    // ==================== ANNOUNCEMENT & PROMOTION NOTIFICATIONS ====================

    /**
     * Notify users of new announcement
     */
    async sendNewAnnouncementNotification(userId, announcementTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.NEW_ANNOUNCEMENT,
            'New Announcement',
            `New announcement: ${announcementTitle}`,
            { announcementTitle }
        );
    }

    /**
     * Notify users of new promotion
     */
    async sendNewPromotionNotification(userId, promotionTitle, discountPercent) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.NEW_PROMOTION,
            'Special Promotion!',
            `${promotionTitle} - ${discountPercent}% off! Check it out now.`,
            { promotionTitle, discountPercent }
        );
    }

    // ==================== PATHWAY NOTIFICATIONS ====================

    /**
     * Notify user when pathway is created
     */
    async sendPathwayCreatedNotification(userId, pathwayTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.PATHWAY_CREATED,
            'Learning Pathway Created',
            `Your learning pathway "${pathwayTitle}" has been created successfully.`,
            { pathwayTitle }
        );
    }

    /**
     * Notify user when pathway is published
     */
    async sendPathwayPublishedNotification(userId, pathwayTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.PATHWAY_PUBLISHED,
            'Learning Pathway Published',
            `Your learning pathway "${pathwayTitle}" is now available to students!`,
            { pathwayTitle }
        );
    }

    /**
     * Notify user when course is added to pathway
     */
    async sendCourseAddedToPathwayNotification(userId, courseTitle, pathwayTitle) {
        return this.createNotification(
            userId,
            this.constructor.TYPES.COURSE_ADDED_TO_PATHWAY,
            'Course Added to Pathway',
            `"${courseTitle}" has been added to the learning pathway "${pathwayTitle}".`,
            { courseTitle, pathwayTitle }
        );
    }

    // ==================== BATCH NOTIFICATIONS ====================

    /**
     * Send notifications to multiple users
     */
    async sendBatchNotifications(userIds, type, title, message, data = null) {
        try {
            const notifications = await Promise.allSettled(
                userIds.map(userId => this.createNotification(userId, type, title, message, data))
            );

            const successful = notifications.filter(n => n.status === 'fulfilled').length;
            const failed = notifications.filter(n => n.status === 'rejected').length;

            logger.info('Batch notifications sent', {
                total: userIds.length,
                successful,
                failed,
                type
            });

            return { successful, failed, total: userIds.length };
        } catch (error) {
            logger.error('Failed to send batch notifications', {
                error: error.message,
                type
            });
            throw error;
        }
    }

    /**
     * Send announcement notification to multiple users based on filters
     */
    async sendBatchAnnouncementNotification(announcementTitle, announcementId, userFilters = {}) {
        try {
            const db = require('../../../config/database');
            
            // Build query based on filters
            let query = db('users').select('id').where('is_active', true);
            
            if (userFilters.role && Array.isArray(userFilters.role) && userFilters.role.length > 0) {
                query = query.whereIn('role', userFilters.role);
            }
            
            const users = await query;
            const userIds = users.map(u => u.id);
            
            if (userIds.length === 0) {
                logger.info('No users found matching filters for announcement notification');
                return { successful: 0, failed: 0, total: 0 };
            }
            
            return await this.sendBatchNotifications(
                userIds,
                this.constructor.TYPES.NEW_ANNOUNCEMENT,
                'New Announcement',
                `New announcement: ${announcementTitle}`,
                { announcementTitle, announcementId }
            );
        } catch (error) {
            logger.error('Failed to send batch announcement notifications', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Send promotion notification to multiple users based on filters
     */
    async sendBatchPromotionNotification(promotionTitle, promotionId, userFilters = {}) {
        try {
            const db = require('../../../config/database');
            
            // Build query based on filters
            let query = db('users').select('id', 'created_at').where('is_active', true);
            
            if (userFilters.role && Array.isArray(userFilters.role) && userFilters.role.length > 0) {
                query = query.whereIn('role', userFilters.role);
            }
            
            let users = await query;
            
            // Filter for new users if specified
            if (userFilters.is_new_user) {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                users = users.filter(u => new Date(u.created_at) >= sevenDaysAgo);
            }
            
            const userIds = users.map(u => u.id);
            
            if (userIds.length === 0) {
                logger.info('No users found matching filters for promotion notification');
                return { successful: 0, failed: 0, total: 0 };
            }
            
            return await this.sendBatchNotifications(
                userIds,
                this.constructor.TYPES.NEW_PROMOTION,
                'Special Promotion!',
                `${promotionTitle} - Check it out now!`,
                { promotionTitle, promotionId }
            );
        } catch (error) {
            logger.error('Failed to send batch promotion notifications', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = new NotificationService();
