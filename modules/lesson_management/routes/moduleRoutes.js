/**
 * Module Routes
 * Defines all routes for lesson module and module attachment management
 */

const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const moduleAttachmentController = require('../controllers/moduleAttachmentController');
const quizController = require('../controllers/quizController');
const progressController = require('../controllers/progressController');
const upload = require('../../../middleware/upload');
const uploadAttachment = require('../../../middleware/uploadAttachment');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { checkCourseEnrollment } = require('../../../middleware/checkEnrollment');

// ... existing imports ...

// Aliases for consistency
const authenticate = authenticateToken;
const checkPermission = requirePermission;

// ============================================
// Module Routes
// ============================================

/**
 * @route   GET /api/courses/:courseId/modules
 * @desc    Get all modules for a course (organized by lessons)
 * @access  Private - Requires authentication and course enrollment
 */
router.get(
  '/courses/:courseId/modules',
  authenticate,
  checkCourseEnrollment,
  moduleController.getModulesByCourse
);

/**
 * @route   GET /api/lessons/:lessonId/modules
 * @desc    Get all modules for a lesson
 * @access  Public (published modules) / Private (unpublished modules)
 */
router.get(
  '/lessons/:lessonId/modules',
  moduleController.getModulesByLesson
);

/**
 * @route   GET /api/lessons/:lessonId/modules/search
 * @desc    Search modules in a lesson
 * @access  Public
 */
router.get(
  '/lessons/:lessonId/modules/search',
  moduleController.searchModules
);

/**
 * @route   GET /api/lessons/:lessonId/modules/with-attachments
 * @desc    Get modules with their attachments
 * @access  Public
 */
router.get(
  '/lessons/:lessonId/modules/with-attachments',
  moduleController.getModulesWithAttachments
);

/**
 * @route   POST /api/lessons/:lessonId/modules
 * @desc    Create a new module
 * @access  Private (Instructor/Admin)
 */
router.post(
  '/lessons/:lessonId/modules',
  authenticate,
  checkPermission('lesson.create'),
  (req, res, next) => {
    // Dynamically choose middleware based on content type
    const uploadMiddleware = upload.fields([
      { name: 'video', maxCount: 1 },
      { name: 'attachment', maxCount: 1 }
    ]);
    uploadMiddleware(req, res, next);
  },
  moduleController.createModule
);

/**
 * @route   POST /api/lessons/:lessonId/modules/bulk
 * @desc    Bulk create modules
 * @access  Private (Instructor/Admin)
 */
router.post(
  '/lessons/:lessonId/modules/bulk',
  authenticate,
  checkPermission('lesson.create'),
  moduleController.bulkCreateModules
);

/**
 * @route   PUT /api/lessons/:lessonId/modules/reorder
 * @desc    Reorder modules in a lesson
 * @access  Private (Instructor/Admin)
 */
router.put(
  '/lessons/:lessonId/modules/reorder',
  authenticate,
  checkPermission('lesson.update'),
  moduleController.reorderModules
);

/**
 * @route   GET /api/modules/:id
 * @desc    Get a single module by ID
 * @access  Public (published) / Private (unpublished)
 */
router.get(
  '/modules/:id',
  moduleController.getModuleById
);

/**
 * @route   PUT /api/modules/:id
 * @desc    Update a module
 * @access  Private (Instructor/Admin)
 */
router.put(
  '/modules/:id',
  authenticate,
  checkPermission('lesson.update'),
  (req, res, next) => {
    // Dynamically choose middleware based on content type
    const uploadMiddleware = upload.fields([
      { name: 'video', maxCount: 1 },
      { name: 'attachment', maxCount: 1 }
    ]);
    uploadMiddleware(req, res, next);
  },
  moduleController.updateModule
);

/**
 * @route   DELETE /api/modules/:id
 * @desc    Delete a module
 * @access  Private (Instructor/Admin)
 */
router.delete(
  '/modules/:id',
  authenticate,
  checkPermission('lesson.delete'),
  moduleController.deleteModule
);

/**
 * @route   PATCH /api/modules/:id/publish
 * @desc    Publish/unpublish a module
 * @access  Private (Instructor/Admin)
 */
router.patch(
  '/modules/:id/publish',
  authenticate,
  checkPermission('lesson.update'),
  moduleController.togglePublishStatus
);

/**
 * @route   POST /api/modules/:id/duplicate
 * @desc    Duplicate a module
 * @access  Private (Instructor/Admin)
 */
router.post(
  '/modules/:id/duplicate',
  authenticate,
  checkPermission('lesson.create'),
  moduleController.duplicateModule
);

/**
 * @route   GET /api/modules/:id/statistics
 * @desc    Get module statistics
 * @access  Private (Instructor/Admin)
 */
router.get(
  '/modules/:id/statistics',
  authenticate,
  checkPermission('lesson.read'),
  moduleController.getModuleStatistics
);

/**
 * @route   GET /api/modules/:id/versions
 * @desc    Get module version history
 * @access  Private (Instructor/Admin)
 */
router.get(
  '/modules/:id/versions',
  authenticate,
  checkPermission('lesson.read'),
  moduleController.getModuleVersions
);

// ============================================
// Quiz Routes
// ============================================

/**
 * @route   POST /api/modules/:moduleId/submit-quiz
 * @desc    Submit quiz answers for validation
 * @access  Private - Requires enrollment
 */
router.post(
  '/modules/:moduleId/submit-quiz',
  authenticate,
  checkCourseEnrollment,
  quizController.submitQuiz
);//1

/**
 * @route   GET /api/modules/:moduleId/quiz-attempts
 * @desc    Get quiz attempts for a user
 * @access  Private - Requires enrollment
 */
router.get(
  '/modules/:moduleId/quiz-attempts',
  authenticate,
  checkCourseEnrollment,
  quizController.getQuizAttempts
);//2

// ============================================
// Progress Tracking Routes
// ============================================

/**
 * @route   POST /api/modules/:moduleId/complete
 * @desc    Mark a module as complete
 * @access  Private - Requires enrollment
 */
router.post(
  '/modules/:moduleId/complete',
  authenticate,
  checkCourseEnrollment,
  progressController.completeModule
);//3

/**
 * @route   PUT /api/modules/:moduleId/progress
 * @desc    Update video progress for a module
 * @access  Private - Requires enrollment
 */
router.put(
  '/modules/:moduleId/progress',
  authenticate,
  checkCourseEnrollment,
  progressController.updateVideoProgress
);//4

/**
 * @route   GET /api/modules/:moduleId/progress
 * @desc    Get progress for a specific module
 * @access  Private - Requires enrollment
 */
router.get(
  '/modules/:moduleId/progress',
  authenticate,
  checkCourseEnrollment,
  progressController.getModuleProgress
);//5

/**
 * @route   GET /api/courses/:courseId/progress
 * @desc    Get course progress with lesson unlock status
 * @access  Private - Requires enrollment
 */
router.get(
  '/courses/:courseId/progress',
  authenticate,
  checkCourseEnrollment,
  progressController.getCourseProgress
);//

// ============================================
// Module Attachment Routes
// ============================================

/**
 * @route   GET /api/modules/:moduleId/attachments
 * @desc    Get all attachments for a module
 * @access  Public
 */
router.get(
  '/modules/:moduleId/attachments',
  moduleAttachmentController.getAttachmentsByModule
);

/**
 * @route   POST /api/modules/:moduleId/attachments
 * @desc    Create a new attachment
 * @access  Private (Instructor/Admin)
 */
router.post(
  '/modules/:moduleId/attachments',
  authenticate,
  checkPermission('lesson.update'),
  moduleAttachmentController.createAttachment
);

/**
 * @route   POST /api/modules/:moduleId/attachments/bulk
 * @desc    Bulk create attachments
 * @access  Private (Instructor/Admin)
 */
router.post(
  '/modules/:moduleId/attachments/bulk',
  authenticate,
  checkPermission('lesson.update'),
  moduleAttachmentController.bulkCreateAttachments
);

/**
 * @route   PUT /api/modules/:moduleId/attachments/reorder
 * @desc    Reorder attachments for a module
 * @access  Private (Instructor/Admin)
 */
router.put(
  '/modules/:moduleId/attachments/reorder',
  authenticate,
  checkPermission('lesson.update'),
  moduleAttachmentController.reorderAttachments
);

/**
 * @route   GET /api/module-attachments/:id
 * @desc    Get a single attachment by ID
 * @access  Public
 */
router.get(
  '/module-attachments/:id',
  moduleAttachmentController.getAttachmentById
);

/**
 * @route   PUT /api/module-attachments/:id
 * @desc    Update an attachment
 * @access  Private (Instructor/Admin)
 */
router.put(
  '/module-attachments/:id',
  authenticate,
  checkPermission('lesson.update'),
  moduleAttachmentController.updateAttachment
);

/**
 * @route   DELETE /api/module-attachments/:id
 * @desc    Delete an attachment
 * @access  Private (Instructor/Admin)
 */
router.delete(
  '/module-attachments/:id',
  authenticate,
  checkPermission('lesson.delete'),
  moduleAttachmentController.deleteAttachment
);

/**
 * @route   GET /api/lessons/:lessonId/module-attachments/statistics
 * @desc    Get attachment statistics for a lesson
 * @access  Private (Instructor/Admin)
 */
router.get(
  '/lessons/:lessonId/module-attachments/statistics',
  authenticate,
  checkPermission('lesson.read'),
  moduleAttachmentController.getAttachmentStatistics
);

module.exports = router;
