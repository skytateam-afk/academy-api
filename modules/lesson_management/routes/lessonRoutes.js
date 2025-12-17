/**
 * Lesson Management Routes
 * Defines all routes for lesson and attachment management
 */

const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const attachmentController = require('../controllers/attachmentController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const uploadAttachment = require('../../../middleware/uploadAttachment');

// Aliases for consistency
const authenticate = authenticateToken;
const checkPermission = requirePermission;

// ============================================
// Lesson Routes
// ============================================

/**
 * @route   GET /api/courses/:courseId/lessons
 * @desc    Get all lessons for a course
 * @access  Public (published lessons) / Private (unpublished lessons)
 */
router.get(
  '/courses/:courseId/lessons',
  authenticate,
  lessonController.getLessonsByCourse
);

/**
 * @route   GET /api/courses/:courseId/lessons/search
 * @desc    Search lessons in a course
 * @access  Public
 */
router.get(
  '/courses/:courseId/lessons/search',
  authenticate,
  lessonController.searchLessons
);

/**
 * @route   GET /api/courses/:courseId/lessons/progress
 * @desc    Get lessons with user progress
 * @access  Private
 */
router.get(
  '/courses/:courseId/lessons/progress',
  authenticate,
  (req, res) => lessonController.getLessonsWithProgress(req, res)
);

/**
 * @route   POST /api/courses/:courseId/lessons
 * @desc    Create a new lesson
 * @access  Private (Instructor/Admin)
 */
router.post(
  '/courses/:courseId/lessons',
  authenticate,
  checkPermission('lesson.create'),
  lessonController.createLesson
);

/**
 * @route   PUT /api/courses/:courseId/lessons/reorder
 * @desc    Reorder lessons in a course
 * @access  Private (Instructor/Admin)
 */
router.put(
  '/courses/:courseId/lessons/reorder',
  authenticate,
  checkPermission('lesson.update'),
  lessonController.reorderLessons
);

/**
 * @route   GET /api/lessons/:id
 * @desc    Get a single lesson by ID
 * @access  Public (published) / Private (unpublished)
 */
router.get(
  '/lessons/:id',
  lessonController.getLessonById
);

/**
 * @route   PUT /api/lessons/:id
 * @desc    Update a lesson
 * @access  Private (Instructor/Admin)
 */
router.put(
  '/lessons/:id',
  authenticate,
  checkPermission('lesson.update'),
  lessonController.updateLesson
);

/**
 * @route   DELETE /api/lessons/:id
 * @desc    Delete a lesson
 * @access  Private (Instructor/Admin)
 */
router.delete(
  '/lessons/:id',
  authenticate,
  checkPermission('lesson.delete'),
  lessonController.deleteLesson
);

/**
 * @route   PATCH /api/lessons/:id/publish
 * @desc    Publish/unpublish a lesson
 * @access  Private (Instructor/Admin)
 */
router.patch(
  '/lessons/:id/publish',
  authenticate,
  checkPermission('lesson.update'),
  lessonController.togglePublishStatus
);

/**
 * @route   POST /api/lessons/:id/duplicate
 * @desc    Duplicate a lesson
 * @access  Private (Instructor/Admin)
 */
router.post(
  '/lessons/:id/duplicate',
  authenticate,
  checkPermission('lesson.create'),
  lessonController.duplicateLesson
);

/**
 * @route   GET /api/lessons/:id/statistics
 * @desc    Get lesson statistics
 * @access  Private (Instructor/Admin)
 */
router.get(
  '/lessons/:id/statistics',
  authenticate,
  checkPermission('lesson.read'),
  lessonController.getLessonStatistics
);

// ============================================
// Attachment Routes
// ============================================

/**
 * @route   GET /api/lessons/:lessonId/attachments
 * @desc    Get all attachments for a lesson
 * @access  Public
 */
router.get(
  '/lessons/:lessonId/attachments',
  attachmentController.getAttachmentsByLesson
);

/**
 * @route   GET /api/lessons/:lessonId/attachments/downloadable
 * @desc    Get downloadable attachments for a lesson
 * @access  Public
 */
router.get(
  '/lessons/:lessonId/attachments/downloadable',
  attachmentController.getDownloadableAttachments
);

/**
 * @route   GET /api/lessons/:lessonId/attachments/search
 * @desc    Search attachments in a lesson
 * @access  Public
 */
router.get(
  '/lessons/:lessonId/attachments/search',
  attachmentController.searchAttachments
);

/**
 * @route   POST /api/lessons/:lessonId/attachments/upload
 * @desc    Upload attachment file (PDF, MP3, etc.)
 * @access  Private (Instructor/Admin)
 */
router.post(
  '/lessons/:lessonId/attachments/upload',
  authenticate,
  checkPermission('lesson.update'),
  uploadAttachment.single('file'),
  attachmentController.uploadAttachment
);

/**
 * @route   POST /api/lessons/:lessonId/attachments
 * @desc    Create a new attachment (with URL or link)
 * @access  Private (Instructor/Admin)
 */
router.post(
  '/lessons/:lessonId/attachments',
  authenticate,
  checkPermission('lesson.update'),
  attachmentController.createAttachment
);

/**
 * @route   POST /api/lessons/:lessonId/attachments/bulk
 * @desc    Bulk create attachments
 * @access  Private (Instructor/Admin)
 */
router.post(
  '/lessons/:lessonId/attachments/bulk',
  authenticate,
  checkPermission('lesson.update'),
  attachmentController.bulkCreateAttachments
);

/**
 * @route   PUT /api/lessons/:lessonId/attachments/reorder
 * @desc    Reorder attachments for a lesson
 * @access  Private (Instructor/Admin)
 */
router.put(
  '/lessons/:lessonId/attachments/reorder',
  authenticate,
  checkPermission('lesson.update'),
  attachmentController.reorderAttachments
);

/**
 * @route   GET /api/attachments/:id
 * @desc    Get a single attachment by ID
 * @access  Public
 */
router.get(
  '/attachments/:id',
  attachmentController.getAttachmentById
);

/**
 * @route   PUT /api/attachments/:id
 * @desc    Update an attachment
 * @access  Private (Instructor/Admin)
 */
router.put(
  '/attachments/:id',
  authenticate,
  checkPermission('lesson.update'),
  attachmentController.updateAttachment
);

/**
 * @route   DELETE /api/attachments/:id
 * @desc    Delete an attachment
 * @access  Private (Instructor/Admin)
 */
router.delete(
  '/attachments/:id',
  authenticate,
  checkPermission('lesson.delete'),
  attachmentController.deleteAttachment
);

/**
 * @route   PATCH /api/attachments/:id/downloadable
 * @desc    Toggle attachment downloadable status
 * @access  Private (Instructor/Admin)
 */
router.patch(
  '/attachments/:id/downloadable',
  authenticate,
  checkPermission('lesson.update'),
  attachmentController.toggleDownloadableStatus
);

/**
 * @route   GET /api/courses/:courseId/attachments/statistics
 * @desc    Get attachment statistics for a course
 * @access  Private (Instructor/Admin)
 */
router.get(
  '/courses/:courseId/attachments/statistics',
  authenticate,
  checkPermission('lesson.read'),
  attachmentController.getCourseAttachmentStatistics
);

module.exports = router;
