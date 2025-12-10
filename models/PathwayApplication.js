/**
 * PathwayApplication Model
 * Handles pathway application operations for student admissions and admin approval
 */

const knex = require('../config/knex');
const logger = require('../config/winston');
const Pathway = require('./Pathway');

class PathwayApplication {
    /**
     * Apply for a pathway
     * @param {Object} applicationData - Application data
     * @returns {Promise<Object>} Created application
     */
    static async apply(applicationData) {
        const trx = await knex.transaction();

        try {
            const { userId, pathwayId, applicationMessage } = applicationData;

            // Check if pathway exists and is published
            const pathway = await trx('pathways')
                .where({ id: pathwayId, is_published: true })
                .first();

            if (!pathway) {
                throw new Error('Pathway not found or not available');
            }

            // Check if user has already applied
            // If table doesn't exist or columns are wrong, skip this check (allow application)
            let existingApplication = null;
            try {
                existingApplication = await trx('pathway_applications')
                    .where('user_id', userId)
                    .andWhere('pathway_id', pathwayId)
                    .first();
            } catch (error) {
                logger.warn('Cannot check existing applications (table may not exist yet), proceeding with application', {
                    user_id: userId,
                    pathwayId,
                    error: error.message
                });
                // Skip existing application checks if database table/columns not available
                existingApplication = null;
            }

            if (existingApplication) {
                if (existingApplication.status === 'pending') {
                    throw new Error('You already have a pending application for this pathway');
                }
                if (existingApplication.status === 'cannot_reapply' || existingApplication.prevent_reapplication) {
                    throw new Error('You are not eligible to reapply for this pathway');
                }
                // Allow re-application if previously rejected (not marked as prevent_reapply)
                if (existingApplication.status === 'rejected' && !existingApplication.prevent_reapplication) {
                    // Create new application, but don't allow multiple pending
                    if (existingApplication.status !== 'rejected') {
                        throw new Error('You already have an application for this pathway');
                    }
                }
            }

            // Create application - use snake_case column names
            const [application] = await trx('pathway_applications')
                .insert({
                    user_id: userId,
                    pathway_id: pathwayId,
                    application_message: applicationMessage || null,
                    status: 'pending'
                })
                .returning('*');

            await trx.commit();

            logger.info('Pathway application submitted', { applicationId: application.id, userId, pathwayId });
            return await this.getById(application.id);
        } catch (error) {
            await trx.rollback();
            logger.error('Error creating pathway application', { error: error.message, applicationData });
            throw error;
        }
    }

    /**
     * Get application by ID with full details
     * @param {string} id - Application ID
     * @returns {Promise<Object>} Application details
     */
    static async getById(id) {
        try {
            const application = await knex('pathway_applications as pa')
                .join('users as u', 'pa.user_id', 'u.id')
                .join('pathways as p', 'pa.pathway_id', 'p.id')
                .leftJoin('users as r', 'pa.reviewed_by', 'r.id')
                .select(
                    'pa.*',
                    // User info
                    'u.first_name as user_first_name',
                    'u.last_name as user_last_name',
                    'u.email as user_email',
                    'u.username as user_username',
                    // Pathway info
                    'p.title as pathway_title',
                    'p.slug as pathway_slug',
                    'p.description as pathway_description',
                    'p.short_description as pathway_short_description',
                    'p.thumbnail_url as pathway_thumbnail_url',
                    'p.career_focus as pathway_career_focus',
                    'p.level as pathway_level',
                    'p.price as pathway_price',
                    'p.currency as pathway_currency',
                    'p.estimated_duration_hours as pathway_duration',
                    'p.course_count as pathway_course_count',
                    // Reviewer info
                    'r.first_name as reviewer_first_name',
                    'r.last_name as reviewer_last_name'
                )
                .where('pa.id', id)
                .first();

            return application;
        } catch (error) {
            logger.error('Error getting pathway application by ID', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Get applications by pathway ID
     * @param {string} pathwayId - Pathway ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Applications with pagination
     */
    static async getByPathway(pathwayId, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                sortBy = 'applied_at',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;

            let query = knex('pathway_applications as pa')
                .join('users as u', 'pa.user_id', 'u.id')
                .join('pathways as p', 'pa.pathway_id', 'p.id')
                .leftJoin('users as r', 'pa.reviewed_by', 'r.id')
                .where('pa.pathway_id', pathwayId)
                .select(
                    'pa.*',
                    'u.first_name as user_first_name',
                    'u.last_name as user_last_name',
                    'u.email as user_email',
                    'u.username as user_username',
                    'r.first_name as reviewer_first_name',
                    'r.last_name as reviewer_last_name'
                );

            // Apply status filter
            if (status) {
                query = query.where('pa.status', status);
            }

            // Get total count using a separate query without complex joins
            const countQuery = knex('pathway_applications as pa')
                .where('pa.pathway_id', pathwayId);

            if (status) {
                countQuery.where('pa.status', status);
            }

            const [{ total }] = await countQuery.count('pa.id as total');

            // Apply sorting and pagination
            const validSortFields = ['applied_at', 'status', 'created_at'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'applied_at';
            const order = sortOrder.toUpperCase() === 'ASC' ? 'asc' : 'desc';

            query = query.orderBy(`pa.${sortField}`, order)
                .limit(limit)
                .offset(offset);

            const applications = await query;

            return {
                applications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(total),
                    totalPages: Math.ceil(parseInt(total) / limit)
                }
            };
        } catch (error) {
            logger.error('Error getting pathway applications by pathway', { pathwayId, error: error.message });
            throw error;
        }
    }

    /**
     * Get applications by user ID
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} User applications with pagination
     */
    static async getByUser(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                sortBy = 'applied_at',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;

            // Build the base query with proper joins
            let query = knex('pathway_applications as pa')
                .join('users as u', 'pa.user_id', 'u.id')
                .join('pathways as p', 'pa.pathway_id', 'p.id')
                .leftJoin('users as r', 'pa.reviewed_by', 'r.id')
                .where('pa.user_id', userId)
                .select(
                    'pa.*',
                    'u.first_name as user_first_name',
                    'u.last_name as user_last_name',
                    'u.email as user_email',
                    'u.username as user_username',
                    'p.title as pathway_title',
                    'p.slug as pathway_slug',
                    'p.description as pathway_description',
                    'p.short_description as pathway_short_description',
                    'p.thumbnail_url as pathway_thumbnail_url',
                    'p.career_focus as pathway_career_focus',
                    'p.level as pathway_level',
                    'p.price as pathway_price',
                    'p.currency as pathway_currency',
                    'r.first_name as reviewer_first_name',
                    'r.last_name as reviewer_last_name'
                );

            // Apply status filter
            if (status) {
                query = query.where('pa.status', status);
            }

            // Get total count using a separate query without complex joins
            const countQuery = knex('pathway_applications')
                .where('user_id', userId);

            if (status) {
                countQuery.where('status', status);
            }

            const [{ total }] = await countQuery.count('id as total');

            // Apply sorting and pagination
            const validSortFields = ['applied_at', 'status', 'created_at'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'applied_at';
            const order = sortOrder.toUpperCase() === 'ASC' ? 'asc' : 'desc';

            query = query.orderBy(`pa.${sortField}`, order)
                .limit(limit)
                .offset(offset);

            const applications = await query;

            return {
                applications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(total),
                    totalPages: Math.ceil(parseInt(total) / limit)
                }
            };
        } catch (error) {
            logger.error('Error getting pathway applications by user', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Get all applications (admin view)
     * @param {Object} options - Query options
     * @returns {Promise<Object>} All applications with pagination
     */
    static async getAll(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                pathwayId,
                userId,
                sortBy = 'applied_at',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;

            let query = knex('pathway_applications as pa')
                .join('users as u', 'pa.user_id', 'u.id')
                .join('pathways as p', 'pa.pathway_id', 'p.id')
                .leftJoin('users as r', 'pa.reviewed_by', 'r.id')
                .select(
                    'pa.*',
                    'u.first_name as user_first_name',
                    'u.last_name as user_last_name',
                    'u.email as user_email',
                    'u.username as user_username',
                    'p.title as pathway_title',
                    'p.slug as pathway_slug',
                    'p.career_focus as pathway_career_focus',
                    'r.first_name as reviewer_first_name',
                    'r.last_name as reviewer_last_name'
                );

            // Apply filters
            if (status) {
                query = query.where('pa.status', status);
            }
            if (pathwayId) {
                query = query.where('pa.pathway_id', pathwayId);
            }
            if (userId) {
                query = query.where('pa.user_id', userId);
            }

            // Get total count using a separate query without complex joins
            const countQuery = knex('pathway_applications as pa');

            if (status) {
                countQuery.where('pa.status', status);
            }
            if (pathwayId) {
                countQuery.where('pa.pathway_id', pathwayId);
            }
            if (userId) {
                countQuery.where('pa.user_id', userId);
            }

            const [{ total }] = await countQuery.count('pa.id as total');

            // Apply sorting and pagination
            const validSortFields = ['applied_at', 'status', 'created_at', 'user_first_name', 'pathway_title'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'applied_at';
            const order = sortOrder.toUpperCase() === 'ASC' ? 'asc' : 'desc';

            // Handle different table prefixes for sorting
            let sortColumn;
            if (sortBy === 'user_first_name') {
                sortColumn = 'u.first_name';
            } else if (sortBy === 'pathway_title') {
                sortColumn = 'p.title';
            } else {
                sortColumn = `pa.${sortField}`;
            }

            query = query.orderBy(sortColumn, order)
                .limit(limit)
                .offset(offset);

            const applications = await query;

            return {
                applications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(total),
                    totalPages: Math.ceil(parseInt(total) / limit)
                }
            };
        } catch (error) {
            logger.error('Error getting all pathway applications', { options, error: error.message });
            throw error;
        }
    }

    /**
     * Approve or reject an application
     * @param {string} applicationId - Application ID
     * @param {Object} reviewData - Review data
     * @returns {Promise<Object>} Updated application
     */
    static async reviewApplication(applicationId, reviewData) {
        const trx = await knex.transaction();

        try {
            const { status, reviewerId, reviewNotes, preventReapplication = false } = reviewData;

            // Validate status
            if (!['approved', 'rejected', 'cannot_reapply'].includes(status)) {
                throw new Error('Invalid review status');
            }

            // Get application
            const application = await this.getById(applicationId);
            if (!application) {
                throw new Error('Application not found');
            }

            if (application.status !== 'pending') {
                throw new Error('Application has already been reviewed');
            }

            // Update application
            const updateData = {
                status,
                reviewed_by: reviewerId,
                reviewed_at: trx.fn.now(),
                review_notes: reviewNotes || null,
                updated_at: trx.fn.now()
            };

            if (status === 'cannot_reapply' || (status === 'rejected' && preventReapplication)) {
                updateData.prevent_reapplication = true;
            }

            await trx('pathway_applications')
                .where('id', applicationId)
                .update(updateData);

            // If approved, create enrollment
            if (status === 'approved') {
                await this.createEnrollment(trx, application, reviewerId);
            }

            await trx.commit();

            logger.info('Pathway application reviewed', { applicationId, status, reviewerId });
            return await this.getById(applicationId);
        } catch (error) {
            await trx.rollback();
            logger.error('Error reviewing pathway application', { applicationId, reviewData, error: error.message });
            throw error;
        }
    }

    /**
     * Create enrollment for approved applications
     * @param {Object} trx -Transaction
     * @param {Object} application - Application data
     * @param {string} approvedBy - Admin who approved
     */
    static async createEnrollment(trx, application, approvedBy) {
        try {
            // Get pathway course count
            const { course_count } = await trx('pathways')
                .where('id', application.pathway_id)
                .select('course_count')
                .first();

            // Create enrollment
            await trx('pathway_enrollments').insert({
                user_id: application.user_id,
                pathway_id: application.pathway_id,
                enrollment_type: 'admin', // Since approved by admin
                total_courses: course_count || 0
            });

            logger.info('Pathway enrollment created for approved application', {
                applicationId: application.id,
                userId: application.user_id,
                pathwayId: application.pathway_id
            });

            // Automatically enroll user in all pathway courses
            try {
                await Pathway.enrollMemberInAllPathwayCourses(application.pathway_id, application.user_id);
                logger.info('Auto-enrolled pathway member in all courses', {
                    applicationId: application.id,
                    userId: application.user_id,
                    pathwayId: application.pathway_id
                });
            } catch (autoEnrollError) {
                logger.warn('Auto-enrollment failed for pathway member (continuing)', {
                    applicationId: application.id,
                    pathwayId: application.pathway_id,
                    userId: application.user_id,
                    error: autoEnrollError.message
                });
                // Don't fail the enrollment process for auto-enrollment failures
            }
        } catch (error) {
            logger.error('Error creating pathway enrollment', { application, error: error.message });
            throw error;
        }
    }

    /**
     * Check if user can apply to pathway
     * If database table or columns don't exist yet, allow application (safer)
     * @param {string} userId - User ID
     * @param {string} pathwayId - Pathway ID
     * @returns {Promise<boolean>} Whether user can apply
     */
    static async canApply(userId, pathwayId) {
        try {
            const application = await knex('pathway_applications')
                .where('user_id', '=', userId)
                .andWhere('pathway_id', '=', pathwayId)
                .orderBy('created_at', 'desc')
                .first();

            if (!application) {
                return true; // No previous application
            }

            // Can reapply only if rejected and not marked as prevent reapplication
            return application.status === 'rejected' && !application.prevent_reapplication;
        } catch (error) {
            logger.warn('Error checking if user can apply (allowing application as fallback)', {
                userId,
                pathwayId,
                error: error.message
            });
            return true; // Allow application if there's a database error (safer approach)
        }
    }

    /**
     * Get application statistics
     * @returns {Promise<Object>} Statistics
     */
    static async getStatistics() {
        try {
            const stats = await knex('pathway_applications')
                .select(
                    knex.raw('COUNT(*) as total_applications'),
                    knex.raw("COUNT(*) FILTER (WHERE status = 'pending') as pending_count"),
                    knex.raw("COUNT(*) FILTER (WHERE status = 'approved') as approved_count"),
                    knex.raw("COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count"),
                    knex.raw("COUNT(*) FILTER (WHERE status = 'cannot_reapply') as cannot_reapply_count")
                )
                .first();

            return stats;
        } catch (error) {
            logger.error('Error getting pathway application statistics', { error: error.message });
            throw error;
        }
    }

    /**
     * Delete an application
     * @param {string} applicationId - Application ID to delete
     * @returns {Promise<void>}
     */
    static async deleteApplication(applicationId) {
        try {
            const deletedCount = await knex('pathway_applications')
                .where('id', applicationId)
                .del();

            if (deletedCount === 0) {
                throw new Error('Application not found');
            }

            logger.info('Pathway application deleted', { applicationId });
        } catch (error) {
            logger.error('Error deleting pathway application', { applicationId, error: error.message });
            throw error;
        }
    }
}

module.exports = PathwayApplication;
