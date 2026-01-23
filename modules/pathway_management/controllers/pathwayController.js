/**
 * Pathway Controller
 * Handles HTTP requests for pathway management
 */

const Pathway = require('../../../models/Pathway');
const PathwayApplication = require('../../../models/PathwayApplication');
const logger = require('../../../config/winston');
const { z } = require('zod');
const notificationService = require('../../notifications/services/notificationService');
const storageService = require('../../../services/storageService');

// Validation schemas
const createPathwaySchema = z.object({
    title: z.string().min(3).max(255),
    description: z.string().optional(),
    shortDescription: z.string().max(500).optional(),
    thumbnailUrl: z.string().url().optional(),
    bannerUrl: z.string().url().optional(),
    careerFocus: z.string().max(100).optional(),
    categoryId: z.string().uuid().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'all']).optional(),
    price: z.preprocess((val) => val ? parseFloat(val) : undefined, z.number().min(0).optional()),
    currency: z.string().length(3).optional(),
    hasCertification: z.preprocess((val) => {
        if (typeof val === 'string') {
            return val === 'true';
        }
        return val;
    }, z.boolean().optional()),
    certificationCriteria: z.string().optional(),
    enrollmentLimit: z.preprocess((val) => val ? parseInt(val) : undefined, z.number().int().positive().optional()),
    createdBy: z.string().uuid(),
    institution_id: z.string().uuid().optional(),
    metadata: z.record(z.any()).optional()
});

const updatePathwaySchema = z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional().nullable(),
    shortDescription: z.string().max(500).optional().nullable(),
    thumbnailUrl: z.string().url().optional().nullable(),
    bannerUrl: z.string().url().optional().nullable(),
    careerFocus: z.string().max(100).optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'all']).optional(),
    price: z.preprocess((val) => val ? parseFloat(val) : undefined, z.number().min(0).optional()),
    currency: z.string().length(3).optional(),
    hasCertification: z.preprocess((val) => {
        if (typeof val === 'string') {
            return val === 'true';
        }
        return val;
    }, z.boolean().optional()),
    certificationCriteria: z.string().optional().nullable(),
    enrollmentLimit: z.preprocess((val) => val ? parseInt(val) : undefined, z.number().int().positive().optional().nullable()),
    metadata: z.record(z.any()).optional().nullable()
});

const addCourseSchema = z.object({
    courseId: z.string().uuid(),
    sequenceOrder: z.number().int().min(1),
    isRequired: z.boolean().optional(),
    description: z.string().optional(),
    learningObjectives: z.array(z.string()).optional(),
    prerequisiteCourseId: z.string().uuid().optional()
});

// Pathway application schemas
const applyForPathwaySchema = z.object({
    pathwayId: z.string().uuid(),
    applicationMessage: z.string().max(1000).optional()
});

const reviewApplicationSchema = z.object({
    status: z.enum(['approved', 'rejected', 'cannot_reapply']),
    reviewNotes: z.string().max(1000).optional(),
    preventReapplication: z.boolean().optional()
});

/**
 * Get all pathways with pagination and filtering
 */
exports.getAllPathways = async (req, res) => {
    try {
        logger.info('getAllPathways called', {
            method: req.method,
            url: req.url,
            params: req.params,
            query: req.query,
            route: req.route?.path,
            userId: req.user?.id,
            userInstitutionId: req.user?.institution_id
        });

        const {
            page,
            limit,
            search,
            categoryId,
            careerFocus,
            level,
            isPublished,
            isFeatured,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder
        } = req.query;

        // Check if any parameters are causing UUID validation issues
        if (categoryId && !z.string().uuid().safeParse(categoryId).success) {
            logger.warn('Invalid categoryId in getAllPathways', { categoryId });
        }

        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            search,
            categoryId,
            careerFocus,
            level,
            isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
            isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            sortBy,
            sortOrder,
            // Filter by user's institution ONLY if student - all other roles see all pathways
            institutionId: (req.user?.role === 'student' || req.user?.role_name === 'student') && req.user?.institution_id ? req.user.institution_id : undefined,
            // For students, only show assigned pathways
            enrolledByUserId: (req.user?.role === 'student' || req.user?.role_name === 'student') ? req.user.userId : undefined
        };


        const result = await Pathway.getAll(options);

        res.json({
            success: true,
            data: result.pathways,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getAllPathways', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pathways'
        });
    }
};

/**
 * Get featured pathways
 */
exports.getFeaturedPathways = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const pathways = await Pathway.getFeatured(limit);

        res.json({
            success: true,
            data: pathways
        });
    } catch (error) {
        logger.error('Error in getFeaturedPathways', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch featured pathways'
        });
    }
};

/**
 * Get pathway by ID
 */
exports.getPathwayById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid pathway ID format'
            });
        }

        const pathway = await Pathway.getById(id);

        if (!pathway) {
            return res.status(404).json({
                success: false,
                error: 'Pathway not found'
            });
        }

        // Implicit enrollment for institutional students
        if (req.user && req.user.institution_id && pathway.institution_id === req.user.institution_id) {
            const knex = require('../../../config/knex');
            const existingEnrollment = await knex('pathway_enrollments')
                .where({ pathway_id: id, user_id: req.user.userId })
                .first();

            if (!existingEnrollment) {
                try {
                    await knex('pathway_enrollments').insert({
                        pathway_id: id,
                        user_id: req.user.userId,
                        status: 'active',
                        enrolled_at: new Date()
                    });

                    // Also enroll in all courses of the pathway
                    await Pathway.enrollMemberInAllPathwayCourses(id, req.user.userId);
                    logger.info('Auto-enrolled institutional student in pathway', { userId: req.user.userId, pathwayId: id });
                } catch (enrollError) {
                    logger.warn('Failed to auto-enroll institutional student', { error: enrollError.message });
                }
            }
        }

        res.json({
            success: true,
            data: pathway
        });
    } catch (error) {
        logger.error('Error in getPathwayById', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pathway'
        });
    }
};

/**
 * Get pathway by slug
 */
exports.getPathwayBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const pathway = await Pathway.getBySlug(slug);

        if (!pathway) {
            return res.status(404).json({
                success: false,
                error: 'Pathway not found'
            });
        }

        res.json({
            success: true,
            data: pathway
        });
    } catch (error) {
        logger.error('Error in getPathwayBySlug', { error: error.message, slug: req.params.slug });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pathway'
        });
    }
};

/**
 * Create new pathway
 */
exports.createPathway = async (req, res) => {
    let uploadedFiles = [];

    try {
        logger.info('=== CREATING PATHWAY WITH UPLOADS ===');
        logger.info('Request body keys:', req.body ? Object.keys(req.body) : 'no body');
        logger.info('Request files:', req.files ? JSON.stringify(Object.keys(req.files).reduce((acc, key) => {
            acc[key] = req.files[key] ? req.files[key].length + ' files' : 'no files';
            return acc;
        }, {}), null, 2) : 'no files');

        if (req.files) {
            for (const fieldName of Object.keys(req.files)) {
                const files = req.files[fieldName];
                logger.info(`Field '${fieldName}':`, Array.isArray(files) ? files.map(f => ({ originalname: f.originalname, mimetype: f.mimetype, size: f.size })).length + ' files' : files ? [files].length + ' files' : 'no files');
            }
        }

        // Set createdBy from authenticated user if not provided
        const userId = req.user.userId;
        const requestBody = {
            ...req.body,
            createdBy: req.body.createdBy || userId,
            // Force institution_id for institution admins
            institution_id: (req.user.role === 'institution_admin' || req.user.role_name === 'institution_admin') && req.user.institution_id
                ? req.user.institution_id
                : req.body.institution_id
        };

        const validationResult = createPathwaySchema.safeParse(requestBody);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        // Handle file uploads to Cloudflare R2
        const pathwayData = { ...validationResult.data };

        // Upload thumbnail if provided
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            const thumbnailFile = req.files.thumbnail[0];
            logger.info('Uploading thumbnail', {
                filename: thumbnailFile.originalname,
                size: thumbnailFile.size,
                mimetype: thumbnailFile.mimetype
            });

            try {
                const thumbnailUpload = await storageService.uploadFile(
                    thumbnailFile.buffer,
                    thumbnailFile.originalname,
                    thumbnailFile.mimetype,
                    'pathways/thumbnails'
                );

                pathwayData.thumbnailUrl = thumbnailUpload.fileUrl;
                uploadedFiles.push(thumbnailUpload);
                logger.info('Thumbnail uploaded successfully', { url: thumbnailUpload.fileUrl });
            } catch (uploadError) {
                logger.error('Thumbnail upload failed', {
                    error: uploadError.message,
                    stack: uploadError.stack
                });
                throw new Error(`Thumbnail upload failed: ${uploadError.message}`);
            }
        }

        // Upload banner if provided
        if (req.files && req.files.banner && req.files.banner[0]) {
            const bannerFile = req.files.banner[0];
            logger.info('Uploading banner', {
                filename: bannerFile.originalname,
                size: bannerFile.size,
                mimetype: bannerFile.mimetype
            });

            try {
                const bannerUpload = await storageService.uploadFile(
                    bannerFile.buffer,
                    bannerFile.originalname,
                    bannerFile.mimetype,
                    'pathways/banners'
                );

                pathwayData.bannerUrl = bannerUpload.fileUrl;
                uploadedFiles.push(bannerUpload);
                logger.info('Banner uploaded successfully', { url: bannerUpload.fileUrl });
            } catch (uploadError) {
                logger.error('Banner upload failed', {
                    error: uploadError.message,
                    stack: uploadError.stack
                });
                throw new Error(`Banner upload failed: ${uploadError.message}`);
            }
        }

        logger.info('Creating pathway in database', {
            data: { ...pathwayData, uploadedFiles: uploadedFiles.length }
        });

        const pathway = await Pathway.create(pathwayData);

        // Send pathway created notification to creator (don't block response)
        notificationService.sendPathwayCreatedNotification(userId, pathway.title)
            .catch(err => logger.error('Failed to send pathway created notification', { error: err.message }));

        logger.info('Pathway created successfully', {
            pathwayId: pathway.id,
            title: pathway.title,
            uploadedFiles: uploadedFiles.length
        });

        res.status(201).json({
            success: true,
            message: 'Pathway created successfully',
            data: pathway,
            uploadedFiles: uploadedFiles
        });
    } catch (error) {
        logger.error('Error in createPathway', {
            error: error.message,
            uploadedFiles: uploadedFiles.length,
            stack: error.stack
        });

        // If pathway creation failed but files were uploaded, we might want to clean them up
        // For now, we'll leave the files as they are since they might be used by the failed pathway

        if (error.message.includes('upload failed') && error.message.includes('Failed to create pathway')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create pathway'
        });
    }
};

/**
 * Update pathway
 */
exports.updatePathway = async (req, res) => {
    let uploadedFiles = [];

    try {
        logger.info('=== UPDATING PATHWAY WITH UPLOADS ===');
        logger.info('Pathway ID:', req.params.id);
        logger.info('Request body keys:', req.body ? Object.keys(req.body) : 'no body');
        logger.info('Request body values:', req.body ? JSON.stringify(req.body, null, 2) : 'no body');
        logger.info('Request files:', req.files ? JSON.stringify(Object.keys(req.files).reduce((acc, key) => {
            acc[key] = req.files[key] ? req.files[key].length + ' files' : 'no files';
            return acc;
        }, {}), null, 2) : 'no files');

        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            logger.error('Invalid pathway ID format:', id);
            return res.status(400).json({
                success: false,
                error: 'Invalid pathway ID format'
            });
        }

        logger.info('Validating request body against updatePathwaySchema...');
        const validationResult = updatePathwaySchema.safeParse(req.body);

        if (!validationResult.success) {
            logger.error('Validation failed:', JSON.stringify(validationResult.error.errors, null, 2));
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        logger.info('Validation passed successfully');

        // Check ownership for institution admins
        if (req.user.role === 'institution_admin' || req.user.role_name === 'institution_admin') {
            const existingPathway = await Pathway.getById(id);
            if (!existingPathway) {
                return res.status(404).json({ success: false, error: 'Pathway not found' });
            }
            if (existingPathway.institution_id !== req.user.institution_id) {
                logger.warn('Unauthorized pathway update attempt', {
                    userId: req.user.userId,
                    pathwayId: id,
                    userInstitution: req.user.institution_id,
                    pathwayInstitution: existingPathway.institution_id
                });
                return res.status(403).json({ success: false, error: 'Unauthorized to update this pathway' });
            }
        }

        // Handle file uploads to Cloudflare R2
        const pathwayData = { ...validationResult.data };

        // Upload thumbnail if provided
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            const thumbnailFile = req.files.thumbnail[0];
            logger.info('📸 Uploading thumbnail', {
                filename: thumbnailFile.originalname,
                size: thumbnailFile.size,
                mimetype: thumbnailFile.mimetype
            });

            try {
                const thumbnailUpload = await storageService.uploadFile(
                    thumbnailFile.buffer,
                    thumbnailFile.originalname,
                    thumbnailFile.mimetype,
                    'pathways/thumbnails'
                );

                pathwayData.thumbnailUrl = thumbnailUpload.fileUrl;
                uploadedFiles.push(thumbnailUpload);
                logger.info('✅ Thumbnail uploaded successfully', { url: thumbnailUpload.fileUrl });
            } catch (uploadError) {
                logger.error('❌ Thumbnail upload failed', {
                    error: uploadError.message,
                    stack: uploadError.stack
                });
                throw new Error(`Thumbnail upload failed: ${uploadError.message}`);
            }
        }

        // Upload banner if provided
        if (req.files && req.files.banner && req.files.banner[0]) {
            const bannerFile = req.files.banner[0];
            logger.info('🎨 Uploading banner', {
                filename: bannerFile.originalname,
                size: bannerFile.size,
                mimetype: bannerFile.mimetype
            });

            try {
                const bannerUpload = await storageService.uploadFile(
                    bannerFile.buffer,
                    bannerFile.originalname,
                    bannerFile.mimetype,
                    'pathways/banners'
                );

                pathwayData.bannerUrl = bannerUpload.fileUrl;
                uploadedFiles.push(bannerUpload);
                logger.info('✅ Banner uploaded successfully', { url: bannerUpload.fileUrl });
            } catch (uploadError) {
                logger.error('❌ Banner upload failed', {
                    error: uploadError.message,
                    stack: uploadError.stack
                });
                throw new Error(`Banner upload failed: ${uploadError.message}`);
            }
        }

        logger.info('💾 Updating pathway in database', {
            id,
            dataKeys: Object.keys(pathwayData),
            uploadedFiles: uploadedFiles.length
        });

        const pathway = await Pathway.update(id, pathwayData);

        logger.info('✅ Pathway updated successfully', {
            pathwayId: pathway.id,
            title: pathway.title,
            uploadedFiles: uploadedFiles.length
        });

        const responseData = {
            success: true,
            message: 'Pathway updated successfully',
            data: pathway,
            uploadedFiles: uploadedFiles
        };

        logger.info('📤 Sending response to client', {
            success: true,
            pathwayId: pathway.id,
            filesUploaded: uploadedFiles.length
        });

        res.json(responseData);
    } catch (error) {
        logger.error('Error in updatePathway', {
            error: error.message,
            id: req.params.id,
            uploadedFiles: uploadedFiles.length,
            stack: error.stack
        });

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update pathway'
        });
    }
};

/**
 * Delete pathway
 */
exports.deletePathway = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid pathway ID format'
            });
        }

        await Pathway.delete(id);

        res.json({
            success: true,
            message: 'Pathway deleted successfully'
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            logger.warn('Pathway not found during deletion', { id: req.params.id });
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('Cannot delete')) {
            logger.warn('Cannot delete pathway', { id: req.params.id, error: error.message });
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        logger.error('Error in deletePathway', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to delete pathway'
        });
    }
};

/**
 * Add course to pathway
 */
exports.addCourse = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid pathway ID format'
            });
        }

        const validationResult = addCourseSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const result = await Pathway.addCourse(id, validationResult.data);

        // Get pathway and course details for notification
        const pathway = await Pathway.getById(id);

        // Send course added notification to pathway creator (don't block response)
        if (pathway && pathway.created_by) {
            notificationService.sendCourseAddedToPathwayNotification(
                pathway.created_by,
                pathway.title,
                result.course_title || 'a course'
            ).catch(err => logger.error('Failed to send course added notification', { error: err.message }));
        }

        res.status(201).json({
            success: true,
            message: 'Course added to pathway successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error in addCourse', { error: error.message, id: req.params.id });

        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to add course to pathway'
        });
    }
};

/**
 * Remove course from pathway
 */
exports.removeCourse = async (req, res) => {
    try {
        const { id, courseId } = req.params;

        if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(courseId).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID format'
            });
        }

        await Pathway.removeCourse(id, courseId);

        res.json({
            success: true,
            message: 'Course removed from pathway successfully'
        });
    } catch (error) {
        logger.error('Error in removeCourse', { error: error.message, id: req.params.id, courseId: req.params.courseId });
        res.status(500).json({
            success: false,
            error: 'Failed to remove course from pathway'
        });
    }
};

/**
 * Publish/unpublish pathway
 */
exports.togglePublish = async (req, res) => {
    try {
        const { id } = req.params;
        const { isPublished } = req.body;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid pathway ID format'
            });
        }

        if (typeof isPublished !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'isPublished must be a boolean'
            });
        }

        const pathway = await Pathway.togglePublish(id, isPublished);

        // Send pathway published notification to creator (don't block response)
        if (isPublished && pathway.created_by) {
            notificationService.sendPathwayPublishedNotification(pathway.created_by, pathway.title)
                .catch(err => logger.error('Failed to send pathway published notification', { error: err.message }));
        }

        res.json({
            success: true,
            message: `Pathway ${isPublished ? 'published' : 'unpublished'} successfully`,
            data: pathway
        });
    } catch (error) {
        logger.error('Error in togglePublish', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to update pathway publish status'
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

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid pathway ID format'
            });
        }

        if (typeof isFeatured !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'isFeatured must be a boolean'
            });
        }

        const pathway = await Pathway.toggleFeatured(id, isFeatured);

        res.json({
            success: true,
            message: `Pathway ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
            data: pathway
        });
    } catch (error) {
        logger.error('Error in toggleFeatured', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to update pathway featured status'
        });
    }
};

// ====================== PATHWAY APPLICATION ENDPOINTS ======================

/**
 * Apply for a pathway (Student)
 */
exports.applyForPathway = async (req, res) => {
    try {
        const userId = req.user.userId; // From authentication middleware

        const validationResult = applyForPathwaySchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const { pathwayId, applicationMessage } = validationResult.data;

        // Check if user can apply
        const canApply = await PathwayApplication.canApply(userId, pathwayId);
        if (!canApply) {
            return res.status(403).json({
                success: false,
                error: 'You are not eligible to apply for this pathway'
            });
        }

        const application = await PathwayApplication.apply({
            userId,
            pathwayId,
            applicationMessage
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application
        });
    } catch (error) {
        logger.error('Error in applyForPathway', { error: error.message, userId: req.user?.id });

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('cannot reapply')) {
            return res.status(403).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('pending application')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('duplicate key value') && error.message.includes('unique_user_pathway_application')) {
            return res.status(409).json({
                success: false,
                error: 'You have already applied to this pathway',
                code: 'DUPLICATE_APPLICATION'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to submit application'
        });
    }
};

/**
 * Get user's own applications (Student)
 */
exports.getMyApplications = async (req, res) => {
    try {
        const userId = req.user.userId;

        const {
            page,
            limit,
            status,
            sortBy,
            sortOrder
        } = req.query;

        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            status,
            sortBy,
            sortOrder
        };

        const result = await PathwayApplication.getByUser(userId, options);

        res.json({
            success: true,
            data: result.applications,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getMyApplications', { error: error.message, userId: req.user?.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch your applications'
        });
    }
};

/**
 * Get applications for a pathway (Admin/Staff view)
 */
exports.getPathwayApplications = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid pathway ID format'
            });
        }

        const {
            page,
            limit,
            status,
            sortBy,
            sortOrder
        } = req.query;

        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            status,
            sortBy,
            sortOrder
        };

        const result = await PathwayApplication.getByPathway(id, options);

        res.json({
            success: true,
            data: result.applications,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getPathwayApplications', { error: error.message, pathwayId: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pathway applications'
        });
    }
};

/**
 * Get all applications (Admin view)
 */
exports.getAllApplications = async (req, res) => {
    try {
        const {
            page,
            limit,
            status,
            pathwayId,
            userId,
            sortBy,
            sortOrder
        } = req.query;

        logger.info('🟡 getAllApplications CALLED - REQUEST RECEIVED', {
            method: req.method,
            url: req.url,
            user: req.user ? { id: req.user.userId, role: req.user.role } : 'no user',
            query: req.query
        });

        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            status,
            pathwayId,
            userId,
            sortBy,
            sortOrder
        };

        logger.info('🟢 getAllApplications OPTIONS', { options });

        const result = await PathwayApplication.getAll(options);

        logger.info('✅ getAllApplications RESULT', {
            applicationCount: result.applications.length,
            pagination: result.pagination,
            sampleApplication: result.applications[0] ? {
                id: result.applications[0].id,
                applicantEmail: result.applications[0].user_email,
                pathwayTitle: result.applications[0].pathway_title,
                status: result.applications[0].status
            } : 'No applications'
        });

        const response = {
            success: true,
            data: result.applications,
            pagination: result.pagination
        };

        logger.info('🚀 getAllApplications SENDING RESPONSE', {
            success: response.success,
            dataCount: response.data.length,
            hasPagination: !!response.pagination
        });

        res.json(response);
    } catch (error) {
        logger.error('❌ ERROR in getAllApplications', {
            error: error.message,
            stack: error.stack,
            url: req.url,
            query: req.query
        });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch applications'
        });
    }
};

/**
 * Get application by ID
 */
exports.getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid application ID format'
            });
        }

        const application = await PathwayApplication.getById(id);

        if (!application) {
            return res.status(404).json({
                success: false,
                error: 'Application not found'
            });
        }

        // Check if user can access this application
        // Students can only see their own applications, admins can see all
        if (req.user.role !== 'admin' && req.user.role !== 'staff' && application.user_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: application
        });
    } catch (error) {
        logger.error('Error in getApplicationById', { error: error.message, applicationId: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch application'
        });
    }
};

/**
 * Review application (Admin/Staff)
 */
exports.reviewApplication = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid application ID format'
            });
        }

        const validationResult = reviewApplicationSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const { status, reviewNotes, preventReapplication } = validationResult.data;
        const reviewerId = req.user.userId;

        // Require confirmation for rejection
        if ((status === 'rejected' || status === 'cannot_reapply') && !req.body.confirmed) {
            return res.status(400).json({
                success: false,
                error: 'Confirmation required for application rejection',
                details: {
                    requiresConfirmation: true,
                    action: `Mark application as ${status}`
                }
            });
        }

        const application = await PathwayApplication.reviewApplication(id, {
            status,
            reviewerId,
            reviewNotes,
            preventReapplication
        });

        res.json({
            success: true,
            message: `Application ${status}`,
            data: application
        });
    } catch (error) {
        logger.error('Error in reviewApplication', { error: error.message, applicationId: req.params.id });

        if (error.message.includes('already been reviewed')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to review application'
        });
    }
};

/**
 * Get application statistics (Admin view)
 */
exports.getApplicationStatistics = async (req, res) => {
    try {
        const stats = await PathwayApplication.getStatistics();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error in getApplicationStatistics', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch application statistics'
        });
    }
};

/**
 * Delete pathway application (Admin/Staff only)
 */
exports.deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid application ID format'
            });
        }

        await PathwayApplication.deleteApplication(id);

        res.json({
            success: true,
            message: 'Application deleted successfully'
        });
    } catch (error) {
        logger.error('Error in deleteApplication', { error: error.message, applicationId: req.params.id });

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to delete application'
        });
    }
};

/**
 * Check if user can apply to pathway (Student)
 */
exports.checkApplicationEligibility = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { pathwayId } = req.params;

        if (!z.string().uuid().safeParse(pathwayId).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid pathway ID format'
            });
        }

        const canApply = await PathwayApplication.canApply(userId, pathwayId);

        res.json({
            success: true,
            data: {
                pathwayId,
                canApply,
                message: canApply ? 'You can apply for this pathway' : 'You are not eligible to apply for this pathway'
            }
        });
    } catch (error) {
        logger.error('Error in checkApplicationEligibility', { error: error.message, userId: req.user?.id, pathwayId: req.params.pathwayId });
        res.status(500).json({
            success: false,
            error: 'Failed to check eligibility'
        });
    }
};

module.exports = exports;
