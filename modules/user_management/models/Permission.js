/**
 * Permission Model
 * Handles permission-related database operations
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class Permission {
    /**
     * Create a new permission
     * @param {Object} permissionData - Permission data
     * @returns {Promise<Object>} Created permission
     */
    static async create(permissionData) {
        const { name, resource, action, description } = permissionData;

        try {
            const [permission] = await knex('permissions')
                .insert({
                    name,
                    resource,
                    action,
                    description: description || null
                })
                .returning(['id', 'name', 'resource', 'action', 'description', 'created_at']);

            logger.info('Permission created', {
                permissionId: permission.id,
                permissionName: permission.name
            });

            return permission;
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Permission already exists');
            }
            throw error;
        }
    }

    /**
     * Find permission by ID
     * @param {string} permissionId - Permission ID
     * @returns {Promise<Object|null>} Permission object or null
     */
    static async findById(permissionId) {
        const permission = await knex('permissions')
            .select('id', 'name', 'resource', 'action', 'description', 'created_at')
            .where({ id: permissionId })
            .first();

        return permission || null;
    }

    /**
     * Find permission by name
     * @param {string} name - Permission name
     * @returns {Promise<Object|null>} Permission object or null
     */
    static async findByName(name) {
        const permission = await knex('permissions')
            .select('id', 'name', 'resource', 'action', 'description', 'created_at')
            .where({ name })
            .first();

        return permission || null;
    }

    /**
     * Get all permissions
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of permissions
     */
    static async getAll(options = {}) {
        const { resource = null, groupByResource = false } = options;

        let query = knex('permissions as p')
            .select(
                'p.id', 'p.name', 'p.resource', 'p.action', 'p.description', 'p.created_at'
            )
            .count('rp.role_id as role_count')
            .leftJoin('role_permissions as rp', 'p.id', 'rp.permission_id')
            .groupBy('p.id', 'p.name', 'p.resource', 'p.action', 'p.description', 'p.created_at');

        if (resource) {
            query = query.where('p.resource', resource);
        }

        const permissions = await query.orderBy(['p.resource', 'p.action']);

        if (groupByResource) {
            // Group permissions by resource
            const grouped = {};
            permissions.forEach(perm => {
                if (!grouped[perm.resource]) {
                    grouped[perm.resource] = [];
                }
                grouped[perm.resource].push(perm);
            });
            return grouped;
        }

        return permissions;
    }

    /**
     * Get all unique resources
     * @returns {Promise<Array>} Array of resource names
     */
    static async getResources() {
        const results = await knex('permissions')
            .distinct('resource')
            .orderBy('resource');

        return results.map(row => row.resource);
    }

    /**
     * Update permission
     * @param {string} permissionId - Permission ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated permission
     */
    static async update(permissionId, updates) {
        const { name, resource, action, description } = updates;

        const updateData = {};

        if (name !== undefined) {
            updateData.name = name;
        }

        if (resource !== undefined) {
            updateData.resource = resource;
        }

        if (action !== undefined) {
            updateData.action = action;
        }

        if (description !== undefined) {
            updateData.description = description;
        }

        if (Object.keys(updateData).length === 0) {
            throw new Error('No valid fields to update');
        }

        const [permission] = await knex('permissions')
            .where({ id: permissionId })
            .update(updateData)
            .returning(['id', 'name', 'resource', 'action', 'description']);

        if (!permission) {
            throw new Error('Permission not found');
        }

        logger.info('Permission updated', {
            permissionId,
            updatedFields: Object.keys(updates)
        });

        return permission;
    }

    /**
     * Delete permission
     * @param {string} permissionId - Permission ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(permissionId) {
        // Check if permission is assigned to any roles
        const [{ count: roleCount }] = await knex('role_permissions')
            .where({ permission_id: permissionId })
            .count('* as count');

        if (parseInt(roleCount) > 0) {
            throw new Error('Cannot delete permission assigned to roles');
        }

        // Check if permission is assigned to any users
        const [{ count: userCount }] = await knex('user_permissions')
            .where({ permission_id: permissionId })
            .count('* as count');

        if (parseInt(userCount) > 0) {
            throw new Error('Cannot delete permission assigned to users');
        }

        const rowCount = await knex('permissions')
            .where({ id: permissionId })
            .delete();

        logger.info('Permission deleted', { permissionId });
        return rowCount > 0;
    }

    /**
     * Get roles that have this permission
     * @param {string} permissionId - Permission ID
     * @returns {Promise<Array>} Array of roles
     */
    static async getRoles(permissionId) {
        const roles = await knex('roles as r')
            .select('r.id', 'r.name', 'r.description', 'r.is_system_role')
            .join('role_permissions as rp', 'r.id', 'rp.role_id')
            .where('rp.permission_id', permissionId)
            .orderBy('r.name');

        return roles;
    }

    /**
     * Get users that have this permission (directly assigned)
     * @param {string} permissionId - Permission ID
     * @returns {Promise<Array>} Array of users
     */
    static async getUsers(permissionId) {
        const users = await knex('users as u')
            .select(
                'u.id', 'u.username', 'u.email', 'u.first_name', 'u.last_name',
                'up.granted'
            )
            .join('user_permissions as up', 'u.id', 'up.user_id')
            .where('up.permission_id', permissionId)
            .orderBy('u.username');

        return users;
    }

    /**
     * Bulk create permissions
     * @param {Array<Object>} permissions - Array of permission objects
     * @returns {Promise<Array>} Array of created permissions
     */
    static async bulkCreate(permissions) {
        const trx = await knex.transaction();

        try {
            const created = [];

            for (const perm of permissions) {
                const [permission] = await trx('permissions')
                    .insert({
                        name: perm.name,
                        resource: perm.resource,
                        action: perm.action,
                        description: perm.description || null
                    })
                    .onConflict(['resource', 'action'])
                    .ignore()
                    .returning(['id', 'name', 'resource', 'action', 'description']);

                if (permission) {
                    created.push(permission);
                }
            }

            await trx.commit();

            logger.info('Bulk permissions created', {
                count: created.length
            });

            return created;
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    /**
     * Check if permission exists
     * @param {string} resource - Resource name
     * @param {string} action - Action name
     * @returns {Promise<boolean>} Existence status
     */
    static async exists(resource, action) {
        const permission = await knex('permissions')
            .select('id')
            .where({ resource, action })
            .first();

        return !!permission;
    }
}

module.exports = Permission;
