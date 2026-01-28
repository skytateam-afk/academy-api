/**
 * User Model
 * Handles all user-related database operations with RBAC support
 */

const bcrypt = require('bcrypt');
const knex = require('../../../config/knex');
const logger = require('../../../config/winston');
const { generateUniqueUsername } = require('../../../utils/usernameGenerator');

const SALT_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCKOUT_DURATION = parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 30;

class User {
    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    static async create(userData) {
        let {
            username,
            email,
            password,
            first_name,
            last_name,
            phone,
            date_of_birth,
            role_name = 'student',
            institution_id = null,
            student_id = null,
            department = null,
            level = null
        } = userData;

        try {
            // Auto-generate username if not provided
            if (!username) {
                username = await generateUniqueUsername(async (usernameToCheck) => {
                    const existing = await knex('users')
                        .where({ username: usernameToCheck })
                        .first();
                    return !!existing;
                });
            }

            // Hash password
            const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

            // Get role ID
            const role = await knex('roles')
                .select('id')
                .where({ name: role_name })
                .first();

            if (!role) {
                throw new Error(`Role '${role_name}' not found`);
            }

            // Insert user
            const [user] = await knex('users')
                .insert({
                    username,
                    email,
                    password_hash,
                    first_name: first_name || null,
                    last_name: last_name || null,
                    phone: phone || null,
                    date_of_birth: date_of_birth || null,
                    role_id: role.id,
                    institution_id: institution_id,
                    student_id: student_id,
                    department: department,
                    level: level
                })
                .returning([
                    'id', 'username', 'email', 'first_name', 'last_name',
                    'phone', 'date_of_birth', 'role_id', 'is_active', 'institution_id',
                    'student_id', 'department', 'level',
                    'is_verified', 'created_at'
                ]);

            logger.info('User created', {
                userId: user.id,
                username: user.username,
                email: user.email
            });

            return user;
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                if (error.constraint === 'users_email_key') {
                    throw new Error('Email already exists');
                }
                if (error.constraint === 'users_username_key') {
                    throw new Error('Username already exists');
                }
            }
            throw error;
        }
    }

    /**
     * Find user by ID
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} User object or null
     */
    static async findById(userId) {
        const user = await knex('users as u')
            .select(
                'u.id', 'u.username', 'u.email', 'u.first_name', 'u.last_name',
                'u.avatar_url', 'u.bio', 'u.phone', 'u.date_of_birth',
                'u.is_active', 'u.is_verified', 'u.email_verified_at', 'u.institution_id',
                'u.student_id', 'u.department', 'u.level',
                'u.last_login', 'u.last_login_ip', 'u.created_at', 'u.updated_at',
                'u.total_xp', 'u.current_level',
                'r.id as role_id', 'r.name as role_name', 'r.description as role_description'
            )
            .leftJoin('roles as r', 'u.role_id', 'r.id')
            .where('u.id', userId)
            .first();

        return user || null;
    }

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User object or null
     */
    static async findByEmail(email) {
        const user = await knex('users as u')
            .select(
                'u.id', 'u.username', 'u.email', 'u.password_hash', 'u.first_name', 'u.last_name',
                'u.avatar_url', 'u.bio', 'u.phone', 'u.date_of_birth',
                'u.is_active', 'u.is_verified', 'u.email_verified_at',
                'u.failed_login_attempts', 'u.locked_until',
                'u.last_login', 'u.last_login_ip', 'u.created_at', 'u.updated_at',
                'r.id as role_id', 'r.name as role_name'
            )
            .leftJoin('roles as r', 'u.role_id', 'r.id')
            .where('u.email', email)
            .first();

        return user || null;
    }

    /**
     * Find user by username
     * @param {string} username - Username
     * @returns {Promise<Object|null>} User object or null
     */
    static async findByUsername(username) {
        const user = await knex('users as u')
            .select(
                'u.id', 'u.username', 'u.email', 'u.password_hash', 'u.first_name', 'u.last_name',
                'u.avatar_url', 'u.bio', 'u.phone', 'u.date_of_birth',
                'u.is_active', 'u.is_verified', 'u.email_verified_at',
                'u.failed_login_attempts', 'u.locked_until',
                'u.last_login', 'u.last_login_ip', 'u.created_at', 'u.updated_at',
                'r.id as role_id', 'r.name as role_name'
            )
            .leftJoin('roles as r', 'u.role_id', 'r.id')
            .where('u.username', username)
            .first();

        return user || null;
    }

    /**
     * Authenticate user
     * @param {string} identifier - Email or username
     * @param {string} password - Password
     * @returns {Promise<Object>} Authenticated user
     */
    static async authenticate(identifier, password) {
        // Find user by email or username
        let user;
        if (identifier.includes('@')) {
            user = await this.findByEmail(identifier);
        } else {
            user = await this.findByUsername(identifier);
        }

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
            throw new Error(`Account is locked. Try again in ${minutesLeft} minutes`);
        }

        // Check if account is active
        if (!user.is_active) {
            throw new Error('Account is deactivated');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            // Increment failed login attempts
            await this.incrementFailedLoginAttempts(user.id);
            throw new Error('Invalid credentials');
        }

        // Reset failed login attempts and update last login
        await this.resetFailedLoginAttempts(user.id);
        await this.updateLastLogin(user.id);

        // Remove sensitive data
        delete user.password_hash;
        delete user.failed_login_attempts;
        delete user.locked_until;

        return user;
    }

    /**
     * Update user
     * @param {string} userId - User ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated user
     */
    static async update(userId, updates) {
        const allowedFields = [
            'first_name', 'last_name', 'avatar_url', 'bio',
            'phone', 'date_of_birth', 'is_active', 'institution_id',
            'student_id', 'department', 'level'
        ];

        const updateData = {};

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateData[key] = value;
            }
        }

        if (Object.keys(updateData).length === 0) {
            throw new Error('No valid fields to update still testing');
        }

        updateData.updated_at = new Date()

        const [user] = await knex('users')
            .where({ id: userId })
            .update(updateData)
            .returning([
                'id', 'username', 'email', 'first_name', 'last_name',
                'avatar_url', 'bio', 'phone', 'date_of_birth',
                'is_active', 'is_verified', 'updated_at', 'institution_id',
                'student_id', 'department', 'level'
            ]);

        if (!user) {
            throw new Error('User not found');
        }

        logger.info('User updated', {
            userId,
            updatedFields: Object.keys(updates)
        });

        return user;
    }

    /**
     * Update user password
     * @param {string} userId - User ID
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>} Success status
     */
    static async updatePassword(userId, newPassword) {
        const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await knex('users')
            .where({ id: userId })
            .update({
                password_hash,
                updated_at: new Date()
            });

        logger.info('User password updated', { userId });
        return true;
    }

    /**
     * Update user role
     * @param {string} userId - User ID
     * @param {string} roleName - Role name
     * @returns {Promise<Object>} Updated user
     */
    static async updateRole(userId, roleName) {
        // Get role ID
        const role = await knex('roles')
            .select('id')
            .where({ name: roleName })
            .first();

        if (!role) {
            throw new Error(`Role '${roleName}' not found`);
        }

        const [user] = await knex('users')
            .where({ id: userId })
            .update({
                role_id: role.id,
                updated_at: new Date()
            })
            .returning(['id', 'username', 'email', 'role_id']);

        if (!user) {
            throw new Error('User not found');
        }

        logger.info('User role updated', {
            userId,
            newRole: roleName
        });

        return user;
    }

    /**
     * Delete user
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(userId) {
        const rowCount = await knex('users')
            .where({ id: userId })
            .delete();

        logger.info('User deleted', { userId });
        return rowCount > 0;
    }

    /**
     * Get all users with pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Users and pagination info
     */
    static async getAll(options = {}) {
        const {
            page = 1,
            limit = 20,
            search = '',
            role = null,
            is_active = null,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = options;

        const offset = (page - 1) * limit;

        // Build base query
        let query = knex('users as u')
            .leftJoin('roles as r', 'u.role_id', 'r.id');

        // Apply filters
        if (search) {
            query = query.where(function () {
                this.where('u.username', 'ilike', `%${search}%`)
                    .orWhere('u.email', 'ilike', `%${search}%`)
                    .orWhere('u.first_name', 'ilike', `%${search}%`)
                    .orWhere('u.last_name', 'ilike', `%${search}%`);
            });
        }

        if (role) {
            query = query.where('r.name', role);
        }

        if (is_active !== null) {
            query = query.where('u.is_active', is_active);
        }

        // Count total
        const countQuery = query.clone();
        const [{ count: total }] = await countQuery.count('u.id as count');

        // Get users
        const users = await query
            .select(
                'u.id', 'u.username', 'u.email', 'u.first_name', 'u.last_name', 'u.institution_id',
                'u.student_id', 'u.department', 'u.level',
                'u.avatar_url', 'u.phone', 'u.is_active', 'u.is_verified',
                'u.last_login', 'u.created_at',
                'r.name as role_name'
            )
            .orderBy(`u.${sort_by}`, sort_order)
            .limit(limit)
            .offset(offset);

        return {
            users,
            pagination: {
                page,
                limit,
                total: parseInt(total),
                totalPages: Math.ceil(parseInt(total) / limit)
            }
        };
    }

    /**
     * Verify user email
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    static async verifyEmail(userId) {
        await knex('users')
            .where({ id: userId })
            .update({
                is_verified: true,
                email_verified_at: new Date()
            });

        logger.info('User email verified', { userId });
        return true;
    }

    /**
     * Check if user has access to a pathway based on personal or institutional subscription
     * @param {string} userId - User ID
     * @param {string} pathwayId - Pathway ID
     * @returns {Promise<boolean>} Access status
     */
    static async hasAccessToPathway(userId, pathwayId) {
        try {
            // 1. Get user with institution info
            const user = await knex('users as u')
                .select('u.id', 'u.institution_id', 'u.active_subscription_id')
                .where('u.id', userId)
                .first();

            if (!user) return false;

            // 2. Get pathway info
            const pathway = await knex('pathways')
                .select('id', 'institution_id', 'subscription_tier_id', 'price')
                .where('id', pathwayId)
                .first();

            if (!pathway) return false;

            // 3. Check if pathway belongs to user's institution
            if (user.institution_id && pathway.institution_id === user.institution_id) {
                return true;
            }

            // 4. Check if user is already enrolled
            const enrollment = await knex('pathway_enrollments')
                .where({ user_id: userId, pathway_id: pathwayId, status: 'active' })
                .first();
            if (enrollment) return true;

            // 5. Check personal subscription
            if (user.active_subscription_id) {
                const sub = await knex('user_subscriptions as us')
                    .join('subscription_tiers as st', 'us.tier_id', 'st.id')
                    .select('st.sort_order')
                    .where({ 'us.id': user.active_subscription_id, 'us.status': 'active' })
                    .where('us.expires_at', '>', new Date())
                    .first();

                const pathwayTier = await knex('subscription_tiers')
                    .select('sort_order')
                    .where('id', pathway.subscription_tier_id)
                    .first();

                if (sub && pathwayTier && sub.sort_order >= pathwayTier.sort_order) {
                    return true;
                }
            }

            // 6. Check institutional subscription overlay
            if (user.institution_id) {
                const institution = await knex('institutions as i')
                    .join('subscription_tiers as st', 'i.subscription_tier_id', 'st.id')
                    .select('st.sort_order')
                    .where('i.id', user.institution_id)
                    .first();

                const pathwayTier = await knex('subscription_tiers')
                    .select('sort_order')
                    .where('id', pathway.subscription_tier_id)
                    .first();

                if (institution && pathwayTier && institution.sort_order >= pathwayTier.sort_order) {
                    return true;
                }
            }

            // 7. Free pathways (if subscription_tier_id is null and price is 0)
            if (!pathway.subscription_tier_id && parseFloat(pathway.price) === 0) {
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Error checking pathway access', { userId, pathwayId, error: error.message });
            return false;
        }
    }

    /**
     * Check if user has access to a course based on personal or institutional subscription
     * @param {string} userId - User ID
     * @param {string} courseId - Course ID
     * @returns {Promise<boolean>} Access status
     */
    static async hasAccessToCourse(userId, courseId) {
        try {
            // 1. Get user with institution info
            const user = await knex('users as u')
                .select('u.id', 'u.institution_id', 'u.active_subscription_id')
                .where('u.id', userId)
                .first();

            if (!user) return false;

            // 2. Get course info
            const course = await knex('courses')
                .select('id', 'subscription_tier_id', 'price')
                .where('id', courseId)
                .first();

            if (!course) return false;

            // 3. Check if user is already enrolled
            const enrollment = await knex('enrollments')
                .where({ user_id: userId, course_id: courseId })
                .first();
            if (enrollment) return true;

            // 4. (REMOVED) Check if course is part of a pathway belonging to user's institution
            // Institutional access is now handled via explicit enrollment when a pathway is assigned.


            // 5. Check personal subscription
            if (user.active_subscription_id) {
                const sub = await knex('user_subscriptions as us')
                    .join('subscription_tiers as st', 'us.tier_id', 'st.id')
                    .select('st.sort_order')
                    .where({ 'us.id': user.active_subscription_id, 'us.status': 'active' })
                    .where('us.expires_at', '>', new Date())
                    .first();

                if (sub && course.subscription_tier_id) {
                    const courseTier = await knex('subscription_tiers')
                        .select('sort_order')
                        .where('id', course.subscription_tier_id)
                        .first();

                    if (courseTier && sub.sort_order >= courseTier.sort_order) {
                        return true;
                    }
                }
            }

            // 6. Check institutional subscription overlay
            if (user.institution_id) {
                const institution = await knex('institutions as i')
                    .join('subscription_tiers as st', 'i.subscription_tier_id', 'st.id')
                    .select('st.sort_order')
                    .where('i.id', user.institution_id)
                    .first();

                if (institution && course.subscription_tier_id) {
                    const courseTier = await knex('subscription_tiers')
                        .select('sort_order')
                        .where('id', course.subscription_tier_id)
                        .first();

                    if (courseTier && institution.sort_order >= courseTier.sort_order) {
                        return true;
                    }
                }
            }

            return false;

            return false;
        } catch (error) {
            logger.error('Error checking course access', { userId, courseId, error: error.message });
            return false;
        }
    }

    /**
     * Update last login
     * @param {string} userId - User ID
     * @param {string} ipAddress - IP address
     * @returns {Promise<boolean>} Success status
     */
    static async updateLastLogin(userId, ipAddress = null) {
        await knex('users')
            .where({ id: userId })
            .update({
                last_login: new Date(),
                last_login_ip: ipAddress
            });

        return true;
    }

    /**
     * Increment failed login attempts
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    static async incrementFailedLoginAttempts(userId) {
        await knex('users')
            .where({ id: userId })
            .update({
                failed_login_attempts: knex.raw('failed_login_attempts + 1'),
                locked_until: knex.raw(`
                    CASE 
                        WHEN failed_login_attempts + 1 >= ${MAX_LOGIN_ATTEMPTS}
                        THEN CURRENT_TIMESTAMP + INTERVAL '${LOCKOUT_DURATION} minutes'
                        ELSE locked_until
                    END
                `)
            });

        return true;
    }

    /**
     * Reset failed login attempts
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    static async resetFailedLoginAttempts(userId) {
        await knex('users')
            .where({ id: userId })
            .update({
                failed_login_attempts: 0,
                locked_until: null
            });

        return true;
    }

    /**
     * Grant permission to user
     * @param {string} userId - User ID
     * @param {string} permissionName - Permission name
     * @returns {Promise<boolean>} Success status
     */
    static async grantPermission(userId, permissionName) {
        const permission = await knex('permissions')
            .select('id')
            .where({ name: permissionName })
            .first();

        if (!permission) {
            throw new Error(`Permission '${permissionName}' not found`);
        }

        await knex('user_permissions')
            .insert({
                user_id: userId,
                permission_id: permission.id,
                granted: true
            })
            .onConflict(['user_id', 'permission_id'])
            .merge({ granted: true });

        logger.info('Permission granted to user', {
            userId,
            permission: permissionName
        });

        return true;
    }

    /**
     * Revoke permission from user
     * @param {string} userId - User ID
     * @param {string} permissionName - Permission name
     * @returns {Promise<boolean>} Success status
     */
    static async revokePermission(userId, permissionName) {
        const permission = await knex('permissions')
            .select('id')
            .where({ name: permissionName })
            .first();

        if (!permission) {
            throw new Error(`Permission '${permissionName}' not found`);
        }

        await knex('user_permissions')
            .insert({
                user_id: userId,
                permission_id: permission.id,
                granted: false
            })
            .onConflict(['user_id', 'permission_id'])
            .merge({ granted: false });

        logger.info('Permission revoked from user', {
            userId,
            permission: permissionName
        });

        return true;
    }

    /**
     * Verify password
     * @param {string} password - Plain text password
     * @param {string} hash - Password hash
     * @returns {Promise<boolean>} Verification result
     */
    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Get public profile by username
     * @param {string} username - Username (with or without @ prefix)
     * @returns {Promise<Object|null>} Public profile data or null
     */
    static async getPublicProfile(username) {
        // Remove @ prefix if present
        const cleanUsername = username.startsWith('@') ? username.substring(1) : username;

        // Get user with settings
        const user = await knex('users as u')
            .select(
                'u.id', 'u.username', 'u.first_name', 'u.last_name',
                'u.avatar_url', 'u.cover_photo_url', 'u.bio', 'u.created_at',
                'r.name as role_name',
                'us.profile_public', 'us.show_progress_publicly',
                'up.data as personalisation_data'
            )
            .leftJoin('roles as r', 'u.role_id', 'r.id')
            .leftJoin('user_settings as us', 'u.id', 'us.user_id')
            .leftJoin('user_personalisations as up', 'u.id', 'up.user_id')
            .where('u.username', cleanUsername)
            .andWhere('u.is_active', true)
            .first();

        if (!user) {
            return null;
        }

        // Check if profile is public
        if (!user.profile_public) {
            return null;
        }

        // Build response
        const profile = {
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            avatar_url: user.avatar_url,
            cover_photo_url: user.cover_photo_url,
            bio: user.bio,
            role: user.role_name,
            joined_at: user.created_at,
            personalisation: {
                data: user.personalisation_data || {}
            }
        };

        // If progress is public, get stats
        if (user.show_progress_publicly) {
            // Get enrollment stats
            const enrollmentStats = await knex('enrollments')
                .where({ user_id: user.id })
                .select(
                    knex.raw('COUNT(*) as total_courses'),
                    knex.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_courses'),
                    knex.raw('COUNT(CASE WHEN status = \'active\' THEN 1 END) as in_progress_courses')
                )
                .first();

            // Get certificates count (only for published courses)
            const certificatesCount = await knex('certificates')
                .leftJoin('courses', 'certificates.course_id', 'courses.id')
                .where({ 'certificates.user_id': user.id })
                .whereNotNull('certificates.issued_at')
                .where('courses.is_published', true)
                .count('certificates.id as count')
                .first();

            profile.stats = {
                total_courses: parseInt(enrollmentStats.total_courses) || 0,
                completed_courses: parseInt(enrollmentStats.completed_courses) || 0,
                in_progress_courses: parseInt(enrollmentStats.in_progress_courses) || 0,
                certificates: parseInt(certificatesCount.count) || 0
            };

            // Get recent completed courses (last 5)
            const recentCourses = await knex('enrollments as e')
                .select(
                    'c.id', 'c.title', 'c.slug', 'c.thumbnail_url',
                    'e.completed_at'
                )
                .join('courses as c', 'e.course_id', 'c.id')
                .where({ 'e.user_id': user.id, 'e.status': 'completed' })
                .whereNotNull('e.completed_at')
                .orderBy('e.completed_at', 'desc')
                .limit(5);

            profile.recent_courses = recentCourses;
        }

        return profile;
    }
}

module.exports = User;
