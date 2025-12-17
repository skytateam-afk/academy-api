/**
 * Lesson Controller
 * Handles HTTP requests for lesson management
 */

const lessonRepository = require('../repositories/lessonRepository');
const attachmentRepository = require('../repositories/attachmentRepository');
const courseRepository = require('../../course_management/repositories/courseRepository');
const logger = require('../../../config/winston');
const slugify = require('slugify');

class LessonController {
  /**
   * Helper method to check if user is enrolled in a course
   */
  async checkUserEnrollment(userId, courseId) {
    try {
      const knex = require('../../../config/knex');
      const enrollment = await knex('enrollments')
        .where({
          course_id: courseId,
          user_id: userId
        })
        .first();

      return {
        isEnrolled: !!enrollment,
        enrollment: enrollment
      };
    } catch (error) {
      logger.error('Error checking user enrollment:', { userId, courseId, error: error.message });
      return { isEnrolled: false, enrollment: null };
    }
  }

  /**
   * Get all lessons for a course
   * GET /api/courses/:courseId/lessons
   */
  async getLessonsByCourse(req, res) {
    try {
      const { courseId } = req.params;
      const { page, limit, includeUnpublished } = req.query;

      // Check if course exists
      const course = await courseRepository.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Check permissions for unpublished lessons
      const canViewUnpublished = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === course.instructor_id
      );

      // Check if user is enrolled in the course
      let isEnrolled = false;
      if (req.user?.userId) {
        const enrollmentCheck = await this.checkUserEnrollment(req.user.userId, courseId);
        isEnrolled = enrollmentCheck.isEnrolled;
      }

      const result = await lessonRepository.findByCourse(courseId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        includeUnpublished: includeUnpublished === 'true' && canViewUnpublished
      });

      // Filter lesson content based on enrollment status
      let lessons = result.lessons;
      console.log(lessons, `User enrolled: ${isEnrolled}, Can view unpublished: ${canViewUnpublished}`);
      if (!isEnrolled && !canViewUnpublished) {
        // For non-enrolled users, only show basic lesson info, hide asset URLs
        console.log(`[Content Filter] Filtering ${lessons.length} lessons for non-enrolled user`);
        lessons = lessons.map(lesson => {
          console.log(`[Content Filter] Lesson "${lesson.title}": hiding sensitive content for non-enrolled user`);
          return {
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug,
            description: lesson.description,
            display_order: lesson.display_order,
            is_published: lesson.is_published,
            duration_minutes: lesson.duration_minutes,
            is_preview: lesson.is_preview,
            course_id: lesson.course_id,
            created_at: lesson.created_at,
            updated_at: lesson.updated_at,
            // Hide metadata and content that contains asset URLs
            metadata: null,
            content_data: null,
            transcript: null,
            // Show only non-protected attachments
            attachments: lesson.attachments ? lesson.attachments.filter(att => {
              const showAttachment = att.is_preview === true || att.content_type === 'text';
              console.log(`[Content Filter] Lesson "${lesson.title}": attachment "${att.title}" (${att.content_type}): ${showAttachment ? 'shown' : 'hidden'}`);
              return showAttachment;
            }) : []
          };
        });
      } else {
        console.log(`[Content Filter] User enrolled or admin: showing full lesson content for ${lessons.length} lessons`);
      }

      res.json({
        success: true,
        data: lessons,
        pagination: result.pagination,
        isEnrolled: isEnrolled
      });
    } catch (error) {
      logger.error('Error fetching lessons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lessons',
        error: error.message
      });
    }
  }

  /**
   * Get a single lesson by ID
   * GET /api/lessons/:id
   */
  async getLessonById(req, res) {
    try {
      const { id } = req.params;
      const { includeAttachments } = req.query;

      const lesson = await lessonRepository.findByIdWithCourse(id);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Check if user can view unpublished lesson
      if (!lesson.is_published) {
        const canView = req.user && (
          req.user.role === 'super_admin' ||
          req.user.role === 'admin' ||
          req.user.userId === lesson.instructor_id
        );

        if (!canView) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to unpublished lesson'
          });
        }
      }

      // Include attachments if requested
      if (includeAttachments === 'true') {
        lesson.attachments = await attachmentRepository.findByLesson(id);
      }

      res.json({
        success: true,
        data: lesson
      });
    } catch (error) {
      logger.error('Error fetching lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson',
        error: error.message
      });
    }
  }

  /**
   * Create a new lesson
   * POST /api/courses/:courseId/lessons
   */
  async createLesson(req, res) {
    try {
      const { courseId } = req.params;
      const lessonData = req.body;

      // Check if course exists
      const course = await courseRepository.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Check if user is the instructor or admin
      const canCreate = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === course.instructor_id
      );

      if (!canCreate) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can create lessons'
        });
      }

      // Generate slug if not provided
      if (!lessonData.slug) {
        let baseSlug = slugify(lessonData.title, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;

        while (await lessonRepository.slugExists(courseId, slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        lessonData.slug = slug;
      } else {
        // Check if provided slug exists
        const slugExists = await lessonRepository.slugExists(courseId, lessonData.slug);
        if (slugExists) {
          return res.status(400).json({
            success: false,
            message: 'Lesson slug already exists for this course'
          });
        }
      }

      // Create lesson
      const lesson = await lessonRepository.create({
        ...lessonData,
        course_id: courseId
      });

      logger.info(`Lesson created: ${lesson.id} by user ${req.user.userId}`);

      res.status(201).json({
        success: true,
        message: 'Lesson created successfully',
        data: lesson
      });
    } catch (error) {
      logger.error('Error creating lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create lesson',
        error: error.message
      });
    }
  }

  /**
   * Update a lesson
   * PUT /api/lessons/:id
   */
  async updateLesson(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const lesson = await lessonRepository.findByIdWithCourse(id);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Check permissions
      const canUpdate = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === lesson.instructor_id
      );

      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can update lessons'
        });
      }

      // Check slug uniqueness if being updated
      if (updateData.slug && updateData.slug !== lesson.slug) {
        const slugExists = await lessonRepository.slugExists(
          lesson.course_id,
          updateData.slug,
          id
        );
        if (slugExists) {
          return res.status(400).json({
            success: false,
            message: 'Lesson slug already exists for this course'
          });
        }
      }

      const updatedLesson = await lessonRepository.update(id, updateData);

      logger.info(`Lesson updated: ${id} by user ${req.user.userId}`);

      res.json({
        success: true,
        message: 'Lesson updated successfully',
        data: updatedLesson
      });
    } catch (error) {
      logger.error('Error updating lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update lesson',
        error: error.message
      });
    }
  }

  /**
   * Delete a lesson
   * DELETE /api/lessons/:id
   */
  async deleteLesson(req, res) {
    try {
      const { id } = req.params;

      const lesson = await lessonRepository.findByIdWithCourse(id);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Check permissions
      const canDelete = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === lesson.instructor_id
      );

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can delete lessons'
        });
      }

      await lessonRepository.delete(id);

      logger.info(`Lesson deleted: ${id} by user ${req.user.userId}`);

      res.json({
        success: true,
        message: 'Lesson deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete lesson',
        error: error.message
      });
    }
  }

  /**
   * Publish/unpublish a lesson
   * PATCH /api/lessons/:id/publish
   */
  async togglePublishStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_published } = req.body;

      const lesson = await lessonRepository.findByIdWithCourse(id);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Check permissions
      const canPublish = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === lesson.instructor_id
      );

      if (!canPublish) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can publish lessons'
        });
      }

      const updatedLesson = await lessonRepository.updateStatus(id, is_published);

      logger.info(`Lesson ${is_published ? 'published' : 'unpublished'}: ${id} by user ${req.user.userId}`);

      res.json({
        success: true,
        message: `Lesson ${is_published ? 'published' : 'unpublished'} successfully`,
        data: updatedLesson
      });
    } catch (error) {
      logger.error('Error updating lesson status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update lesson status',
        error: error.message
      });
    }
  }

  /**
   * Reorder lessons in a course
   * PUT /api/courses/:courseId/lessons/reorder
   */
  async reorderLessons(req, res) {
    try {
      const { courseId } = req.params;
      const { lessons } = req.body; // Array of { id, display_order }

      if (!Array.isArray(lessons)) {
        return res.status(400).json({
          success: false,
          message: 'Lessons must be an array'
        });
      }

      const course = await courseRepository.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Check permissions
      const canReorder = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === course.instructor_id
      );

      if (!canReorder) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can reorder lessons'
        });
      }

      await lessonRepository.reorder(courseId, lessons);

      logger.info(`Lessons reordered for course ${courseId} by user ${req.user.userId}`);

      res.json({
        success: true,
        message: 'Lessons reordered successfully'
      });
    } catch (error) {
      logger.error('Error reordering lessons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reorder lessons',
        error: error.message
      });
    }
  }

  /**
   * Duplicate a lesson
   * POST /api/lessons/:id/duplicate
   */
  async duplicateLesson(req, res) {
    try {
      const { id } = req.params;
      const { title } = req.body;

      const lesson = await lessonRepository.findByIdWithCourse(id);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Check permissions
      const canDuplicate = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === lesson.instructor_id
      );

      if (!canDuplicate) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can duplicate lessons'
        });
      }

      const duplicatedLesson = await lessonRepository.duplicate(id, title);

      // Note: Modules and their attachments are not duplicated automatically
      // This is intentional as module content may need review before duplication

      logger.info(`Lesson duplicated: ${id} -> ${duplicatedLesson.id} by user ${req.user.userId}`);

      res.status(201).json({
        success: true,
        message: 'Lesson duplicated successfully',
        data: duplicatedLesson
      });
    } catch (error) {
      logger.error('Error duplicating lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to duplicate lesson',
        error: error.message
      });
    }
  }

  /**
   * Get lesson statistics
   * GET /api/lessons/:id/statistics
   */
  async getLessonStatistics(req, res) {
    try {
      const { id } = req.params;

      const lesson = await lessonRepository.findByIdWithCourse(id);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      // Check permissions
      const canViewStats = req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.userId === lesson.instructor_id
      );

      if (!canViewStats) {
        return res.status(403).json({
          success: false,
          message: 'Only course instructor or admin can view lesson statistics'
        });
      }

      const statistics = await lessonRepository.getStatistics(id);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Error fetching lesson statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson statistics',
        error: error.message
      });
    }
  }

  /**
   * Search lessons in a course
   * GET /api/courses/:courseId/lessons/search
   */
  async searchLessons(req, res) {
    try {
      const { courseId } = req.params;
      const { q, page, limit } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const course = await courseRepository.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const result = await lessonRepository.search(courseId, q, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });

      res.json({
        success: true,
        data: result.lessons,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error searching lessons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search lessons',
        error: error.message
      });
    }
  }

  /**
   * Get lessons with user progress
   * GET /api/courses/:courseId/lessons/progress
   */
  async getLessonsWithProgress(req, res) {
    try {
      const { courseId } = req.params;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const course = await courseRepository.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const lessons = await lessonRepository.findWithProgress(courseId, req.user.userId);

      res.json({
        success: true,
        data: lessons
      });
    } catch (error) {
      logger.error('Error fetching lessons with progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lessons with progress',
        error: error.message
      });
    }
  }
}

module.exports = new LessonController();
