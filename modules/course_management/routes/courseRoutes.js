/**
 * Course Routes
 * RESTful API endpoints for course management
 */

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const Course = require('../../../models/Course');
const logger = require('../../../config/winston');

// Middleware to check if user can update course (permission OR ownership)
const canUpdateCourse = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const courseId = req.params.id;
        const userId = req.user.userId;

        // Get the course to check ownership
        const course = await Course.getById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        // Check if user has update permission OR is the course instructor
        const { hasPermission } = require('../../../middleware/rbac');
        const userHasPermission = await hasPermission(userId, 'course.update');
        const userOwnsCourse = course.instructor_id === userId;

        if (!userHasPermission && !userOwnsCourse) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to update this course'
            });
        }

        next();
    } catch (error) {
        logger.error('Error in canUpdateCourse middleware', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Error checking course update permissions'
        });
    }
};

/**
 * Public Routes
 * These endpoints are accessible without authentication
 */

// Get all courses with filtering and pagination
router.get('/', courseController.getAllCourses);

// Get featured courses
router.get('/featured', courseController.getFeaturedCourses);

// Get my enrolled courses (must come before /:id route)
router.get('/my-courses/enrolled', authenticateToken, courseController.getMyEnrolledCourses);

// Get course by slug (SEO-friendly URL)
router.get('/slug/:slug', courseController.getCourseBySlug);

// Get course by ID
router.get('/:id', courseController.getCourseById);

// Get enrollment status for a course (requires authentication)
router.get('/:id/enrollment-status', authenticateToken, courseController.getEnrollmentStatus);

// Get course progress for authenticated user
router.get('/:id/progress', authenticateToken, courseController.getCourseProgress);

// Get courses by instructor
router.get('/instructor/:instructorId', courseController.getCoursesByInstructor);

/**
 * Protected Routes
 * These endpoints require authentication and specific permissions
 */

// Create new course
router.post(
    '/',
    authenticateToken,
    requirePermission('course.create'),
    courseController.createCourse
);

// Update course
router.put(
    '/:id',
    authenticateToken,
    canUpdateCourse,
    courseController.updateCourse
);

// Delete course
router.delete(
    '/:id',
    authenticateToken,
    requirePermission('course.delete'),
    courseController.deleteCourse
);

// Publish/unpublish course
router.patch(
    '/:id/publish',
    authenticateToken,
    requirePermission('course.publish'),
    courseController.togglePublish
);

// Toggle featured status
router.patch(
    '/:id/featured',
    authenticateToken,
    canUpdateCourse,
    courseController.toggleFeatured
);

// Upload course thumbnail
router.post(
    '/:id/thumbnail',
    authenticateToken,
    canUpdateCourse,
    courseController.uploadThumbnail
);

// Upload preview video
router.post(
    '/:id/preview-video',
    authenticateToken,
    canUpdateCourse,
    courseController.uploadPreviewVideo
);

// Self-enroll in course (student/user action)
router.post(
    '/:id/self-enroll',
    authenticateToken,
    courseController.selfEnroll
);

// Enroll user in course (admin action)
router.post(
    '/:id/enroll',
    authenticateToken,
    requirePermission('course.enroll'),
    courseController.enrollUser
);

// Get course enrollments
router.get(
    '/:id/enrollments',
    authenticateToken,
    requirePermission('course.enroll'),
    courseController.getCourseEnrollments
);

// Get enrollment trends for a course
router.get(
    '/:id/enrollment-trends',
    authenticateToken,
    requirePermission('course.enroll'),
    courseController.getEnrollmentTrends
);

// Unenroll user from course (admin action)
router.delete(
    '/:id/enrollments/:userId',
    authenticateToken,
    requirePermission('course.enroll'),
    courseController.unenrollUser
);

// Get course reviews (public)
router.get('/:id/reviews', courseController.getCourseReviews);

// Get user's own review for a course
router.get('/:id/reviews/my', authenticateToken, courseController.getUserCourseReview);

// Submit or update course review (authenticated users only)
router.post('/:id/reviews', authenticateToken, courseController.submitCourseReview);

module.exports = router;
