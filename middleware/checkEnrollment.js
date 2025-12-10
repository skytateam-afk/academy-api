/**
 * Enrollment Check Middleware
 * Verifies that a user is enrolled in a course before accessing course content
 */

const knex = require('../config/knex');
const logger = require('../config/winston');

/**
 * Middleware to check if user is enrolled in a course
 * Requires authenticateToken middleware to run first
 */
const checkCourseEnrollment = async (req, res, next) => {
    try {
        // Ensure user is authenticated
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required to access course content'
            });
        }

        const userId = req.user.userId;
        let courseId = req.params.courseId || req.params.id;

        // If courseId not in params, try to get it from the module or lesson
        if (!courseId) {
            // If we have a moduleId, get the course from the module
            if (req.params.moduleId) {
                const moduleResult = await knex('lesson_modules')
                    .join('lessons', 'lesson_modules.lesson_id', 'lessons.id')
                    .where('lesson_modules.id', req.params.moduleId)
                    .select('lessons.course_id')
                    .first();
                
                if (moduleResult) {
                    courseId = moduleResult.course_id;
                }
            }
            // If we have a lessonId, get the course from the lesson
            else if (req.params.lessonId) {
                const lessonResult = await knex('lessons')
                    .where('id', req.params.lessonId)
                    .select('course_id')
                    .first();
                
                if (lessonResult) {
                    courseId = lessonResult.course_id;
                }
            }
        }

        // If we still don't have a courseId, we can't check enrollment
        if (!courseId) {
            logger.warn('checkCourseEnrollment: Unable to determine courseId', {
                params: req.params,
                path: req.path
            });
            return res.status(400).json({
                success: false,
                error: 'Unable to determine course for enrollment check'
            });
        }

        // Check if user is enrolled in the course
        const enrollment = await knex('enrollments')
            .where({
                course_id: courseId,
                user_id: userId
            })
            .first();

        if (!enrollment) {
            logger.warn('Unauthorized course content access attempt', {
                userId,
                courseId,
                endpoint: req.path
            });
            
            return res.status(403).json({
                success: false,
                error: 'You must be enrolled in this course to access its content',
                code: 'NOT_ENROLLED'
            });
        }

        // Add enrollment info to request for potential use in controllers
        req.enrollment = enrollment;
        req.courseId = courseId;

        next();
    } catch (error) {
        logger.error('Error in checkCourseEnrollment middleware', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            params: req.params
        });
        
        res.status(500).json({
            success: false,
            error: 'Error checking course enrollment'
        });
    }
};

/**
 * Optional enrollment check - doesn't fail if not enrolled, but adds enrollment status to request
 * Useful for endpoints that show different data based on enrollment
 */
const checkCourseEnrollmentOptional = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            req.isEnrolled = false;
            return next();
        }

        const userId = req.user.userId;
        const courseId = req.params.courseId || req.params.id;

        if (!courseId) {
            req.isEnrolled = false;
            return next();
        }

        const enrollment = await knex('enrollments')
            .where({
                course_id: courseId,
                user_id: userId
            })
            .first();

        req.isEnrolled = !!enrollment;
        req.enrollment = enrollment;
        req.courseId = courseId;

        next();
    } catch (error) {
        logger.error('Error in checkCourseEnrollmentOptional middleware', {
            error: error.message
        });
        req.isEnrolled = false;
        next();
    }
};

module.exports = {
    checkCourseEnrollment,
    checkCourseEnrollmentOptional
};
