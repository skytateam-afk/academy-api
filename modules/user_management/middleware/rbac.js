/**
 * RBAC Middleware
 * Role-Based Access Control middleware for permission checking
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

/**
 * Check if user has a specific permission
 * @param {string} userId - User ID
 * @param {string} permissionName - Permission name (e.g., 'course.create')
 * @returns {Promise<boolean>} Whether user has permission
 */
const hasPermission = async (userId, permissionName) => {
    try {
        // Get permissions from user's role
        const rolePermissions = knex('users as u')
            .select('p.name')
            .join('roles as r', 'u.role_id', 'r.id')
            .join('role_permissions as rp', 'r.id', 'rp.role_id')
            .join('permissions as p', 'rp.permission_id', 'p.id')
            .where('u.id', userId);

        // Get user's custom permissions
        const customPermissions = knex('user_permissions as up')
            .select('p.name', 'up.granted')
            .join('permissions as p', 'up.permission_id', 'p.id')
            .where('up.user_id', userId);

        // Check for explicit revoke
        const revoke = await knex.from(customPermissions.as('cp'))
            .where('cp.name', permissionName)
            .where('cp.granted', false)
            .first();

        if (revoke) {
            return false;
        }

        // Check for explicit grant
        const grant = await knex.from(customPermissions.clone().as('cp'))
            .where('cp.name', permissionName)
            .where('cp.granted', true)
            .first();

        if (grant) {
            return true;
        }

        // Check role permissions
        const rolePermission = await knex.from(rolePermissions.as('rp'))
            .where('rp.name', permissionName)
            .first();

        return !!rolePermission;
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
            .select('p.name')
            .join('roles as r', 'u.role_id', 'r.id')
            .join('role_permissions as rp', 'r.id', 'rp.role_id')
            .join('permissions as p', 'rp.permission_id', 'p.id')
            .where('u.id', userId);

        // Get custom grants
        const customGrants = await knex('user_permissions as up')
            .select('p.name')
            .join('permissions as p', 'up.permission_id', 'p.id')
            .where('up.user_id', userId)
            .where('up.granted', true);

        // Get custom revokes
        const customRevokes = await knex('user_permissions as up')
            .select('p.name')
            .join('permissions as p', 'up.permission_id', 'p.id')
            .where('up.user_id', userId)
            .where('up.granted', false);

        const revokeSet = new Set(customRevokes.map(r => r.name));

        // Combine role permissions and custom grants, excluding revokes
        const allPermissions = [...rolePermissions, ...customGrants]
            .map(p => p.name)
            .filter(name => !revokeSet.has(name));

        // Return unique permissions
        return [...new Set(allPermissions)].sort();
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
                .select('r.name as role_name')
                .join('roles as r', 'u.role_id', 'r.id')
                .where('u.id', req.user.userId)
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
            .select('r.name')
            .join('roles as r', 'u.role_id', 'r.id')
            .where('u.id', userId)
            .where('r.name', 'super_admin')
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
