/**
 * User Model
 * Handles all user-related database operations with RBAC support
 */

const bcrypt = require('bcrypt');
const db = require('../config/database');
const logger = require('../config/winston');
const { generateUniqueUsername } = require('../utils/usernameGenerator');

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
            role_name = 'student' // Default role
        } = userData;

        try {
            // Auto-generate username if not provided
            if (!username) {
                username = await generateUniqueUsername(async (testUsername) => {
                    const existing = await this.findByUsername(testUsername);
                    return !!existing;
                });
            }

            // Hash password
            const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

            // Get role ID
            const roleResult = await db.query(
                'SELECT id FROM roles WHERE name = $1',
                [role_name]
            );

            if (roleResult.rows.length === 0) {
                throw new Error(`Role '${role_name}' not found`);
            }

            const role_id = roleResult.rows[0].id;

            // Insert user
            const query = `
                INSERT INTO users (
                    username, email, password_hash, first_name, last_name,
                    phone, date_of_birth, role_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, username, email, first_name, last_name, phone,
                          date_of_birth, role_id, is_active, is_verified, created_at
            `;

            const result = await db.query(query, [
                username,
                email,
                password_hash,
                first_name || null,
                last_name || null,
                phone || null,
                date_of_birth || null,
                role_id
            ]);

            const user = result.rows[0];

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
        const query = `
            SELECT 
                u.id, u.username, u.email, u.first_name, u.last_name,
                u.avatar_url, u.bio, u.phone, u.date_of_birth,
                u.is_active, u.is_verified, u.email_verified_at,
                u.last_login, u.last_login_ip, u.created_at, u.updated_at,
                r.id as role_id, r.name as role_name, r.description as role_description
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1
        `;

        const result = await db.query(query, [userId]);
        return result.rows[0] || null;
    }

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User object or null
     */
    static async findByEmail(email) {
        const query = `
            SELECT 
                u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name,
                u.avatar_url, u.bio, u.phone, u.date_of_birth,
                u.is_active, u.is_verified, u.email_verified_at,
                u.failed_login_attempts, u.locked_until,
                u.last_login, u.last_login_ip, u.created_at, u.updated_at,
                r.id as role_id, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.email = $1
        `;

        const result = await db.query(query, [email]);
        return result.rows[0] || null;
    }

    /**
     * Find user by username
     * @param {string} username - Username
     * @returns {Promise<Object|null>} User object or null
     */
    static async findByUsername(username) {
        const query = `
            SELECT 
                u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name,
                u.avatar_url, u.bio, u.phone, u.date_of_birth,
                u.is_active, u.is_verified, u.email_verified_at,
                u.failed_login_attempts, u.locked_until,
                u.last_login, u.last_login_ip, u.created_at, u.updated_at,
                r.id as role_id, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.username = $1
        `;

        const result = await db.query(query, [username]);
        return result.rows[0] || null;
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
            'phone', 'date_of_birth', 'is_active'
        ];

        const fields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(userId);

        const query = `
            UPDATE users
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING id, username, email, first_name, last_name,
                      avatar_url, bio, phone, date_of_birth,
                      is_active, is_verified, updated_at
        `;

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        logger.info('User updated', {
            userId,
            updatedFields: Object.keys(updates)
        });

        return result.rows[0];
    }

    /**
     * Update user password
     * @param {string} userId - User ID
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>} Success status
     */
    static async updatePassword(userId, newPassword) {
        const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        const query = `
            UPDATE users
            SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `;

        await db.query(query, [password_hash, userId]);

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
        const roleResult = await db.query(
            'SELECT id FROM roles WHERE name = $1',
            [roleName]
        );

        if (roleResult.rows.length === 0) {
            throw new Error(`Role '${roleName}' not found`);
        }

        const role_id = roleResult.rows[0].id;

        const query = `
            UPDATE users
            SET role_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, username, email, role_id
        `;

        const result = await db.query(query, [role_id, userId]);

        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        logger.info('User role updated', {
            userId,
            newRole: roleName
        });

        return result.rows[0];
    }

    /**
     * Delete user
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(userId) {
        const query = 'DELETE FROM users WHERE id = $1';
        const result = await db.query(query, [userId]);

        logger.info('User deleted', { userId });
        return result.rowCount > 0;
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
        const conditions = [];
        const values = [];
        let paramCount = 1;

        // Search filter
        if (search) {
            conditions.push(`(
                u.username ILIKE $${paramCount} OR 
                u.email ILIKE $${paramCount} OR 
                u.first_name ILIKE $${paramCount} OR 
                u.last_name ILIKE $${paramCount}
            )`);
            values.push(`%${search}%`);
            paramCount++;
        }

        // Role filter
        if (role) {
            conditions.push(`r.name = $${paramCount}`);
            values.push(role);
            paramCount++;
        }

        // Active status filter
        if (is_active !== null) {
            conditions.push(`u.is_active = $${paramCount}`);
            values.push(is_active);
            paramCount++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Count total
        const countQuery = `
            SELECT COUNT(*) as total
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ${whereClause}
        `;

        const countResult = await db.query(countQuery, values);
        const total = parseInt(countResult.rows[0].total);

        // Get users
        const query = `
            SELECT 
                u.id, u.username, u.email, u.first_name, u.last_name,
                u.avatar_url, u.phone, u.is_active, u.is_verified,
                u.last_login, u.created_at,
                r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ${whereClause}
            ORDER BY u.${sort_by} ${sort_order}
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;

        values.push(limit, offset);
        const result = await db.query(query, values);

        return {
            users: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Verify user email
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    static async verifyEmail(userId) {
        const query = `
            UPDATE users
            SET is_verified = true, email_verified_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `;

        await db.query(query, [userId]);

        logger.info('User email verified', { userId });
        return true;
    }

    /**
     * Update last login
     * @param {string} userId - User ID
     * @param {string} ipAddress - IP address
     * @returns {Promise<boolean>} Success status
     */
    static async updateLastLogin(userId, ipAddress = null) {
        const query = `
            UPDATE users
            SET last_login = CURRENT_TIMESTAMP, last_login_ip = $2
            WHERE id = $1
        `;

        await db.query(query, [userId, ipAddress]);
        return true;
    }

    /**
     * Increment failed login attempts
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    static async incrementFailedLoginAttempts(userId) {
        const query = `
            UPDATE users
            SET 
                failed_login_attempts = failed_login_attempts + 1,
                locked_until = CASE 
                    WHEN failed_login_attempts + 1 >= $2 
                    THEN CURRENT_TIMESTAMP + INTERVAL '${LOCKOUT_DURATION} minutes'
                    ELSE locked_until
                END
            WHERE id = $1
        `;

        await db.query(query, [userId, MAX_LOGIN_ATTEMPTS]);
        return true;
    }

    /**
     * Reset failed login attempts
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    static async resetFailedLoginAttempts(userId) {
        const query = `
            UPDATE users
            SET failed_login_attempts = 0, locked_until = NULL
            WHERE id = $1
        `;

        await db.query(query, [userId]);
        return true;
    }

    /**
     * Grant permission to user
     * @param {string} userId - User ID
     * @param {string} permissionName - Permission name
     * @returns {Promise<boolean>} Success status
     */
    static async grantPermission(userId, permissionName) {
        const permResult = await db.query(
            'SELECT id FROM permissions WHERE name = $1',
            [permissionName]
        );

        if (permResult.rows.length === 0) {
            throw new Error(`Permission '${permissionName}' not found`);
        }

        const permission_id = permResult.rows[0].id;

        const query = `
            INSERT INTO user_permissions (user_id, permission_id, granted)
            VALUES ($1, $2, true)
            ON CONFLICT (user_id, permission_id) 
            DO UPDATE SET granted = true
        `;

        await db.query(query, [userId, permission_id]);

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
        const permResult = await db.query(
            'SELECT id FROM permissions WHERE name = $1',
            [permissionName]
        );

        if (permResult.rows.length === 0) {
            throw new Error(`Permission '${permissionName}' not found`);
        }

        const permission_id = permResult.rows[0].id;

        const query = `
            INSERT INTO user_permissions (user_id, permission_id, granted)
            VALUES ($1, $2, false)
            ON CONFLICT (user_id, permission_id) 
            DO UPDATE SET granted = false
        `;

        await db.query(query, [userId, permission_id]);

        logger.info('Permission revoked from user', {
            userId,
            permission: permissionName
        });

        return true;
    }

    /**
     * Get public profile by username
     * @param {string} username - Username
     * @returns {Promise<Object|null>} Public profile data
     */
    static async getPublicProfile(username) {
        try {
            // Find user by username
            const userQuery = `
                SELECT
                    u.id, u.username, u.email, u.first_name, u.last_name,
                    u.avatar_url, u.cover_photo_url, u.bio, u.phone, u.date_of_birth,
                    u.is_active, u.is_verified, u.created_at,
                    r.name as role,
                    up.data as personalisation_data
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN user_personalisations up ON u.id = up.user_id
                WHERE u.username = $1 AND u.is_active = true
            `;

            const userResult = await db.query(userQuery, [username]);
            const user = userResult.rows[0];

            if (!user) {
                return null;
            }

            logger.info('Public profile - found user:', { userId: user.id, username });

            // Get course statistics with simple direct queries
            const totalCoursesResult = await db.query(`
                SELECT COUNT(*) as total_courses
                FROM enrollments e
                WHERE e.user_id = $1
            `, [user.id]);

            const completedCoursesResult = await db.query(`
                SELECT COUNT(*) as completed_courses
                FROM enrollments e
                WHERE e.user_id = $1 AND e.status = 'completed'
            `, [user.id]);

            const inProgressCoursesResult = await db.query(`
                SELECT COUNT(*) as in_progress_courses
                FROM enrollments e
                WHERE e.user_id = $1 AND e.status = 'active'
            `, [user.id]);

            // Use knex for certificate count (same as certificate API)
            const knex = require('../config/knex');
            const certificatesResult = await knex('certificates as c')
                .leftJoin('courses as co', 'c.course_id', 'co.id')
                .where('c.user_id', user.id)
                .where('co.is_published', true)
                .count('* as certificates');

            const certCount = parseInt(certificatesResult[0]?.certificates ?? 0);
            console.log('🔍 Certificate count debug:', {
                userId: user.id,
                certificatesResult,
                certCount
            });

            const stats = {
                total_courses: parseInt(totalCoursesResult.rows[0]?.total_courses ?? 0),
                completed_courses: parseInt(completedCoursesResult.rows[0]?.completed_courses ?? 0),
                in_progress_courses: parseInt(inProgressCoursesResult.rows[0]?.in_progress_courses ?? 0),
                certificates: certCount
            };

            console.log('📊 Public profile stats:', { userId: user.id, stats });

            // Get recent completed courses
            const recentCoursesQuery = `
                SELECT
                    c.id, c.title, c.thumbnail_url, c.description,
                    e.completed_at
                FROM courses c
                JOIN enrollments e ON c.id = e.course_id
                WHERE e.user_id = $1
                  AND e.status = 'completed'
                  AND c.is_published = true
                ORDER BY e.completed_at DESC
                LIMIT 5
            `;

            const recentCourses = await db.query(recentCoursesQuery, [user.id]);

            return {
                // User profile data
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                avatar_url: user.avatar_url,
                cover_photo_url: user.cover_photo_url,
                bio: user.bio,
                role: user.role,
                role: user.role,
                joined_at: user.created_at,
                personalisation: {
                    data: user.personalisation_data || {}
                },

                // Statistics
                stats: {
                    total_courses: parseInt(stats.total_courses) || 0,
                    completed_courses: parseInt(stats.completed_courses) || 0,
                    in_progress_courses: parseInt(stats.in_progress_courses) || 0,
                    certificates: parseInt(stats.certificates) || 0
                },

                // Recent completed courses
                recent_courses: recentCourses.rows.map(course => ({
                    id: course.id,
                    title: course.title,
                    thumbnail_url: course.thumbnail_url,
                    description: course.description,
                    completed_at: course.completed_at
                }))
            };

        } catch (error) {
            logger.error('Error getting public profile', { error: error.message, username });
            throw error;
        }
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
}

module.exports = User;
