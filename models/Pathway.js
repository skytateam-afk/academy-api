/**
 * Pathway Model
 * Handles pathway operations including creation, management, and enrollment
 */

const knex = require('../config/knex');
const logger = require('../config/winston');
const slugify = require('slugify');
const Course = require('./Course');

class Pathway {
    /**
     * Get all pathways with pagination and filtering
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Pathways with pagination
     */
    static async getAll(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                categoryId,
                careerFocus,
                level,
                isPublished,
                isFeatured,
                minPrice,
                maxPrice,
                sortBy = 'created_at',
                sortOrder = 'DESC',
                institutionId, // New parameter to filter by institution
                enrolledByUserId // New parameter to filter by enrollment
            } = options;

            const offset = (page - 1) * limit;

            // Build base query
            let query = knex('pathways as p')
                .leftJoin('categories as cat', 'p.category_id', 'cat.id')
                .leftJoin('users as u', 'p.created_by', 'u.id')
                .leftJoin('subscription_tiers as st', 'p.subscription_tier_id', 'st.id')
                .leftJoin('pathway_enrollments as pe', 'p.id', 'pe.pathway_id')
                .leftJoin('pathway_courses as pc', 'p.id', 'pc.pathway_id')
                .select(
                    'p.*',
                    'cat.name as category_name',
                    'u.username as creator_username',
                    'u.first_name as creator_first_name',
                    'u.last_name as creator_last_name',
                    'st.name as subscription_tier_name',
                    'st.slug as subscription_tier_slug',
                    'st.price as subscription_tier_price',
                    knex.raw('COUNT(DISTINCT pe.id) as enrollment_count_actual'),
                    knex.raw('COUNT(DISTINCT pc.id) as actual_course_count')
                );

            // Apply filters
            // Filter by institution if provided (restrict pathways to user's institution)
            if (options.ignoreInstitutionFilter) {
                // Do not apply any institution filter - show all pathways
            } else if (institutionId) {
                query = query.where('p.institution_id', institutionId);
            } else {
                // By default, exclude pathways that belong to an institution from global lists
                query = query.whereNull('p.institution_id');
            }

            if (enrolledByUserId) {
                // Get user's institution_id
                const user = await knex('users').select('institution_id').where('id', enrolledByUserId).first();
                const userInstitutionId = user?.institution_id;

                query = query.leftJoin('pathway_enrollments as pe_filter', function () {
                    this.on('p.id', '=', 'pe_filter.pathway_id')
                        .andOn('pe_filter.user_id', '=', knex.raw('?', [enrolledByUserId]));
                }).where(function () {
                    this.whereNotNull('pe_filter.id'); // Explicitly enrolled
                    if (userInstitutionId) {
                        this.orWhere('p.institution_id', userInstitutionId); // Belongs to user's institution
                    }
                });
            }

            if (search) {
                query = query.where(function () {
                    this.where('p.title', 'ilike', `%${search}%`)
                        .orWhere('p.description', 'ilike', `%${search}%`)
                        .orWhere('p.career_focus', 'ilike', `%${search}%`);
                });
            }

            if (categoryId) {
                query = query.where('p.category_id', categoryId);
            }

            if (careerFocus) {
                query = query.where('p.career_focus', 'ilike', `%${careerFocus}%`);
            }

            if (level) {
                query = query.where('p.level', level);
            }

            if (isPublished !== undefined) {
                query = query.where('p.is_published', isPublished);
            }

            if (isFeatured !== undefined) {
                query = query.where('p.is_featured', isFeatured);
            }

            if (minPrice !== undefined) {
                query = query.where('p.price', '>=', minPrice);
            }

            if (maxPrice !== undefined) {
                query = query.where('p.price', '<=', maxPrice);
            }

            // Get total count
            const countQuery = query.clone()
                .clearSelect()
                .clearOrder()
                .countDistinct('p.id as total');
            const [{ total }] = await countQuery;

            // Apply grouping, sorting and pagination
            query = query.groupBy('p.id', 'cat.id', 'u.id', 'st.id');

            const validSortFields = ['created_at', 'title', 'price', 'rating_average', 'enrollment_count', 'course_count'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
            const order = sortOrder.toUpperCase() === 'ASC' ? 'asc' : 'desc';

            query = query.orderBy(`p.${sortField}`, order)
                .limit(limit)
                .offset(offset);

            const pathways = await query;

            return {
                pathways,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(total),
                    totalPages: Math.ceil(parseInt(total) / limit)
                }
            };
        } catch (error) {
            logger.error('Error getting pathways', { error: error.message });
            throw error;
        }
    }

    /**
     * Get pathway by ID with full details including courses
     * @param {string} id - Pathway ID
     * @returns {Promise<Object>} Pathway details
     */
    static async getById(id) {
        try {
            const pathway = await knex('pathways as p')
                .leftJoin('categories as cat', 'p.category_id', 'cat.id')
                .leftJoin('users as u', 'p.created_by', 'u.id')
                .leftJoin('subscription_tiers as st', 'p.subscription_tier_id', 'st.id')
                .leftJoin('pathway_enrollments as pe', 'p.id', 'pe.pathway_id')
                .select(
                    'p.*',
                    'cat.name as category_name',
                    'u.username as creator_username',
                    'u.first_name as creator_first_name',
                    'u.last_name as creator_last_name',
                    'st.name as subscription_tier_name',
                    'st.slug as subscription_tier_slug',
                    'st.price as subscription_tier_price',
                    knex.raw('COUNT(DISTINCT pe.id) as enrollment_count_actual')
                )
                .where('p.id', id)
                .groupBy('p.id', 'cat.id', 'u.id', 'st.id')
                .first();

            if (!pathway) {
                return null;
            }

            // Get courses in this pathway
            const courses = await knex('pathway_courses as pc')
                .join('courses as c', 'pc.course_id', 'c.id')
                .select(
                    'pc.*',
                    'c.title',
                    'c.slug',
                    'c.description',
                    'c.short_description',
                    'c.thumbnail_url',
                    'c.level',
                    'c.duration_hours',
                    'c.price',
                    'c.currency',
                    'c.is_published'
                )
                .where('pc.pathway_id', id)
                .orderBy('pc.sequence_order', 'asc');

            pathway.courses = courses;

            return pathway;
        } catch (error) {
            logger.error('Error getting pathway by ID', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Get pathway by slug
     * @param {string} slug - Pathway slug
     * @returns {Promise<Object>} Pathway details
     */
    static async getBySlug(slug) {
        try {
            const pathway = await knex('pathways')
                .select('id')
                .where('slug', slug)
                .first();

            if (!pathway) {
                return null;
            }

            return await this.getById(pathway.id);
        } catch (error) {
            logger.error('Error getting pathway by slug', { slug, error: error.message });
            throw error;
        }
    }

    /**
     * Create new pathway
     * @param {Object} pathwayData - Pathway data
     * @returns {Promise<Object>} Created pathway
     */
    static async create(pathwayData) {
        const trx = await knex.transaction();

        try {
            const {
                title,
                description,
                shortDescription,
                thumbnailUrl,
                bannerUrl,
                careerFocus,
                categoryId,
                subscriptionTierId,
                level,
                price,
                currency,
                hasCertification,
                certificationCriteria,
                enrollmentLimit,
                createdBy,
                institution_id, // Deprecated, kept for DB schema compatibility if needed but ignored
                metadata
            } = pathwayData;

            // Generate slug
            const slug = slugify(title, { lower: true, strict: true });

            // Check if slug already exists
            const existingPathway = await this.getBySlug(slug);
            let finalSlug = slug;
            if (existingPathway) {
                const randomSuffix = Math.random().toString(36).substring(7);
                finalSlug = `${slug}-${randomSuffix}`;
            }

            // Insert pathway
            const [pathway] = await trx('pathways')
                .insert({
                    title,
                    slug: finalSlug,
                    description: description || null,
                    short_description: shortDescription || null,
                    thumbnail_url: thumbnailUrl || null,
                    banner_url: bannerUrl || null,
                    career_focus: careerFocus || null,
                    category_id: categoryId || null,
                    subscription_tier_id: subscriptionTierId || null,
                    level: level || 'all',
                    price: price || 0,
                    currency: currency || 'USD',
                    has_certification: hasCertification || false,
                    certification_criteria: certificationCriteria || null,
                    enrollment_limit: enrollmentLimit || null,
                    created_by: createdBy,
                    institution_id: Array.isArray(institution_id) ? (institution_id[0] || null) : (institution_id || null),
                    metadata: metadata ? JSON.stringify(metadata) : null
                })
                .returning('*');

            if (pathwayData.institution_id && Array.isArray(pathwayData.institution_id) && pathwayData.institution_id.length > 0) {
                const institutionsToInsert = pathwayData.institution_id.map(instId => ({
                    pathway_id: pathway.id,
                    institution_id: instId
                }));

                // Dedup based on institution_id
                const uniqueInstitutions = [...new Map(institutionsToInsert.map(item => [item.institution_id, item])).values()];

                await trx('pathway_institutions').insert(uniqueInstitutions);
            } else if (institution_id && !Array.isArray(institution_id)) {
                // Backward compatibility
                await trx('pathway_institutions').insert({
                    pathway_id: pathway.id,
                    institution_id: institution_id
                });
            }

            await trx.commit();

            logger.info('Pathway created', { pathwayId: pathway.id, title });
            return await this.getById(pathway.id);
        } catch (error) {
            await trx.rollback();
            logger.error('Error creating pathway', { error: error.message });
            throw error;
        }
    }

    /**
     * Update pathway
     * @param {string} id - Pathway ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated pathway
     */
    static async update(id, updateData) {
        const trx = await knex.transaction();

        try {
            const pathway = await this.getById(id);
            if (!pathway) {
                throw new Error('Pathway not found');
            }

            const {
                title,
                description,
                shortDescription,
                thumbnailUrl,
                bannerUrl,
                careerFocus,
                categoryId,
                subscriptionTierId,
                level,
                price,
                currency,
                hasCertification,
                certificationCriteria,
                enrollmentLimit,

                metadata,
                institution_id
            } = updateData;

            // Generate new slug if title changed
            let slug = pathway.slug;
            if (title && title !== pathway.title) {
                slug = slugify(title, { lower: true, strict: true });

                const existingPathway = await this.getBySlug(slug);
                if (existingPathway && existingPathway.id !== id) {
                    const randomSuffix = Math.random().toString(36).substring(7);
                    slug = `${slug}-${randomSuffix}`;
                }
            }

            const updates = {
                updated_at: trx.fn.now()
            };

            if (title !== undefined) updates.title = title;
            if (slug !== pathway.slug) updates.slug = slug;
            if (description !== undefined) updates.description = description;
            if (shortDescription !== undefined) updates.short_description = shortDescription;
            if (thumbnailUrl !== undefined) updates.thumbnail_url = thumbnailUrl;
            if (bannerUrl !== undefined) updates.banner_url = bannerUrl;
            if (careerFocus !== undefined) updates.career_focus = careerFocus;
            if (categoryId !== undefined) updates.category_id = categoryId;
            if (subscriptionTierId !== undefined) updates.subscription_tier_id = subscriptionTierId;
            if (level !== undefined) updates.level = level;
            if (price !== undefined) updates.price = price;
            if (currency !== undefined) updates.currency = currency;
            if (hasCertification !== undefined) updates.has_certification = hasCertification;
            if (certificationCriteria !== undefined) updates.certification_criteria = certificationCriteria;
            if (enrollmentLimit !== undefined) updates.enrollment_limit = enrollmentLimit;
            if (metadata !== undefined) updates.metadata = metadata ? JSON.stringify(metadata) : null;
            if (institution_id !== undefined && !Array.isArray(institution_id)) {
                // Backward compatibility for single institution_id column
                updates.institution_id = institution_id || null;
            }

            await trx('pathways')
                .where('id', id)
                .update(updates);

            // Handle many-to-many institution relationship if provided
            if (institution_id !== undefined) {
                // First remove existing associations
                await trx('pathway_institutions').where('pathway_id', id).delete();

                if (Array.isArray(institution_id) && institution_id.length > 0) {
                    const institutionsToInsert = institution_id.map(instId => ({
                        pathway_id: id,
                        institution_id: instId
                    }));
                    // Dedup
                    const uniqueInstitutions = [...new Map(institutionsToInsert.map(item => [item.institution_id, item])).values()];
                    await trx('pathway_institutions').insert(uniqueInstitutions);
                } else if (institution_id && !Array.isArray(institution_id)) {
                    await trx('pathway_institutions').insert({
                        pathway_id: id,
                        institution_id: institution_id
                    });
                }
            }

            await trx.commit();

            logger.info('Pathway updated', { pathwayId: id });
            return await this.getById(id);
        } catch (error) {
            await trx.rollback();
            logger.error('Error updating pathway', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Delete pathway
     * @param {string} id - Pathway ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        const trx = await knex.transaction();

        try {
            const pathway = await this.getById(id);
            if (!pathway) {
                throw new Error('Pathway not found');
            }

            // Check if pathway has enrollments
            if (parseInt(pathway.enrollment_count_actual) > 0) {
                throw new Error('Cannot delete pathway with active enrollments');
            }

            await trx('pathways')
                .where('id', id)
                .delete();

            await trx.commit();

            logger.info('Pathway deleted', { pathwayId: id });
            return true;
        } catch (error) {
            await trx.rollback();
            logger.error('Error deleting pathway', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Add course to pathway
     * @param {string} pathwayId - Pathway ID
     * @param {Object} courseData - Course data
     * @returns {Promise<Object>} Added course details
     */
    static async addCourse(pathwayId, courseData) {
        const trx = await knex.transaction();

        try {
            const { courseId, sequenceOrder, isRequired, description, learningObjectives, prerequisiteCourseId } = courseData;

            // Check if course already exists in pathway
            const existing = await trx('pathway_courses')
                .where({ pathway_id: pathwayId, course_id: courseId })
                .first();

            if (existing) {
                throw new Error('Course already exists in this pathway');
            }

            const [course] = await trx('pathway_courses')
                .insert({
                    pathway_id: pathwayId,
                    course_id: courseId,
                    sequence_order: sequenceOrder,
                    is_required: isRequired !== undefined ? isRequired : true,
                    description: description || null,
                    learning_objectives: learningObjectives ? JSON.stringify(learningObjectives) : null,
                    prerequisite_course_id: prerequisiteCourseId || null
                })
                .returning('*');

            // Update pathway course count and duration
            await this.updatePathwayStats(pathwayId, trx);

            await trx.commit();

            // Automatically enroll all pathway members in the new course
            try {
                await this.enrollPathwayMembersInCourse(pathwayId, courseId);
                logger.info('Auto-enrolled pathway members in new course', { pathwayId, courseId });
            } catch (autoEnrollError) {
                logger.warn('Auto-enrollment failed for new pathway course', {
                    pathwayId,
                    courseId,
                    error: autoEnrollError.message
                });
                // Don't fail the whole operation for auto-enrollment failures
            }

            logger.info('Course added to pathway', { pathwayId, courseId });
            return course;
        } catch (error) {
            await trx.rollback();
            logger.error('Error adding course to pathway', { pathwayId, error: error.message });
            throw error;
        }
    }

    /**
     * Remove course from pathway
     * @param {string} pathwayId - Pathway ID
     * @param {string} courseId - Course ID
     * @returns {Promise<boolean>} Success status
     */
    static async removeCourse(pathwayId, courseId) {
        const trx = await knex.transaction();

        try {
            await trx('pathway_courses')
                .where({ pathway_id: pathwayId, course_id: courseId })
                .delete();

            // Update pathway stats
            await this.updatePathwayStats(pathwayId, trx);

            await trx.commit();

            // Automatically unenroll all pathway members from the removed course
            try {
                await this.unenrollPathwayMembersFromCourse(pathwayId, courseId);
                logger.info('Auto-unenrolled pathway members from removed course', { pathwayId, courseId });
            } catch (autoUnenrollError) {
                logger.warn('Auto-unenrollment failed for removed pathway course', {
                    pathwayId,
                    courseId,
                    error: autoUnenrollError.message
                });
                // Don't fail the whole operation for auto-unenrollment failures
            }

            logger.info('Course removed from pathway', { pathwayId, courseId });
            return true;
        } catch (error) {
            await trx.rollback();
            logger.error('Error removing course from pathway', { pathwayId, courseId, error: error.message });
            throw error;
        }
    }

    /**
     * Update pathway stats (course count, total duration)
     * @param {string} pathwayId - Pathway ID
     * @param {Object} trxOrKnex - Transaction or Knex instance
     */
    static async updatePathwayStats(pathwayId, trxOrKnex = knex) {
        const stats = await trxOrKnex('pathway_courses as pc')
            .join('courses as c', 'pc.course_id', 'c.id')
            .where('pc.pathway_id', pathwayId)
            .select(
                trxOrKnex.raw('COUNT(pc.id) as course_count'),
                trxOrKnex.raw('SUM(c.duration_hours) as total_duration')
            )
            .first();

        await trxOrKnex('pathways')
            .where('id', pathwayId)
            .update({
                course_count: stats.course_count || 0,
                estimated_duration_hours: stats.total_duration || 0
            });
    }

    /**
     * Publish/unpublish pathway
     * @param {string} id - Pathway ID
     * @param {boolean} isPublished - Publish status
     * @returns {Promise<Object>} Updated pathway
     */
    static async togglePublish(id, isPublished) {
        try {
            const publishedAt = isPublished ? new Date() : null;

            await knex('pathways')
                .where('id', id)
                .update({
                    is_published: isPublished,
                    published_at: publishedAt,
                    updated_at: new Date()
                });

            logger.info('Pathway publish status updated', { pathwayId: id, isPublished });
            return await this.getById(id);
        } catch (error) {
            logger.error('Error toggling pathway publish status', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Toggle featured status
     * @param {string} id - Pathway ID
     * @param {boolean} isFeatured - Featured status
     * @returns {Promise<Object>} Updated pathway
     */
    static async toggleFeatured(id, isFeatured) {
        try {
            await knex('pathways')
                .where('id', id)
                .update({
                    is_featured: isFeatured,
                    updated_at: new Date()
                });

            logger.info('Pathway featured status updated', { pathwayId: id, isFeatured });
            return await this.getById(id);
        } catch (error) {
            logger.error('Error toggling pathway featured status', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Automatically enroll all pathway members in a new course
     * @param {string} pathwayId - Pathway ID
     * @param {string} courseId - Course ID
     */
    static async enrollPathwayMembersInCourse(pathwayId, courseId) {
        try {
            // Get all users enrolled in this pathway
            const enrolledUsers = await knex('pathway_enrollments')
                .select('user_id')
                .where('pathway_id', pathwayId)
                .where('status', 'active');

            if (enrolledUsers.length === 0) {
                logger.info('No users to enroll in new pathway course', { pathwayId, courseId });
                return;
            }

            // Enroll each user in the course (will skip if already enrolled)
            for (const { user_id } of enrolledUsers) {
                try {
                    await Course.enrollUser(courseId, user_id);
                    logger.info('Auto-enrolled user in pathway course', { userId: user_id, courseId, pathwayId });
                } catch (enrollError) {
                    logger.warn('Failed to auto-enroll user in pathway course', {
                        userId: user_id,
                        courseId,
                        pathwayId,
                        error: enrollError.message
                    });
                }
            }

            logger.info('Completed auto-enrollment for pathway course', { pathwayId, courseId, userCount: enrolledUsers.length });
        } catch (error) {
            logger.error('Error auto-enrolling pathway members in course', { pathwayId, courseId, error: error.message });
            throw error;
        }
    }

    /**
     * Automatically unenroll all pathway members from a removed course
     * @param {string} pathwayId - Pathway ID
     * @param {string} courseId - Course ID
     */
    static async unenrollPathwayMembersFromCourse(pathwayId, courseId) {
        try {
            // Get all users enrolled in this pathway
            const enrolledUsers = await knex('pathway_enrollments')
                .select('user_id')
                .where('pathway_id', pathwayId)
                .where('status', 'active');

            if (enrolledUsers.length === 0) {
                logger.info('No users to unenroll from removed pathway course', { pathwayId, courseId });
                return;
            }

            // Unenroll each user from the course (will skip if not enrolled)
            for (const { user_id } of enrolledUsers) {
                try {
                    await Course.unenrollUser(courseId, user_id);
                    logger.info('Auto-unenrolled user from removed pathway course', { userId: user_id, courseId, pathwayId });
                } catch (unenrollError) {
                    logger.warn('Failed to auto-unenroll user from pathway course', {
                        userId: user_id,
                        courseId,
                        pathwayId,
                        error: unenrollError.message
                    });
                }
            }

            logger.info('Completed auto-unenrollment for removed pathway course', { pathwayId, courseId, userCount: enrolledUsers.length });
        } catch (error) {
            logger.error('Error auto-unenrolling pathway members from course', { pathwayId, courseId, error: error.message });
            throw error;
        }
    }

    /**
     * Enroll a user in all courses that are part of a pathway
     * @param {string} pathwayId - Pathway ID
     * @param {string} userId - User ID to enroll
     */
    static async enrollMemberInAllPathwayCourses(pathwayId, userId) {
        try {
            // Get all courses in this pathway
            const pathwayCourses = await knex('pathway_courses')
                .select('course_id')
                .where('pathway_id', pathwayId)
                .orderBy('sequence_order', 'asc');

            if (pathwayCourses.length === 0) {
                logger.info('No courses in pathway to enroll user in', { pathwayId, userId });
                return;
            }

            // Enroll user in each course (will skip if already enrolled)
            for (const { course_id } of pathwayCourses) {
                try {
                    await Course.enrollUser(course_id, userId);
                    logger.info('Enrolled pathway member in course', { userId, courseId: course_id, pathwayId });
                } catch (enrollError) {
                    logger.warn('Failed to enroll pathway member in course', {
                        userId,
                        courseId: course_id,
                        pathwayId,
                        error: enrollError.message
                    });
                }
            }

            logger.info('Completed enrollment for pathway member', {
                pathwayId,
                userId,
                courseCount: pathwayCourses.length
            });
        } catch (error) {
            logger.error('Error enrolling pathway member in all courses', { pathwayId, userId, error: error.message });
            throw error;
        }
    }

    /**
     * Get featured pathways
     * @param {number} limit - Number of pathways to return
     * @returns {Promise<Array>} Featured pathways
     */
    static async getFeatured(limit = 10) {
        try {
            const result = await this.getAll({
                isFeatured: true,
                isPublished: true,
                limit,
                sortBy: 'rating_average',
                sortOrder: 'DESC'
            });

            return result.pathways;
        } catch (error) {
            logger.error('Error getting featured pathways', { error: error.message });
            throw error;
        }
    }
}

module.exports = Pathway;
