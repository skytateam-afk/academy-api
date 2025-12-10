/**
 * Role Model
 * Handles role-related database operations
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class Role {
    /**
     * Create a new role
     * @param {Object} roleData - Role data
     * @returns {Promise<Object>} Created role
     */
    static async create(roleData) {
        const { name, description } = roleData;

        try {
            const [role] = await knex('roles')
                .insert({
                    name,
                    description: description || null,
                    is_system_role: false
                })
                .returning(['id', 'name', 'description', 'is_system_role', 'created_at']);

            logger.info('Role created', {
                roleId: role.id,
                roleName: role.name
            });

            return role;
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Role name already exists');
            }
            throw error;
        }
    }

    /**
     * Find role by ID
     * @param {string} roleId - Role ID
     * @returns {Promise<Object|null>} Role object or null
     */
    static async findById(roleId) {
        const role = await knex('roles')
            .select('id', 'name', 'description', 'is_system_role', 'created_at', 'updated_at')
            .where({ id: roleId })
            .first();

        return role || null;
    }

    /**
     * Find role by name
     * @param {string} name - Role name
     * @returns {Promise<Object|null>} Role object or null
     */
    static async findByName(name) {
        const role = await knex('roles')
            .select('id', 'name', 'description', 'is_system_role', 'created_at', 'updated_at')
            .where({ name })
            .first();

        return role || null;
    }

    /**
     * Get all roles
     * @returns {Promise<Array>} Array of roles
     */
    static async getAll() {
        const roles = await knex('roles as r')
            .select(
                'r.id', 'r.name', 'r.description', 'r.is_system_role',
                'r.created_at', 'r.updated_at'
            )
            .count('u.id as user_count')
            .count('rp.permission_id as permission_count')
            .leftJoin('users as u', 'r.id', 'u.role_id')
            .leftJoin('role_permissions as rp', 'r.id', 'rp.role_id')
            .groupBy('r.id', 'r.name', 'r.description', 'r.is_system_role', 'r.created_at', 'r.updated_at')
            .orderBy('r.name');

        return roles;
    }

    /**
     * Update role
     * @param {string} roleId - Role ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated role
     */
    static async update(roleId, updates) {
        const { name, description } = updates;

        // Check if role is system role
        const role = await this.findById(roleId);
        if (!role) {
            throw new Error('Role not found');
        }

        if (role.is_system_role) {
            throw new Error('Cannot modify system roles');
        }

        const updateData = {};
        
        if (name !== undefined) {
            updateData.name = name;
        }

        if (description !== undefined) {
            updateData.description = description;
        }

        if (Object.keys(updateData).length === 0) {
            throw new Error('No valid fields to update');
        }

        updateData.updated_at = knex.fn.now();

        const [updatedRole] = await knex('roles')
            .where({ id: roleId })
            .update(updateData)
            .returning(['id', 'name', 'description', 'is_system_role', 'updated_at']);

        logger.info('Role updated', {
            roleId,
            updatedFields: Object.keys(updates)
        });

        return updatedRole;
    }

    /**
     * Delete role
     * @param {string} roleId - Role ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(roleId) {
        // Check if role is system role
        const role = await this.findById(roleId);
        if (!role) {
            throw new Error('Role not found');
        }

        if (role.is_system_role) {
            throw new Error('Cannot delete system roles');
        }

        // Check if role has users
        const [{ count }] = await knex('users')
            .where({ role_id: roleId })
            .count('* as count');

        if (parseInt(count) > 0) {
            throw new Error('Cannot delete role with assigned users');
        }

        const rowCount = await knex('roles')
            .where({ id: roleId })
            .delete();

        logger.info('Role deleted', { roleId });
        return rowCount > 0;
    }

    /**
     * Get role permissions
     * @param {string} roleId - Role ID
     * @returns {Promise<Array>} Array of permissions
     */
    static async getPermissions(roleId) {
        const permissions = await knex('permissions as p')
            .select('p.id', 'p.name', 'p.resource', 'p.action', 'p.description')
            .join('role_permissions as rp', 'p.id', 'rp.permission_id')
            .where('rp.role_id', roleId)
            .orderBy(['p.resource', 'p.action']);

        return permissions;
    }

    /**
     * Assign permission to role
     * @param {string} roleId - Role ID
     * @param {string} permissionId - Permission ID
     * @returns {Promise<boolean>} Success status
     */
    static async assignPermission(roleId, permissionId) {
        try {
            await knex('role_permissions')
                .insert({
                    role_id: roleId,
                    permission_id: permissionId
                })
                .onConflict(['role_id', 'permission_id'])
                .ignore();

            logger.info('Permission assigned to role', {
                roleId,
                permissionId
            });

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Remove permission from role
     * @param {string} roleId - Role ID
     * @param {string} permissionId - Permission ID
     * @returns {Promise<boolean>} Success status
     */
    static async removePermission(roleId, permissionId) {
        const rowCount = await knex('role_permissions')
            .where({
                role_id: roleId,
                permission_id: permissionId
            })
            .delete();

        logger.info('Permission removed from role', {
            roleId,
            permissionId
        });

        return rowCount > 0;
    }

    /**
     * Sync role permissions (replace all permissions)
     * @param {string} roleId - Role ID
     * @param {Array<string>} permissionIds - Array of permission IDs
     * @returns {Promise<boolean>} Success status
     */
    static async syncPermissions(roleId, permissionIds) {
        const trx = await knex.transaction();

        try {
            // Remove all existing permissions
            await trx('role_permissions')
                .where({ role_id: roleId })
                .delete();

            // Add new permissions
            if (permissionIds.length > 0) {
                const permissions = permissionIds.map(permId => ({
                    role_id: roleId,
                    permission_id: permId
                }));

                await trx('role_permissions').insert(permissions);
            }

            await trx.commit();

            logger.info('Role permissions synced', {
                roleId,
                permissionCount: permissionIds.length
            });

            return true;
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    /**
     * Get users with this role
     * @param {string} roleId - Role ID
     * @returns {Promise<Array>} Array of users
     */
    static async getUsers(roleId) {
        const users = await knex('users')
            .select(
                'id', 'username', 'email', 'first_name', 'last_name',
                'is_active', 'is_verified', 'created_at'
            )
            .where({ role_id: roleId })
            .orderBy('created_at', 'desc');

        return users;
    }
}

module.exports = Role;
