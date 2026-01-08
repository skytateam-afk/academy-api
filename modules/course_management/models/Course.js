/**
 * Course Model
 * Handles course operations including creation, management, and enrollment
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');
const slugify = require('slugify');

class Course {
    /**
     * Get all courses with pagination and filtering
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Courses with pagination
     */
    static async getAll(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                categoryId,
                instructorId,
                level,
                isPublished,
                isFeatured,
                minPrice,
                maxPrice,
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;
            
            // Build base query
            let query = knex('courses as c')
                .select(
                    'c.*',
                    'cat.name as category_name',
                    'cat.slug as category_slug',
                    'u.username as instructor_username',
                    'u.first_name as instructor_first_name',
                    'u.last_name as instructor_last_name'
                )
                .count('l.id as lesson_count')
                .leftJoin('categories as cat', 'c.category_id', 'cat.id')
                .leftJoin('users as u', 'c.instructor_id', 'u.id')
                .leftJoin('lessons as l', 'c.id', 'l.course_id');

            // Apply filters
            if (search) {
                query = query.where(function() {
                    this.where('c.title', 'ilike', `%${search}%`)
                        .orWhere('c.description', 'ilike', `%${search}%`);
                });
            }

            if (categoryId) {
                query = query.where('c.category_id', categoryId);
            }

            if (instructorId) {
                query = query.where('c.instructor_id', instructorId);
            }

            if (level) {
                query = query.where('c.level', level);
            }

            if (isPublished !== undefined) {
                query = query.where('c.is_published', isPublished);
            }

            if (isFeatured !== undefined) {
                query = query.where('c.is_featured', isFeatured);
            }

            if (minPrice !== undefined) {
                query = query.where('c.price', '>=', minPrice);
            }

            if (maxPrice !== undefined) {
                query = query.where('c.price', '<=', maxPrice);
            }

            query = query.groupBy('c.id', 'cat.id', 'u.id');

            // Get total count before pagination
            const countQuery = query.clone();
            const totalResult = await countQuery.count('c.id as count').first();
            const total = parseInt(totalResult?.count || 0);

            // Sorting
            const validSortFields = ['created_at', 'title', 'price', 'rating_average', 'view_count'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
            const order = sortOrder.toUpperCase() === 'ASC' ? 'asc' : 'desc';
            
            query = query.orderBy(`c.${sortField}`, order);

            // Pagination
            const courses = await query.limit(limit).offset(offset);

            return {
                courses,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error getting courses', { error: error.message });
            throw error;
        }
    }

    /**
     * Get course by ID with full details
     * @param {string} id - Course ID
     * @returns {Promise<Object>} Course details
     */
    static async getById(id) {
        try {
            const course = await knex('courses as c')
                .select(
                    'c.*',
                    'cat.name as category_name',
                    'cat.slug as category_slug',
                    'u.id as instructor_id',
                    'u.username as instructor_username',
                    'u.first_name as instructor_first_name',
                    'u.last_name as instructor_last_name',
                    'u.avatar_url as instructor_avatar_url',
                    'u.bio as instructor_bio'
                )
                .count('l.id as lesson_count')
                .count('q.id as quiz_count')
                .count('a.id as assignment_count')
                .leftJoin('categories as cat', 'c.category_id', 'cat.id')
                .leftJoin('users as u', 'c.instructor_id', 'u.id')
                .leftJoin('lessons as l', 'c.id', 'l.course_id')
                .leftJoin('quizzes as q', 'c.id', 'q.course_id')
                .leftJoin('assignments as a', 'c.id', 'a.course_id')
                .where('c.id', id)
                .groupBy('c.id', 'cat.id', 'u.id')
                .first();

            if (!course) {
                return null;
            }

            // Get course tags
            const tags = await knex('tags as t')
                .select('t.id', 't.name', 't.slug')
                .join('course_tags as ct', 't.id', 'ct.tag_id')
                .where('ct.course_id', id);
            
            course.tags = tags;

            // Get prerequisites
            const prerequisites = await knex('courses as c')
                .select('c.id', 'c.title', 'c.slug')
                .join('course_prerequisites as cp', 'c.id', 'cp.prerequisite_course_id')
                .where('cp.course_id', id);
            
            course.prerequisites = prerequisites;

            return course;
        } catch (error) {
            logger.error('Error getting course by ID', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Get course by slug
     * @param {string} slug - Course slug
     * @returns {Promise<Object>} Course details
     */
    static async getBySlug(slug) {
        try {
            const result = await knex('courses')
                .select('id')
                .where({ slug })
                .first();

            if (!result) {
                return null;
            }

            return await this.getById(result.id);
        } catch (error) {
            logger.error('Error getting course by slug', { slug, error: error.message });
            throw error;
        }
    }

    /**
     * Create new course
     * @param {Object} courseData - Course data
     * @returns {Promise<Object>} Created course
     */
    static async create(courseData) {
        const trx = await knex.transaction();
        
        try {
            const {
                title,
                description,
                shortDescription,
                thumbnailUrl,
                previewVideoUrl,
                categoryId,
                instructorId,
                level,
                language,
                durationHours,
                price,
                currency,
                enrollmentLimit,
                metadata,
                tags,
                prerequisites
            } = courseData;

            // Generate slug
            let slug = slugify(title, { lower: true, strict: true });

            // Check if slug already exists
            const existingCourse = await this.getBySlug(slug);
            if (existingCourse) {
                const randomSuffix = Math.random().toString(36).substring(7);
                slug = `${slug}-${randomSuffix}`;
            }

            // Validate category
            if (categoryId) {
                const category = await trx('categories').where({ id: categoryId }).first();
                if (!category) {
                    throw new Error('Category not found');
                }
            }

            // Validate instructor
            const instructor = await trx('users').where({ id: instructorId }).first();
            if (!instructor) {
                throw new Error('Instructor not found');
            }

            // Insert course
            const [course] = await trx('courses')
                .insert({
                    title,
                    slug,
                    description: description || null,
                    short_description: shortDescription || null,
                    thumbnail_url: thumbnailUrl || null,
                    preview_video_url: previewVideoUrl || null,
                    category_id: categoryId || null,
                    instructor_id: instructorId,
                    level: level || 'all',
                    language: language || 'en',
                    duration_hours: durationHours || null,
                    price: price || 0,
                    currency: currency || 'USD',
                    enrollment_limit: enrollmentLimit || null,
                    metadata: metadata ? JSON.stringify(metadata) : null
                })
                .returning('*');

            const courseId = course.id;

            // Add tags if provided
            if (tags && tags.length > 0) {
                for (const tagName of tags) {
                    const tagSlug = slugify(tagName, { lower: true, strict: true });
                    
                    let tag = await trx('tags').where({ slug: tagSlug }).first();

                    if (!tag) {
                        [tag] = await trx('tags')
                            .insert({ name: tagName, slug: tagSlug })
                            .returning('*');
                    }

                    await trx('course_tags')
                        .insert({ course_id: courseId, tag_id: tag.id })
                        .onConflict(['course_id', 'tag_id'])
                        .ignore();
                }
            }

            // Add prerequisites if provided
            if (prerequisites && prerequisites.length > 0) {
                const prereqInserts = prerequisites.map(prereqId => ({
                    course_id: courseId,
                    prerequisite_course_id: prereqId
                }));
                
                await trx('course_prerequisites').insert(prereqInserts);
            }

            await trx.commit();

            logger.info('Course created', { courseId, title });
            return await this.getById(courseId);
        } catch (error) {
            await trx.rollback();
            logger.error('Error creating course', { error: error.message });
            throw error;
        }
    }

    /**
     * Update course
     * @param {string} id - Course ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated course
     */
    static async update(id, updateData) {
        const trx = await knex.transaction();
        
        try {
            const course = await this.getById(id);
            if (!course) {
                throw new Error('Course not found');
            }

            const {
                title,
                description,
                shortDescription,
                thumbnailUrl,
                previewVideoUrl,
                categoryId,
                level,
                language,
                durationHours,
                price,
                currency,
                enrollmentLimit,
                metadata,
                tags,
                prerequisites
            } = updateData;

            const updates = { updated_at: new Date()}

            // Generate new slug if title changed
            if (title && title !== course.title) {
                let slug = slugify(title, { lower: true, strict: true });
                
                const existingCourse = await this.getBySlug(slug);
                if (existingCourse && existingCourse.id !== id) {
                    const randomSuffix = Math.random().toString(36).substring(7);
                    slug = `${slug}-${randomSuffix}`;
                }
                
                updates.title = title;
                updates.slug = slug;
            }

            if (description !== undefined) updates.description = description;
            if (shortDescription !== undefined) updates.short_description = shortDescription;
            if (thumbnailUrl !== undefined) updates.thumbnail_url = thumbnailUrl;
            if (previewVideoUrl !== undefined) updates.preview_video_url = previewVideoUrl;
            if (categoryId !== undefined) updates.category_id = categoryId;
            if (level !== undefined) updates.level = level;
            if (language !== undefined) updates.language = language;
            if (durationHours !== undefined) updates.duration_hours = durationHours;
            if (price !== undefined) updates.price = price;
            if (currency !== undefined) updates.currency = currency;
            if (enrollmentLimit !== undefined) updates.enrollment_limit = enrollmentLimit;
            if (metadata !== undefined) updates.metadata = JSON.stringify(metadata);

            await trx('courses').where({ id }).update(updates);

            // Update tags if provided
            if (tags !== undefined) {
                await trx('course_tags').where({ course_id: id }).delete();

                if (tags.length > 0) {
                    for (const tagName of tags) {
                        const tagSlug = slugify(tagName, { lower: true, strict: true });
                        
                        let tag = await trx('tags').where({ slug: tagSlug }).first();

                        if (!tag) {
                            [tag] = await trx('tags')
                                .insert({ name: tagName, slug: tagSlug })
                                .returning('*');
                        }

                        await trx('course_tags')
                            .insert({ course_id: id, tag_id: tag.id })
                            .onConflict(['course_id', 'tag_id'])
                            .ignore();
                    }
                }
            }

            // Update prerequisites if provided
            if (prerequisites !== undefined) {
                await trx('course_prerequisites').where({ course_id: id }).delete();

                if (prerequisites.length > 0) {
                    const prereqInserts = prerequisites.map(prereqId => ({
                        course_id: id,
                        prerequisite_course_id: prereqId
                    }));
                    
                    await trx('course_prerequisites').insert(prereqInserts);
                }
            }

            await trx.commit();

            logger.info('Course updated', { courseId: id });
            return await this.getById(id);
        } catch (error) {
            await trx.rollback();
            logger.error('Error updating course', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Delete course
     * @param {string} id - Course ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        const trx = await knex.transaction();
        
        try {
            const course = await this.getById(id);
            if (!course) {
                throw new Error('Course not found');
            }

            // Check if course has enrollments
            if (parseInt(course.enrollment_count) > 0) {
                throw new Error('Cannot delete course with active enrollments');
            }

            await trx('courses').where({ id }).delete();

            await trx.commit();

            logger.info('Course deleted', { courseId: id });
            return true;
        } catch (error) {
            await trx.rollback();
            logger.error('Error deleting course', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Publish/unpublish course
     * @param {string} id - Course ID
     * @param {boolean} isPublished - Publish status
     * @returns {Promise<Object>} Updated course
     */
    static async togglePublish(id, isPublished) {
        try {
            const publishedAt = isPublished ? new Date():null;

            await knex('courses')
                .where({ id })
                .update({
                    is_published: isPublished,
                    published_at: publishedAt,
                    updated_at: new Date()
                });

            logger.info('Course publish status updated', { courseId: id, isPublished });
            return await this.getById(id);
        } catch (error) {
            logger.error('Error toggling course publish status', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Toggle featured status
     * @param {string} id - Course ID
     * @param {boolean} isFeatured - Featured status
     * @returns {Promise<Object>} Updated course
     */
    static async toggleFeatured(id, isFeatured) {
        try {
            await knex('courses')
                .where({ id })
                .update({
                    is_featured: isFeatured,
                    updated_at: new Date()
                });

            logger.info('Course featured status updated', { courseId: id, isFeatured });
            return await this.getById(id);
        } catch (error) {
            logger.error('Error toggling course featured status', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Increment view count
     * @param {string} id - Course ID
     * @returns {Promise<void>}
     */
    static async incrementViewCount(id) {
        try {
            await knex('courses')
                .where({ id })
                .increment('view_count', 1);
        } catch (error) {
            logger.error('Error incrementing view count', { id, error: error.message });
            // Don't throw error for view count
        }
    }

    /**
     * Get courses by instructor
     * @param {string} instructorId - Instructor ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Courses with pagination
     */
    static async getByInstructor(instructorId, options = {}) {
        return await this.getAll({ ...options, instructorId });
    }

    /**
     * Get featured courses
     * @param {number} limit - Number of courses to return
     * @returns {Promise<Array>} Featured courses
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

            return result.courses;
        } catch (error) {
            logger.error('Error getting featured courses', { error: error.message });
            throw error;
        }
    }
}

module.exports = Course;
