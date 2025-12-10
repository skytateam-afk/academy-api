/**
 * RBAC Middleware
 * Role-Based Access Control middleware for permission checking
 */

const knex = require('../config/knex');
const logger = require('../config/winston');

/**
 * Check if user has a specific permission
 * @param {string} userId - User ID
 * @param {string} permissionName - Permission name (e.g., 'course.create')
 * @returns {Promise<boolean>} Whether user has permission
 */
const hasPermission = async (userId, permissionName) => {
    try {
        // Use a single query to check both role and custom permissions
        const result = await knex.raw(`
            WITH role_perms AS (
                SELECT p.name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                JOIN role_permissions rp ON r.id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE u.id = ? AND p.name = ?
                LIMIT 1
            ),
            custom_perms AS (
                SELECT up.granted
                FROM user_permissions up
                JOIN permissions p ON up.permission_id = p.id
                WHERE up.user_id = ? AND p.name = ?
                LIMIT 1
            )
            SELECT
                CASE
                    -- If user has explicit revoke, deny
                    WHEN (SELECT granted FROM custom_perms) = false THEN false
                    -- If user has explicit grant, allow
                    WHEN (SELECT granted FROM custom_perms) = true THEN true
                    -- Otherwise check role permissions
                    WHEN EXISTS (SELECT 1 FROM role_perms) THEN true
                    ELSE false
                END as has_permission
        `, [userId, permissionName, userId, permissionName]);

        return result.rows[0]?.has_permission || false;
    } catch (error) {
        logger.error('Error checking permission', {
            userId,
            permissionName,
            error: error.message
        });
        return false;
    }
};

/**
 * Check if user has any of the specified permissions
 * @param {string} userId - User ID
 * @param {Array<string>} permissionNames - Array of permission names
 * @returns {Promise<boolean>} Whether user has any of the permissions
 */
const hasAnyPermission = async (userId, permissionNames) => {
    try {
        const checks = await Promise.all(
            permissionNames.map(name => hasPermission(userId, name))
        );
        return checks.some(result => result === true);
    } catch (error) {
        logger.error('Error checking any permission', {
            userId,
            permissionNames,
            error: error.message
        });
        return false;
    }
};

/**
 * Check if user has all of the specified permissions
 * @param {string} userId - User ID
 * @param {Array<string>} permissionNames - Array of permission names
 * @returns {Promise<boolean>} Whether user has all permissions
 */
const hasAllPermissions = async (userId, permissionNames) => {
    try {
        const checks = await Promise.all(
            permissionNames.map(name => hasPermission(userId, name))
        );
        return checks.every(result => result === true);
    } catch (error) {
        logger.error('Error checking all permissions', {
            userId,
            permissionNames,
            error: error.message
        });
        return false;
    }
};

/**
 * Get all permissions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} Array of permission names
 */
const getUserPermissions = async (userId) => {
    try {
        // Get role permissions
        const rolePermissions = await knex('users as u')
            .join('roles as r', 'u.role_id', 'r.id')
            .join('role_permissions as rp', 'r.id', 'rp.role_id')
            .join('permissions as p', 'rp.permission_id', 'p.id')
            .where('u.id', userId)
            .select('p.name')
            .distinct();

        // Get custom permissions (grants and revokes)
        const customPermissions = await knex('user_permissions as up')
            .join('permissions as p', 'up.permission_id', 'p.id')
            .where('up.user_id', userId)
            .select('p.name', 'up.granted');

        // Build final permission set
        const permissionSet = new Set(rolePermissions.map(p => p.name));

        // Apply custom grants and revokes
        customPermissions.forEach(cp => {
            if (cp.granted) {
                permissionSet.add(cp.name);
            } else {
                permissionSet.delete(cp.name);
            }
        });

        return Array.from(permissionSet).sort();
    } catch (error) {
        logger.error('Error getting user permissions', {
            userId,
            error: error.message
        });
        return [];
    }
};

/**
 * Middleware to check if user has required permission
 * @param {string|Array<string>} requiredPermissions - Required permission(s)
 * @param {Object} options - Options for permission checking
 * @returns {Function} Express middleware
 */
const requirePermission = (requiredPermissions, options = {}) => {
    const {
        requireAll = false, // If true, user must have all permissions; if false, any permission
        allowSelf = false, // If true, allow if user is accessing their own resource
        getSelfId = null // Function to extract resource owner ID from request
    } = options;

    return async (req, res, next) => {
        try {
            // Ensure user is authenticated
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userId = req.user.userId;
            const permissions = Array.isArray(requiredPermissions) 
                ? requiredPermissions 
                : [requiredPermissions];

            // Check if user is accessing their own resource
            if (allowSelf && getSelfId) {
                const resourceOwnerId = getSelfId(req);
                if (resourceOwnerId && resourceOwnerId === userId) {
                    return next();
                }
            }

            // Check permissions
            const hasAccess = requireAll
                ? await hasAllPermissions(userId, permissions)
                : await hasAnyPermission(userId, permissions);

            if (!hasAccess) {
                logger.warn('Permission denied', {
                    userId,
                    requiredPermissions: permissions,
                    path: req.path,
                    method: req.method
                });

                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to perform this action',
                    requiredPermissions: permissions
                });
            }

            // Attach user permissions to request for later use
            req.userPermissions = await getUserPermissions(userId);
            next();
        } catch (error) {
            logger.error('Error in permission middleware', {
                error: error.message,
                path: req.path
            });

            res.status(500).json({
                success: false,
                message: 'Error checking permissions'
            });
        }
    };
};

/**
 * Middleware to check if user has a specific role
 * @param {string|Array<string>} allowedRoles - Allowed role(s)
 * @returns {Function} Express middleware
 */
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await knex('users as u')
                .join('roles as r', 'u.role_id', 'r.id')
                .where('u.id', req.user.userId)
                .select('r.name as role_name')
                .first();
            
            if (!result) {
                return res.status(403).json({
                    success: false,
                    message: 'User has no assigned role'
                });
            }

            const userRole = result.role_name;
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            if (!roles.includes(userRole)) {
                logger.warn('Role check failed', {
                    userId: req.user.userId,
                    userRole,
                    requiredRoles: roles,
                    path: req.path
                });

                return res.status(403).json({
                    success: false,
                    message: 'You do not have the required role to perform this action',
                    requiredRoles: roles
                });
            }

            req.userRole = userRole;
            next();
        } catch (error) {
            logger.error('Error in role middleware', {
                error: error.message,
                path: req.path
            });

            res.status(500).json({
                success: false,
                message: 'Error checking role'
            });
        }
    };
};

/**
 * Check if user is super admin
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether user is super admin
 */
const isSuperAdmin = async (userId) => {
    try {
        const result = await knex('users as u')
            .join('roles as r', 'u.role_id', 'r.id')
            .where('u.id', userId)
            .where('r.name', 'super_admin')
            .select('r.name')
            .first();

        return !!result;
    } catch (error) {
        logger.error('Error checking super admin status', {
            userId,
            error: error.message
        });
        return false;
    }
};

/**
 * Middleware to require super admin role
 */
const requireSuperAdmin = requireRole('super_admin');

/**
 * Middleware to require admin role (admin or super_admin)
 */
const requireAdmin = requireRole(['admin', 'super_admin']);

module.exports = {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    requirePermission,
    requireRole,
    requireSuperAdmin,
    requireAdmin,
    isSuperAdmin
};
