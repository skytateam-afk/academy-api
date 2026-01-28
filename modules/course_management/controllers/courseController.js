/**
 * Course Controller
 * Handles HTTP requests for course management
 */

const Course = require('../../../models/Course');
const logger = require('../../../config/winston');
const { z } = require('zod');
const multer = require('multer');
const { uploadFile } = require('../../../services/storageService');
const notificationService = require('../../notifications/services/notificationService');

// Validation schemas
const createCourseSchema = z.object({
    title: z.string().min(3).max(255),
    description: z.string().optional(),
    shortDescription: z.string().max(500).optional(),
    thumbnailUrl: z.string().url().optional(),
    previewVideoUrl: z.string().url().optional(),
    categoryId: z.string().uuid().optional(),
    instructorId: z.string().uuid(),
    subscriptionTierId: z.string().uuid().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'all']).optional(),
    language: z.string().length(2).optional(),
    durationHours: z.number().min(0).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    enrollmentLimit: z.number().int().positive().optional(),
    isCertification: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
    tags: z.array(z.string()).optional(),
    prerequisites: z.array(z.string().uuid()).optional()
});

const updateCourseSchema = z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional().nullable(),
    shortDescription: z.string().max(500).optional().nullable(),
    thumbnailUrl: z.string().url().optional().nullable(),
    previewVideoUrl: z.string().url().optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    subscriptionTierId: z.string().uuid().optional().nullable(),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'all']).optional(),
    language: z.string().length(2).optional(),
    durationHours: z.number().min(0).optional().nullable(),
    price: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    enrollmentLimit: z.number().int().positive().optional().nullable(),
    isCertification: z.boolean().optional(),
    metadata: z.record(z.any()).optional().nullable(),
    tags: z.array(z.string()).optional(),
    prerequisites: z.array(z.string().uuid()).optional()
});

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 200 * 1024 * 1024, // 200MB limit for videos and thumbnails
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-matroska',
            'video/webm'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WEBP images and MP4/MOV/AVI/MKV/WEBM videos are allowed.'));
        }
    }
});

/**
 * Get all courses with pagination and filtering
 */
exports.getAllCourses = async (req, res) => {
    try {
        const {
            page,
            limit,
            search,
            categoryId,
            instructorId,
            level,
            isPublished,
            isFeatured,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder
        } = req.query;

        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            search,
            categoryId,
            instructorId,
            level,
            isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
            isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            sortBy,
            sortOrder
        };

        const result = await Course.getAll(options);

        res.json({
            success: true,
            data: result.courses,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getAllCourses', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch courses'
        });
    }
};

/**
 * Get featured courses
 */
exports.getFeaturedCourses = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const courses = await Course.getFeatured(limit);

        res.json({
            success: true,
            data: courses
        });
    } catch (error) {
        logger.error('Error in getFeaturedCourses', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch featured courses'
        });
    }
};

/**
 * Get course by ID
 */
exports.getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        const course = await Course.getById(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        // Increment view count (async, don't wait)
        Course.incrementViewCount(id).catch(err =>
            logger.error('Failed to increment view count', { courseId: id, error: err.message })
        );

        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        logger.error('Error in getCourseById', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course'
        });
    }
};

/**
 * Get course by slug
 */
exports.getCourseBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const course = await Course.getBySlug(slug);

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        // Increment view count (async, don't wait)
        Course.incrementViewCount(course.id).catch(err =>
            logger.error('Failed to increment view count', { courseId: course.id, error: err.message })
        );

        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        logger.error('Error in getCourseBySlug', { error: error.message, slug: req.params.slug });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course'
        });
    }
};

/**
 * Get enrollment status for a course
 */
exports.getEnrollmentStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        // Check if user is authenticated
        if (!req.user || !req.user.userId) {
            return res.json({
                success: true,
                data: {
                    is_enrolled: false
                }
            });
        }

        // Check enrollment in database
        const knex = require('../../../config/knex');
        const User = require('../../user_management/models/User');

        const enrollment = await knex('enrollments')
            .where({
                course_id: id,
                user_id: req.user.userId
            })
            .first();

        const isEnrolled = !!enrollment;

        // Check if user has access even if not enrolled (subscriptions, etc.)
        const hasAccess = isEnrolled || await User.hasAccessToCourse(req.user.userId, id);

        res.json({
            success: true,
            data: {
                is_enrolled: isEnrolled,
                has_access: hasAccess,
                enrollment_date: enrollment ? enrollment.enrolled_at : null,
                is_implicit: !enrollment && hasAccess
            }
        });
    } catch (error) {
        logger.error('Error in getEnrollmentStatus', { error: error.message, courseId: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to check enrollment status'
        });
    }
};

/**
 * Get enrolled courses for current user
 */
exports.getMyEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { page, limit } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }

        const knex = require('../../../config/knex');

        const pageNum = page ? parseInt(page) : 1;
        const limitNum = limit ? parseInt(limit) : 12;
        const offset = (pageNum - 1) * limitNum;

        // Get total count
        const countResult = await knex('enrollments')
            .where('user_id', userId)
            .count('* as count')
            .first();

        const total = parseInt(countResult.count);

        // Get enrolled courses with live progress calculation
        const enrollmentsQuery = knex('enrollments as e')
            .join('courses as c', 'e.course_id', 'c.id')
            .leftJoin('categories as cat', 'c.category_id', 'cat.id')
            .leftJoin('users as u', 'c.instructor_id', 'u.id')
            .where('e.user_id', userId)
            .select(
                'c.*',
                'cat.name as category_name',
                'cat.slug as category_slug',
                'u.username as instructor_username',
                'u.first_name as instructor_first_name',
                'u.last_name as instructor_last_name',
                'u.avatar_url as instructor_avatar_url',
                'e.enrolled_at',
                'e.last_accessed_at',
                'e.completed_at',
                'e.status as enrollment_status'
            )
            .orderBy('e.enrolled_at', 'desc')
            .limit(limitNum)
            .offset(offset);

        // Execute enrollments query
        const enrollments = await enrollmentsQuery;

        // Calculate live progress for each enrollment
        for (const enrollment of enrollments) {
            // Count total modules in the course
            const courseModulesQuery = knex('lessons')
                .join('lesson_modules', 'lessons.id', 'lesson_modules.lesson_id')
                .where('lessons.course_id', enrollment.id)
                .count('* as total_modules')
                .first();

            // Count completed modules for this user
            const completedModulesQuery = knex('module_progress')
                .where('user_id', userId)
                .whereIn('module_id', function () {
                    this.select('lesson_modules.id')
                        .from('lesson_modules')
                        .join('lessons', 'lesson_modules.lesson_id', 'lessons.id')
                        .where('lessons.course_id', enrollment.id);
                })
                .where('is_completed', true)
                .count('* as completed_modules')
                .first();

            // Execute progress queries
            const [courseModulesResult, completedModulesResult] = await Promise.all([
                courseModulesQuery,
                completedModulesQuery
            ]);

            const totalModules = parseInt(courseModulesResult.total_modules);
            const completedModules = parseInt(completedModulesResult.completed_modules);
            const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

            // Add calculated progress to enrollment
            enrollment.progress_percent = progressPercent;

            // Update the enrollment table with latest progress (async, don't wait)
            knex('enrollments')
                .where({ user_id: userId, course_id: enrollment.id })
                .update({
                    progress_percent: progressPercent,
                    completed_at: progressPercent === 100 ? knex.raw('CURRENT_TIMESTAMP') : null,
                    last_accessed_at: knex.raw('CURRENT_TIMESTAMP'),
                    status: progressPercent === 100 ? 'completed' : 'enrolled'
                })
                .catch(updateError => {
                    logger.warn('Failed to update enrollment progress', {
                        userId,
                        courseId: enrollment.id,
                        progressPercent,
                        error: updateError.message
                    });
                });
        }

        res.json({
            success: true,
            data: enrollments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        logger.error('Error in getMyEnrolledCourses', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch enrolled courses'
        });
    }
};

/**
 * Get courses by instructor
 */
exports.getCoursesByInstructor = async (req, res) => {
    try {
        const { instructorId } = req.params;
        const { page, limit, isPublished } = req.query;

        // Validate UUID
        if (!z.string().uuid().safeParse(instructorId).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid instructor ID format'
            });
        }

        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined
        };

        const result = await Course.getByInstructor(instructorId, options);

        res.json({
            success: true,
            data: result.courses,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getCoursesByInstructor', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch instructor courses'
        });
    }
};

/**
 * Create new course
 */
exports.createCourse = async (req, res) => {
    try {
        // Validate request body
        const validationResult = createCourseSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const course = await Course.create(validationResult.data);

        // Send notification to instructor
        notificationService.sendCourseCreatedNotification(
            validationResult.data.instructorId,
            course.title
        ).catch(err => logger.error('Failed to send course created notification', { error: err.message }));

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course
        });
    } catch (error) {
        logger.error('Error in createCourse', { error: error.message });

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create course'
        });
    }
};

/**
 * Update course
 */
exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        // Validate request body
        const validationResult = updateCourseSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const course = await Course.update(id, validationResult.data);

        // Send notification to instructor
        if (req.user && req.user.userId) {
            notificationService.sendCourseUpdatedNotification(
                req.user.userId,
                course.title
            ).catch(err => logger.error('Failed to send course updated notification', { error: err.message }));
        }

        res.json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (error) {
        logger.error('Error in updateCourse', { error: error.message, id: req.params.id });

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update course'
        });
    }
};

/**
 * Delete course
 */
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        // Get course before deletion for notification
        const course = await Course.getById(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        // Attempt to delete course (this will throw if there are enrollments)
        await Course.delete(id);

        // Only send notification if deletion was successful
        if (course && course.instructor_id) {
            notificationService.sendCourseDeletedNotification(
                course.instructor_id,
                course.title
            ).catch(err => logger.error('Failed to send course deleted notification', { error: err.message }));
        }

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        logger.error('Error in deleteCourse', { error: error.message, id: req.params.id });

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('Cannot delete')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to delete course'
        });
    }
};

/**
 * Publish/unpublish course
 */
exports.togglePublish = async (req, res) => {
    try {
        const { id } = req.params;
        const { isPublished } = req.body;

        // Validate UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        if (typeof isPublished !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'isPublished must be a boolean'
            });
        }

        const course = await Course.togglePublish(id, isPublished);

        // Send notification to instructor when published
        if (isPublished && req.user && req.user.userId) {
            notificationService.sendCoursePublishedNotification(
                req.user.userId,
                course.title
            ).catch(err => logger.error('Failed to send course published notification', { error: err.message }));
        }

        res.json({
            success: true,
            message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`,
            data: course
        });
    } catch (error) {
        logger.error('Error in togglePublish', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to update course publish status'
        });
    }
};

/**
 * Toggle featured status
 */
exports.toggleFeatured = async (req, res) => {
    try {
        const { id } = req.params;
        const { isFeatured } = req.body;

        // Validate UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        if (typeof isFeatured !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'isFeatured must be a boolean'
            });
        }

        const course = await Course.toggleFeatured(id, isFeatured);

        res.json({
            success: true,
            message: `Course ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
            data: course
        });
    } catch (error) {
        logger.error('Error in toggleFeatured', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to update course featured status'
        });
    }
};

/**
 * Upload course thumbnail
 */
exports.uploadThumbnail = [
    upload.single('thumbnail'),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Validate UUID
            if (!z.string().uuid().safeParse(id).success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid course ID format'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            // Check if course exists
            const course = await Course.getById(id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    error: 'Course not found'
                });
            }

            // Upload to R2
            const uploadResult = await uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                'courses/thumbnails',
                { courseId: id }
            );

            // Update course with new thumbnail URL
            const updatedCourse = await Course.update(id, {
                thumbnailUrl: uploadResult.fileUrl
            });

            res.json({
                success: true,
                message: 'Thumbnail uploaded successfully',
                data: {
                    thumbnailUrl: uploadResult.fileUrl,
                    course: updatedCourse
                }
            });
        } catch (error) {
            logger.error('Error in uploadThumbnail', { error: error.message, id: req.params.id });
            res.status(500).json({
                success: false,
                error: 'Failed to upload thumbnail'
            });
        }
    }
];

/**
 * Upload preview video
 */
exports.uploadPreviewVideo = [
    upload.single('video'),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Validate UUID
            if (!z.string().uuid().safeParse(id).success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid course ID format'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            // Check if course exists
            const course = await Course.getById(id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    error: 'Course not found'
                });
            }

            // Upload to R2
            const uploadResult = await uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                'courses/previews',
                { courseId: id }
            );

            // Update course with new preview video URL
            const updatedCourse = await Course.update(id, {
                previewVideoUrl: uploadResult.fileUrl
            });

            logger.info('Preview video uploaded successfully', {
                courseId: id,
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                fileUrl: uploadResult.fileUrl
            });

            res.json({
                success: true,
                message: 'Preview video uploaded successfully',
                data: {
                    previewVideoUrl: uploadResult.fileUrl,
                    mimetype: req.file.mimetype,
                    filename: req.file.originalname,
                    size: req.file.size,
                    course: updatedCourse
                }
            });
        } catch (error) {
            logger.error('Error in uploadPreviewVideo', {
                error: error.message,
                id: req.params.id,
                filename: req.file?.originalname,
                mimetype: req.file?.mimetype,
                size: req.file?.size,
                stack: error.stack
            });
            res.status(500).json({
                success: false,
                error: 'Failed to upload preview video',
                details: error.message
            });
        }
    }
];

/**
 * Self-enroll in course (student/user action)
 */
exports.selfEnroll = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId; // Get from authenticated user

        // Log for debugging
        logger.info('Self-enrollment attempt', {
            courseId: id,
            userId,
            user: req.user
        });

        // Validate user is authenticated
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }

        // Validate course UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        // Validate user UUID
        if (!z.string().uuid().safeParse(userId).success) {
            logger.error('Invalid user ID format in self-enrollment', {
                userId,
                userIdType: typeof userId,
                courseId: id
            });
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        // Check if course exists and is published
        const course = await Course.getById(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        if (!course.is_published) {
            return res.status(400).json({
                success: false,
                error: 'Course is not available for enrollment'
            });
        }

        // Check if user has access via subscription or institution
        const User = require('../../user_management/models/User');
        const hasAccess = await User.hasAccessToCourse(userId, id);

        // If course is paid and user does NOT have access via subscription/institution, block enrollment
        if (course.price > 0 && !hasAccess) {
            return res.status(403).json({
                success: false,
                error: 'This is a paid course. Please purchase it or upgrade your subscription to enroll.',
                requiresPayment: true,
                price: course.price,
                currency: course.currency
            });
        }

        // Enroll user
        const enrollment = await Course.enrollUser(id, userId);

        // Send notification to user
        notificationService.sendCourseEnrollmentNotification(
            userId,
            id,
            course.title
        ).catch(err => logger.error('Failed to send enrollment notification', { error: err.message }));

        res.status(201).json({
            success: true,
            message: 'Successfully enrolled in course',
            data: enrollment
        });
    } catch (error) {
        logger.error('Error in selfEnroll', {
            error: error.message,
            courseId: req.params.id,
            userId: req.user?.userId
        });

        if (error.message.includes('already enrolled')) {
            return res.status(400).json({
                success: false,
                error: 'You are already enrolled in this course'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to enroll in course'
        });
    }
};

/**
 * Enroll user in course (admin action)
 */
exports.enrollUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        // Validate UUIDs
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        if (!z.string().uuid().safeParse(userId).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        // Check if course exists
        const course = await Course.getById(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        // Enroll user
        const enrollment = await Course.enrollUser(id, userId);

        // Send notification to user
        notificationService.sendCourseEnrollmentNotification(
            userId,
            id,
            course.title
        ).catch(err => logger.error('Failed to send enrollment notification', { error: err.message }));

        res.status(201).json({
            success: true,
            message: 'User enrolled successfully',
            data: enrollment
        });
    } catch (error) {
        logger.error('Error in enrollUser', { error: error.message, courseId: req.params.id });

        if (error.message.includes('already enrolled')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to enroll user'
        });
    }
};

/**
 * Get course enrollments
 */
exports.getCourseEnrollments = async (req, res) => {
    try {
        const { id } = req.params;
        const { page, limit } = req.query;

        // Validate UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10
        };

        const result = await Course.getEnrollments(id, options);

        res.json({
            success: true,
            data: result.enrollments,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getCourseEnrollments', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course enrollments'
        });
    }
};

/**
 * Unenroll user from course (admin action)
 */
exports.unenrollUser = async (req, res) => {
    try {
        const { id, userId } = req.params;

        // Validate UUIDs
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        if (!z.string().uuid().safeParse(userId).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format'
            });
        }

        // Check if course exists
        const course = await Course.getById(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        // Unenroll user
        await Course.unenrollUser(id, userId);

        res.json({
            success: true,
            message: 'User unenrolled successfully'
        });
    } catch (error) {
        logger.error('Error in unenrollUser', { error: error.message, courseId: req.params.id, userId: req.params.userId });

        if (error.message.includes('not enrolled')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to unenroll user'
        });
    }
};

/**
 * Get enrollment trends for a course
 */
exports.getEnrollmentTrends = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        const trends = await Course.getEnrollmentTrends(id);

        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        logger.error('Error in getEnrollmentTrends', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch enrollment trends'
        });
    }
};

/**
 * Get course reviews
 */
exports.getCourseReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { page, limit } = req.query;

        // Validate UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10
        };

        const result = await Course.getCourseReviews(id, options);

        res.json({
            success: true,
            data: result.reviews,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getCourseReviews', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course reviews'
        });
    }
};

/**
 * Get user's review for a course
 */
exports.getUserCourseReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        // Validate inputs
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }

        const review = await Course.getUserReviewForCourse(id, userId);

        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        logger.error('Error in getUserCourseReview', { error: error.message, courseId: req.params.id, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user review'
        });
    }
};

/**
 * Submit or update course review
 */
exports.submitCourseReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, reviewText } = req.body;
        const userId = req.user?.userId;

        // Validation schema for review submission
        const reviewSchema = z.object({
            rating: z.number().int().min(1).max(5),
            reviewText: z.string().optional()
        });

        // Validate inputs
        const validationResult = reviewSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }

        const review = await Course.addOrUpdateCourseReview(id, userId, rating, reviewText);

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: review
        });
    } catch (error) {
        logger.error('Error in submitCourseReview', {
            error: error.message,
            courseId: req.params.id,
            userId: req.user?.userId
        });

        if (error.message.includes('enrolled')) {
            return res.status(403).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('Rating must be between 1 and 5')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to submit review'
        });
    }
};

/**
 * Get course progress for authenticated user
 */
exports.getCourseProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        // Validate inputs
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid course ID format'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }

        const knex = require('../../../config/knex');

        // Check if user is enrolled
        const enrollment = await knex('enrollments')
            .where({ course_id: id, user_id: userId })
            .first();

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                error: 'User is not enrolled in this course'
            });
        }

        // Count total modules in the course
        const courseModulesResult = await knex('lessons')
            .join('lesson_modules', 'lessons.id', 'lesson_modules.lesson_id')
            .where('lessons.course_id', id)
            .count('* as total_modules')
            .first();

        // Count completed modules for this user
        const completedModulesResult = await knex('module_progress')
            .where('user_id', userId)
            .whereIn('module_id', function () {
                this.select('lesson_modules.id')
                    .from('lesson_modules')
                    .join('lessons', 'lesson_modules.lesson_id', 'lessons.id')
                    .where('lessons.course_id', id);
            })
            .where('is_completed', true)
            .count('* as completed_modules')
            .first();

        const totalModules = parseInt(courseModulesResult.total_modules) || 0;
        const completedModules = parseInt(completedModulesResult.completed_modules) || 0;
        const percentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        // Update enrollment progress in database (async)
        knex('enrollments')
            .where({ user_id: userId, course_id: id })
            .update({
                progress_percent: percentage,
                completed_at: percentage === 100 ? knex.raw('CURRENT_TIMESTAMP') : null,
                last_accessed_at: knex.raw('CURRENT_TIMESTAMP'),
                status: percentage === 100 ? 'completed' : 'enrolled'
            })
            .catch(updateError => {
                logger.warn('Failed to update enrollment progress', {
                    userId,
                    courseId: id,
                    percentage,
                    error: updateError.message
                });
            });

        res.json({
            success: true,
            data: {
                overall_progress: {
                    percentage,
                    completed_modules: completedModules,
                    total_modules: totalModules
                },
                enrollment: {
                    enrolled_at: enrollment.enrolled_at,
                    last_accessed_at: enrollment.last_accessed_at,
                    completed_at: enrollment.completed_at,
                    status: percentage === 100 ? 'completed' : enrollment.status
                }
            }
        });
    } catch (error) {
        logger.error('Error in getCourseProgress', {
            error: error.message,
            courseId: req.params.id,
            userId: req.user?.userId
        });

        res.status(500).json({
            success: false,
            error: 'Failed to fetch course progress'
        });
    }
};

module.exports = exports;
