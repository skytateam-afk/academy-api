/**
 * Attachment Controller
 * Handles HTTP requests for lesson attachment management
 */

const attachmentRepository = require('../repositories/attachmentRepository');
const lessonRepository = require('../repositories/lessonRepository');
const logger = require('../../../config/winston');
const path = require('path');
const notificationService = require('../../notifications/services/notificationService');

class AttachmentController {
  /**
   * Get all attachments for a lesson
   * GET /api/lessons/:lessonId/attachments
   */
  async getAttachmentsByLesson(req, res) {
    try {
      const { lessonId } = req.params;

      // Check if lesson exists
      const lesson = await lessonRepository.findByIdWithCourse(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      const attachments = await attachmentRepository.findByLesson(lessonId);

      res.json({
        success: true,
        data: attachments
      });
    } catch (error) {
      logger.error('Error fetching attachments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attachments',
        error: error.message
      });
    }
  }

  /**
   * Get a single attachment by ID
   * GET /api/attachments/:id
   */
  async getAttachmentById(req, res) {
    try {
      const { id } = req.params;

      const attachment = await attachmentRepository.findByIdWithLesson(id);
      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }

      res.json({
        success: true,
        data: attachment
      });
    } catch (error) {
      logger.error('Error fetching attachment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attachment',
        error: error.message
      });
    }
  }

  /**
   * Create a new attachment
   * POST /api/lessons/:lessonId/attachments
   */
  async createAttachment(req, res) {
    try {
      const { lessonId } = req.params;
      const attachmentData = req.body;

      // Check if lesson exists
      const lesson = await lessonRepository.findByIdWithCourse(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Check if user is the instructor or admin
      const canCreate = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === lesson.instructor_id
      );

      if (!canCreate) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can create attachments'
        });
      }

      // Create attachment
      const attachment = await attachmentRepository.create({
        ...attachmentData,
        lesson_id: lessonId
      });

      logger.info(`Attachment created: ${attachment.id} for lesson ${lessonId} by user ${req.user.userId}`);

      res.status(201).json({
        success: true,
        message: 'Attachment created successfully',
        data: attachment
      });
    } catch (error) {
      logger.error('Error creating attachment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create attachment',
        error: error.message
      });
    }
  }

  /**
   * Bulk create attachments
   * POST /api/lessons/:lessonId/attachments/bulk
   */
  async bulkCreateAttachments(req, res) {
    try {
      const { lessonId } = req.params;
      const { attachments } = req.body;

      if (!Array.isArray(attachments)) {
        return res.status(400).json({
          success: false,
          message: 'Attachments must be an array'
        });
      }

      // Check if lesson exists
      const lesson = await lessonRepository.findByIdWithCourse(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Check permissions
      const canCreate = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === lesson.instructor_id
      );

      if (!canCreate) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can create attachments'
        });
      }

      const createdAttachments = await attachmentRepository.bulkCreate(lessonId, attachments);

      logger.info(`${createdAttachments.length} attachments created for lesson ${lessonId} by user ${req.user.userId}`);

      res.status(201).json({
        success: true,
        message: 'Attachments created successfully',
        data: createdAttachments
      });
    } catch (error) {
      logger.error('Error bulk creating attachments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create attachments',
        error: error.message
      });
    }
  }

  /**
   * Update an attachment
   * PUT /api/attachments/:id
   */
  async updateAttachment(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const attachment = await attachmentRepository.findByIdWithLesson(id);
      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }

      // Get lesson to check permissions
      const lesson = await lessonRepository.findByIdWithCourse(attachment.lesson_id);
      
      // Check permissions
      const canUpdate = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === lesson.instructor_id
      );

      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can update attachments'
        });
      }

      const updatedAttachment = await attachmentRepository.update(id, updateData);

      logger.info(`Attachment updated: ${id} by user ${req.user.userId}`);

      res.json({
        success: true,
        message: 'Attachment updated successfully',
        data: updatedAttachment
      });
    } catch (error) {
      logger.error('Error updating attachment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update attachment',
        error: error.message
      });
    }
  }

  /**
   * Delete an attachment
   * DELETE /api/attachments/:id
   */
  async deleteAttachment(req, res) {
    try {
      const { id } = req.params;

      const attachment = await attachmentRepository.findByIdWithLesson(id);
      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }

      // Get lesson to check permissions
      const lesson = await lessonRepository.findByIdWithCourse(attachment.lesson_id);

      // Check permissions
      const canDelete = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === lesson.instructor_id
      );

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can delete attachments'
        });
      }

      await attachmentRepository.delete(id);

      logger.info(`Attachment deleted: ${id} by user ${req.user.userId}`);

      res.json({
        success: true,
        message: 'Attachment deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting attachment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete attachment',
        error: error.message
      });
    }
  }

  /**
   * Reorder attachments for a lesson
   * PUT /api/lessons/:lessonId/attachments/reorder
   */
  async reorderAttachments(req, res) {
    try {
      const { lessonId } = req.params;
      const { attachments } = req.body; // Array of { id, display_order }

      if (!Array.isArray(attachments)) {
        return res.status(400).json({
          success: false,
          message: 'Attachments must be an array'
        });
      }

      const lesson = await lessonRepository.findByIdWithCourse(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Check permissions
      const canReorder = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === lesson.instructor_id
      );

      if (!canReorder) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can reorder attachments'
        });
      }

      await attachmentRepository.reorder(lessonId, attachments);

      logger.info(`Attachments reordered for lesson ${lessonId} by user ${req.user.userId}`);

      res.json({
        success: true,
        message: 'Attachments reordered successfully'
      });
    } catch (error) {
      logger.error('Error reordering attachments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reorder attachments',
        error: error.message
      });
    }
  }

  /**
   * Get downloadable attachments for a lesson
   * GET /api/lessons/:lessonId/attachments/downloadable
   */
  async getDownloadableAttachments(req, res) {
    try {
      const { lessonId } = req.params;

      const lesson = await lessonRepository.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      const attachments = await attachmentRepository.findDownloadable(lessonId);

      res.json({
        success: true,
        data: attachments
      });
    } catch (error) {
      logger.error('Error fetching downloadable attachments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch downloadable attachments',
        error: error.message
      });
    }
  }

  /**
   * Toggle attachment downloadable status
   * PATCH /api/attachments/:id/downloadable
   */
  async toggleDownloadableStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_downloadable } = req.body;

      const attachment = await attachmentRepository.findByIdWithLesson(id);
      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }

      // Get lesson to check permissions
      const lesson = await lessonRepository.findByIdWithCourse(attachment.lesson_id);

      // Check permissions
      const canUpdate = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === lesson.instructor_id
      );

      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can update attachment settings'
        });
      }

      const updatedAttachment = await attachmentRepository.updateDownloadableStatus(id, is_downloadable);

      logger.info(`Attachment downloadable status updated: ${id} by user ${req.user.userId}`);

      res.json({
        success: true,
        message: 'Attachment downloadable status updated successfully',
        data: updatedAttachment
      });
    } catch (error) {
      logger.error('Error updating attachment downloadable status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update attachment downloadable status',
        error: error.message
      });
    }
  }

  /**
   * Get attachment statistics for a course
   * GET /api/courses/:courseId/attachments/statistics
   */
  async getCourseAttachmentStatistics(req, res) {
    try {
      const { courseId } = req.params;

      const statistics = await attachmentRepository.getCourseStatistics(courseId);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Error fetching attachment statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attachment statistics',
        error: error.message
      });
    }
  }

  /**
   * Upload attachment file
   * POST /api/lessons/:lessonId/attachments/upload
   */
  async uploadAttachment(req, res) {
    try {
      const { lessonId } = req.params;
      const { title, is_downloadable } = req.body;

      // Check if lesson exists
      const lesson = await lessonRepository.findByIdWithCourse(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Check permissions
      const canCreate = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === lesson.instructor_id
      );

      if (!canCreate) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can upload attachments'
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Import storage service
      const storageService = require('../../../services/storageService');

      // Upload to R2
      const uploadResult = await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'lesson-attachments',
        { lessonId, uploadedBy: req.user.userId }
      );

      // Create attachment record
      const attachment = await attachmentRepository.create({
        lesson_id: lessonId,
        title: title || req.file.originalname,
        file_url: uploadResult.fileUrl,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        is_downloadable: is_downloadable !== undefined ? is_downloadable === 'true' : true
      });

      logger.info(`Attachment file uploaded: ${attachment.id} for lesson ${lessonId} by user ${req.user.userId}`);

      // Send notification to instructor
      if (req.user && req.user.userId && lesson) {
        notificationService.sendAttachmentAddedNotification(
          req.user.userId,
          attachment.title,
          lesson.title
        ).catch(err => logger.error('Failed to send attachment added notification', { error: err.message }));
      }

      res.status(201).json({
        success: true,
        message: 'Attachment uploaded successfully',
        data: attachment
      });
    } catch (error) {
      logger.error('Error uploading attachment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload attachment',
        error: error.message
      });
    }
  }

  /**
   * Search attachments in a lesson
   * GET /api/lessons/:lessonId/attachments/search
   */
  async searchAttachments(req, res) {
    try {
      const { lessonId } = req.params;
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const lesson = await lessonRepository.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      const attachments = await attachmentRepository.search(lessonId, q);

      res.json({
        success: true,
        data: attachments
      });
    } catch (error) {
      logger.error('Error searching attachments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search attachments',
        error: error.message
      });
    }
  }
}

module.exports = new AttachmentController();
