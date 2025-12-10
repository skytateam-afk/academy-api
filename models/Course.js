/**
 * Course Model
 * Handles course operations including creation, management, and enrollment
 */

const { pool } = require('../config/database');
const logger = require('../config/winston');
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

            let query = `
                SELECT
                    c.*,
                    cat.name as category_name,
                    cat.slug as category_slug,
                    u.username as instructor_username,
                    u.first_name as instructor_first_name,
                    u.last_name as instructor_last_name,
                    u.avatar_url as instructor_avatar_url,
                    st.name as subscription_tier_name,
                    st.slug as subscription_tier_slug,
                    COUNT(DISTINCT l.id) as lesson_count
                FROM courses c
                LEFT JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN users u ON c.instructor_id = u.id
                LEFT JOIN subscription_tiers st ON c.subscription_tier_id = st.id
                LEFT JOIN lessons l ON c.id = l.course_id
                WHERE 1=1
            `;

            const params = [];
            let paramCount = 1;

            // Search filter
            if (search) {
                query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
                params.push(`%${search}%`);
                paramCount++;
            }

            // Category filter
            if (categoryId) {
                query += ` AND c.category_id = $${paramCount}`;
                params.push(categoryId);
                paramCount++;
            }

            // Instructor filter
            if (instructorId) {
                query += ` AND c.instructor_id = $${paramCount}`;
                params.push(instructorId);
                paramCount++;
            }

            // Level filter
            if (level) {
                query += ` AND c.level = $${paramCount}`;
                params.push(level);
                paramCount++;
            }

            // Published filter
            if (isPublished !== undefined) {
                query += ` AND c.is_published = $${paramCount}`;
                params.push(isPublished);
                paramCount++;
            }

            // Featured filter
            if (isFeatured !== undefined) {
                query += ` AND c.is_featured = $${paramCount}`;
                params.push(isFeatured);
                paramCount++;
            }

            // Price range filter
            if (minPrice !== undefined) {
                query += ` AND c.price >= $${paramCount}`;
                params.push(minPrice);
                paramCount++;
            }

            if (maxPrice !== undefined) {
                query += ` AND c.price <= $${paramCount}`;
                params.push(maxPrice);
                paramCount++;
            }

            query += ` GROUP BY c.id, cat.id, u.id, st.id`;

            // Sorting
            const validSortFields = ['created_at', 'title', 'price', 'rating_average', 'enrollment_count', 'view_count'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
            const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            query += ` ORDER BY c.${sortField} ${order}`;

            // Pagination
            query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);

            // Get total count
            let countQuery = `
                SELECT COUNT(DISTINCT c.id) as total
                FROM courses c
                WHERE 1=1
            `;

            const countParams = [];
            let countParamCount = 1;

            if (search) {
                countQuery += ` AND (c.title ILIKE $${countParamCount} OR c.description ILIKE $${countParamCount})`;
                countParams.push(`%${search}%`);
                countParamCount++;
            }

            if (categoryId) {
                countQuery += ` AND c.category_id = $${countParamCount}`;
                countParams.push(categoryId);
                countParamCount++;
            }

            if (instructorId) {
                countQuery += ` AND c.instructor_id = $${countParamCount}`;
                countParams.push(instructorId);
                countParamCount++;
            }

            if (level) {
                countQuery += ` AND c.level = $${countParamCount}`;
                countParams.push(level);
                countParamCount++;
            }

            if (isPublished !== undefined) {
                countQuery += ` AND c.is_published = $${countParamCount}`;
                countParams.push(isPublished);
                countParamCount++;
            }

            if (isFeatured !== undefined) {
                countQuery += ` AND c.is_featured = $${countParamCount}`;
                countParams.push(isFeatured);
                countParamCount++;
            }

            if (minPrice !== undefined) {
                countQuery += ` AND c.price >= $${countParamCount}`;
                countParams.push(minPrice);
                countParamCount++;
            }

            if (maxPrice !== undefined) {
                countQuery += ` AND c.price <= $${countParamCount}`;
                countParams.push(maxPrice);
            }

            const countResult = await pool.query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].total);

            return {
                courses: result.rows,
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
            const result = await pool.query(
                `SELECT
                    c.*,
                    cat.name as category_name,
                    cat.slug as category_slug,
                    u.id as instructor_id,
                    u.username as instructor_username,
                    u.first_name as instructor_first_name,
                    u.last_name as instructor_last_name,
                    u.avatar_url as instructor_avatar_url,
                    u.bio as instructor_bio,
                    st.name as subscription_tier_name,
                    st.slug as subscription_tier_slug,
                    st.price as subscription_tier_price,
                    COUNT(DISTINCT l.id) as lesson_count,
                    COUNT(DISTINCT q.id) as quiz_count,
                    COUNT(DISTINCT a.id) as assignment_count
                FROM courses c
                LEFT JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN users u ON c.instructor_id = u.id
                LEFT JOIN subscription_tiers st ON c.subscription_tier_id = st.id
                LEFT JOIN lessons l ON c.id = l.course_id
                LEFT JOIN quizzes q ON c.id = q.course_id
                LEFT JOIN assignments a ON c.id = a.course_id
                WHERE c.id = $1
                GROUP BY c.id, cat.id, u.id, st.id`,
                [id]
            );

            if (result.rows.length === 0) {
                logger.warn('Course.getById: Course not found', { id });
                return null;
            }

            logger.info('Course.getById: Course found', { id, title: result.rows[0].title });

            const course = result.rows[0];

            // Get course tags
            const tagsResult = await pool.query(
                `SELECT t.id, t.name, t.slug
                 FROM tags t
                 JOIN course_tags ct ON t.id = ct.tag_id
                 WHERE ct.course_id = $1`,
                [id]
            );
            course.tags = tagsResult.rows;

            // Get prerequisites
            const prereqResult = await pool.query(
                `SELECT c.id, c.title, c.slug
                 FROM courses c
                 JOIN course_prerequisites cp ON c.id = cp.prerequisite_course_id
                 WHERE cp.course_id = $1`,
                [id]
            );
            course.prerequisites = prereqResult.rows;

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
            const result = await pool.query(
                'SELECT id FROM courses WHERE slug = $1',
                [slug]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return await this.getById(result.rows[0].id);
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
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const {
                title,
                description,
                shortDescription,
                thumbnailUrl,
                previewVideoUrl,
                categoryId,
                instructorId,
                subscriptionTierId,
                level,
                language,
                durationHours,
                price,
                currency,
                enrollmentLimit,
                isCertification,
                metadata,
                tags,
                prerequisites
            } = courseData;

            // Generate slug
            const slug = slugify(title, { lower: true, strict: true });

            // Check if slug already exists
            const existingCourse = await this.getBySlug(slug);
            if (existingCourse) {
                // Add random suffix to make it unique
                const randomSuffix = Math.random().toString(36).substring(7);
                courseData.slug = `${slug}-${randomSuffix}`;
            } else {
                courseData.slug = slug;
            }

            // Validate category
            if (categoryId) {
                const categoryResult = await client.query(
                    'SELECT id FROM categories WHERE id = $1',
                    [categoryId]
                );
                if (categoryResult.rows.length === 0) {
                    throw new Error('Category not found');
                }
            }

            // Validate instructor
            const instructorResult = await client.query(
                'SELECT id FROM users WHERE id = $1',
                [instructorId]
            );
            if (instructorResult.rows.length === 0) {
                throw new Error('Instructor not found');
            }

            // Insert course
            const result = await client.query(
                `INSERT INTO courses (
                    title, slug, description, short_description, thumbnail_url, preview_video_url,
                    category_id, instructor_id, subscription_tier_id, level, language, duration_hours, price, currency,
                    enrollment_limit, is_certification, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *`,
                [
                    title,
                    courseData.slug,
                    description || null,
                    shortDescription || null,
                    thumbnailUrl || null,
                    previewVideoUrl || null,
                    categoryId || null,
                    instructorId,
                    subscriptionTierId || null,
                    level || 'all',
                    language || 'en',
                    durationHours || null,
                    price || 0,
                    currency || 'USD',
                    enrollmentLimit || null,
                    isCertification !== undefined ? isCertification : false,
                    metadata ? JSON.stringify(metadata) : null
                ]
            );

            const courseId = result.rows[0].id;

            // Add tags if provided
            if (tags && tags.length > 0) {
                for (const tagName of tags) {
                    // Get or create tag
                    const tagSlug = slugify(tagName, { lower: true, strict: true });
                    let tagResult = await client.query(
                        'SELECT id FROM tags WHERE slug = $1',
                        [tagSlug]
                    );

                    let tagId;
                    if (tagResult.rows.length === 0) {
                        const newTag = await client.query(
                            'INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING id',
                            [tagName, tagSlug]
                        );
                        tagId = newTag.rows[0].id;
                    } else {
                        tagId = tagResult.rows[0].id;
                    }

                    // Link tag to course
                    await client.query(
                        'INSERT INTO course_tags (course_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [courseId, tagId]
                    );
                }
            }

            // Add prerequisites if provided
            if (prerequisites && prerequisites.length > 0) {
                for (const prereqId of prerequisites) {
                    await client.query(
                        'INSERT INTO course_prerequisites (course_id, prerequisite_course_id) VALUES ($1, $2)',
                        [courseId, prereqId]
                    );
                }
            }

            await client.query('COMMIT');

            logger.info('Course created', { courseId, title });
            return await this.getById(courseId);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error creating course', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update course
     * @param {string} id - Course ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated course
     */
    static async update(id, updateData) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

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
                subscriptionTierId,
                level,
                language,
                durationHours,
                price,
                currency,
                enrollmentLimit,
                isCertification,
                metadata,
                tags,
                prerequisites
            } = updateData;

            // Generate new slug if title changed
            let slug = course.slug;
            if (title && title !== course.title) {
                slug = slugify(title, { lower: true, strict: true });

                const existingCourse = await this.getBySlug(slug);
                if (existingCourse && existingCourse.id !== id) {
                    const randomSuffix = Math.random().toString(36).substring(7);
                    slug = `${slug}-${randomSuffix}`;
                }
            }

            // Update course
            const result = await client.query(
                `UPDATE courses
                 SET title = COALESCE($1, title),
                     slug = COALESCE($2, slug),
                     description = COALESCE($3, description),
                     short_description = COALESCE($4, short_description),
                     thumbnail_url = COALESCE($5, thumbnail_url),
                     preview_video_url = COALESCE($6, preview_video_url),
                     category_id = COALESCE($7, category_id),
                     subscription_tier_id = COALESCE($8, subscription_tier_id),
                     level = COALESCE($9, level),
                     language = COALESCE($10, language),
                     duration_hours = COALESCE($11, duration_hours),
                     price = COALESCE($12, price),
                     currency = COALESCE($13, currency),
                     enrollment_limit = COALESCE($14, enrollment_limit),
                     is_certification = COALESCE($15, is_certification),
                     metadata = COALESCE($16, metadata),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $17
                 RETURNING *`,
                [
                    title || null,
                    slug,
                    description !== undefined ? description : null,
                    shortDescription !== undefined ? shortDescription : null,
                    thumbnailUrl !== undefined ? thumbnailUrl : null,
                    previewVideoUrl !== undefined ? previewVideoUrl : null,
                    categoryId !== undefined ? categoryId : null,
                    subscriptionTierId !== undefined ? subscriptionTierId : null,
                    level || null,
                    language || null,
                    durationHours !== undefined ? durationHours : null,
                    price !== undefined ? price : null,
                    currency || null,
                    enrollmentLimit !== undefined ? enrollmentLimit : null,
                    isCertification !== undefined ? isCertification : null,
                    metadata ? JSON.stringify(metadata) : null,
                    id
                ]
            );

            // Update tags if provided
            if (tags !== undefined) {
                // Remove existing tags
                await client.query('DELETE FROM course_tags WHERE course_id = $1', [id]);

                // Add new tags
                if (tags.length > 0) {
                    for (const tagName of tags) {
                        const tagSlug = slugify(tagName, { lower: true, strict: true });
                        let tagResult = await client.query(
                            'SELECT id FROM tags WHERE slug = $1',
                            [tagSlug]
                        );

                        let tagId;
                        if (tagResult.rows.length === 0) {
                            const newTag = await client.query(
                                'INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING id',
                                [tagName, tagSlug]
                            );
                            tagId = newTag.rows[0].id;
                        } else {
                            tagId = tagResult.rows[0].id;
                        }

                        await client.query(
                            'INSERT INTO course_tags (course_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [id, tagId]
                        );
                    }
                }
            }

            // Update prerequisites if provided
            if (prerequisites !== undefined) {
                await client.query('DELETE FROM course_prerequisites WHERE course_id = $1', [id]);

                if (prerequisites.length > 0) {
                    for (const prereqId of prerequisites) {
                        await client.query(
                            'INSERT INTO course_prerequisites (course_id, prerequisite_course_id) VALUES ($1, $2)',
                            [id, prereqId]
                        );
                    }
                }
            }

            await client.query('COMMIT');

            logger.info('Course updated', { courseId: id });
            return await this.getById(id);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error updating course', { id, error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Delete course
     * @param {string} id - Course ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const course = await this.getById(id);
            if (!course) {
                throw new Error('Course not found');
            }

            // Check if course has enrollments
            if (parseInt(course.enrollment_count) > 0) {
                throw new Error('Cannot delete course with active enrollments');
            }

            await client.query('DELETE FROM courses WHERE id = $1', [id]);

            await client.query('COMMIT');

            logger.info('Course deleted', { courseId: id });
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error deleting course', { id, error: error.message });
            throw error;
        } finally {
            client.release();
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
            const publishedAt = isPublished ? new Date() : null;

            await pool.query(
                `UPDATE courses 
                 SET is_published = $1, published_at = $2, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3`,
                [isPublished, publishedAt, id]
            );

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
            await pool.query(
                `UPDATE courses 
                 SET is_featured = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [isFeatured, id]
            );

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
            await pool.query(
                'UPDATE courses SET view_count = view_count + 1 WHERE id = $1',
                [id]
            );
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

    /**
     * Enroll user in course
     * @param {string} courseId - Course ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Enrollment record
     */
    static async enrollUser(courseId, userId) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Check if user is already enrolled
            const existingEnrollment = await client.query(
                'SELECT id FROM enrollments WHERE course_id = $1 AND user_id = $2',
                [courseId, userId]
            );

            if (existingEnrollment.rows.length > 0) {
                throw new Error('User is already enrolled in this course');
            }

            // Check if user exists
            const userCheck = await client.query(
                'SELECT id FROM users WHERE id = $1',
                [userId]
            );

            if (userCheck.rows.length === 0) {
                throw new Error('User not found');
            }

            // Create enrollment
            const result = await client.query(
                `INSERT INTO enrollments (course_id, user_id, enrolled_at, status)
                 VALUES ($1, $2, CURRENT_TIMESTAMP, 'active')
                 RETURNING *`,
                [courseId, userId]
            );

            // Update enrollment count
            await client.query(
                'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = $1',
                [courseId]
            );

            await client.query('COMMIT');

            logger.info('User enrolled in course', { courseId, userId });
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error enrolling user in course', { courseId, userId, error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get course enrollments
     * @param {string} courseId - Course ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Enrollments with pagination
     */
    static async getEnrollments(courseId, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            const result = await pool.query(
                `SELECT 
                    e.*,
                    u.id as user_id,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.avatar_url
                FROM enrollments e
                JOIN users u ON e.user_id = u.id
                WHERE e.course_id = $1
                ORDER BY e.enrolled_at DESC
                LIMIT $2 OFFSET $3`,
                [courseId, limit, offset]
            );

            // Get total count
            const countResult = await pool.query(
                'SELECT COUNT(*) as total FROM enrollments WHERE course_id = $1',
                [courseId]
            );
            const total = parseInt(countResult.rows[0].total);

            return {
                enrollments: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error getting course enrollments', { courseId, error: error.message });
            throw error;
        }
    }

    /**
     * Unenroll user from course
     * @param {string} courseId - Course ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    static async unenrollUser(courseId, userId) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Check if user is enrolled
            const enrollment = await client.query(
                'SELECT id FROM enrollments WHERE course_id = $1 AND user_id = $2',
                [courseId, userId]
            );

            if (enrollment.rows.length === 0) {
                throw new Error('User is not enrolled in this course');
            }

            // Delete enrollment
            await client.query(
                'DELETE FROM enrollments WHERE course_id = $1 AND user_id = $2',
                [courseId, userId]
            );

            // Update enrollment count
            await client.query(
                'UPDATE courses SET enrollment_count = GREATEST(enrollment_count - 1, 0) WHERE id = $1',
                [courseId]
            );

            await client.query('COMMIT');

            logger.info('User unenrolled from course', { courseId, userId });
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error unenrolling user from course', { courseId, userId, error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get enrollment trends for a course (last 90 days)
     * @param {string} courseId - Course ID
     * @returns {Promise<Array>} Daily enrollment counts
     */
    static async getEnrollmentTrends(courseId) {
        try {
            const result = await pool.query(
                `SELECT
                    DATE(enrolled_at) as date,
                    COUNT(*) as enrollments
                FROM enrollments
                WHERE course_id = $1
                    AND enrolled_at >= CURRENT_DATE - INTERVAL '90 days'
                GROUP BY DATE(enrolled_at)
                ORDER BY date ASC`,
                [courseId]
            );

            return result.rows;
        } catch (error) {
            logger.error('Error getting enrollment trends', { courseId, error: error.message });
            throw error;
        }
    }

    /**
     * Check if user is enrolled in a course
     * @param {string} courseId - Course ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Enrollment status
     */
    static async checkUserEnrolled(courseId, userId) {
        try {
            const result = await pool.query(
                'SELECT id FROM enrollments WHERE course_id = $1 AND user_id = $2',
                [courseId, userId]
            );

            return result.rows.length > 0;
        } catch (error) {
            logger.error('Error checking user enrollment', { courseId, userId, error: error.message });
            return false;
        }
    }

    /**
     * Get reviews for a course with pagination
     * @param {string} courseId - Course ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Reviews with pagination
     */
    static async getCourseReviews(courseId, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            const result = await pool.query(
                `SELECT
                    cr.*,
                    u.username,
                    u.first_name,
                    u.last_name,
                    u.avatar_url,
                    COALESCE(NULLIF(u.first_name, ''), u.username) as display_name
                FROM course_reviews cr
                JOIN users u ON cr.user_id = u.id
                WHERE cr.course_id = $1 AND cr.is_published = true
                ORDER BY cr.created_at DESC
                LIMIT $2 OFFSET $3`,
                [courseId, limit, offset]
            );

            // Get total count
            const countResult = await pool.query(
                'SELECT COUNT(*) as total FROM course_reviews WHERE course_id = $1 AND is_published = true',
                [courseId]
            );

            const total = parseInt(countResult.rows[0].total);

            return {
                reviews: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error getting course reviews', { courseId, error: error.message });
            throw error;
        }
    }

    /**
     * Get a user's review for a specific course
     * @param {string} courseId - Course ID
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} User's review or null
     */
    static async getUserReviewForCourse(courseId, userId) {
        try {
            const result = await pool.query(
                `SELECT
                    cr.*,
                    u.username,
                    u.first_name,
                    u.last_name,
                    u.avatar_url
                FROM course_reviews cr
                JOIN users u ON cr.user_id = u.id
                WHERE cr.course_id = $1 AND cr.user_id = $2`,
                [courseId, userId]
            );

            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            logger.error('Error getting user review for course', { courseId, userId, error: error.message });
            throw error;
        }
    }

    /**
     * Add or update a review for a course
     * @param {string} courseId - Course ID
     * @param {string} userId - User ID
     * @param {number} rating - Rating (1-5)
     * @param {string} reviewText - Review text
     * @returns {Promise<Object>} Review record
     */
    static async addOrUpdateCourseReview(courseId, userId, rating, reviewText = null) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Validate rating
            if (rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }

            // Get enrollment ID (required for reviews)
            const enrollmentResult = await client.query(
                'SELECT id FROM enrollments WHERE course_id = $1 AND user_id = $2',
                [courseId, userId]
            );

            if (enrollmentResult.rows.length === 0) {
                throw new Error('User must be enrolled in the course to leave a review');
            }

            const enrollmentId = enrollmentResult.rows[0].id;

            // Upsert review
            const result = await client.query(
                `INSERT INTO course_reviews (enrollment_id, course_id, user_id, rating, review_text, is_published, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT (user_id, course_id)
                 DO UPDATE SET
                     enrollment_id = EXCLUDED.enrollment_id,
                     rating = EXCLUDED.rating,
                     review_text = EXCLUDED.review_text,
                     is_published = true,
                     updated_at = CURRENT_TIMESTAMP
                 RETURNING *`,
                [enrollmentId, courseId, userId, rating, reviewText]
            );

            await client.query('COMMIT');

            logger.info('Course review added/updated', { courseId, userId, rating });
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error adding course review', { courseId, userId, error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = Course;
