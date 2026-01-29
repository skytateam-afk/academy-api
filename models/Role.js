/**
 * Role Model
 * Handles role-related database operations
 */

const db = require('../config/database');
const logger = require('../config/winston');

class Role {
    /**
     * Create a new role
     * @param {Object} roleData - Role data
     * @returns {Promise<Object>} Created role
     */
    static async create(roleData) {
        const { name, description } = roleData;

        try {
            const query = `
                INSERT INTO roles (name, description, is_system_role)
                VALUES ($1, $2, false)
                RETURNING id, name, description, is_system_role, created_at
            `;

            const result = await db.query(query, [name, description || null]);
            const role = result.rows[0];

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
        const query = `
            SELECT id, name, description, is_system_role, created_at, updated_at
            FROM roles
            WHERE id = $1
        `;

        const result = await db.query(query, [roleId]);
        return result.rows[0] || null;
    }

    /**
     * Find role by name
     * @param {string} name - Role name
     * @returns {Promise<Object|null>} Role object or null
     */
    static async findByName(name) {
        const query = `
            SELECT id, name, description, is_system_role, created_at, updated_at
            FROM roles
            WHERE name = $1
        `;

        const result = await db.query(query, [name]);
        return result.rows[0] || null;
    }

    /**
     * Get all roles
     * @returns {Promise<Array>} Array of roles
     */
    static async getAll() {
        const query = `
            SELECT 
                r.id, r.name, r.description, r.is_system_role, 
                r.created_at, r.updated_at,
                COUNT(DISTINCT u.id) as user_count,
                COUNT(DISTINCT rp.permission_id) as permission_count
            FROM roles r
            LEFT JOIN users u ON r.id = u.role_id
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            GROUP BY r.id, r.name, r.description, r.is_system_role, r.created_at, r.updated_at
            ORDER BY r.name
        `;

        const result = await db.query(query);
        return result.rows;
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

        const fields = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            fields.push(`name = $${paramCount}`);
            values.push(name);
            paramCount++;
        }

        if (description !== undefined) {
            fields.push(`description = $${paramCount}`);
            values.push(description);
            paramCount++;
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(roleId);

        const query = `
            UPDATE roles
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING id, name, description, is_system_role, updated_at
        `;

        const result = await db.query(query, values);

        logger.info('Role updated', {
            roleId,
            updatedFields: Object.keys(updates)
        });

        return result.rows[0];
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
        const userCheck = await db.query(
            'SELECT COUNT(*) as count FROM users WHERE role_id = $1',
            [roleId]
        );

        if (parseInt(userCheck.rows[0].count) > 0) {
            throw new Error('Cannot delete role with assigned users');
        }

        const query = 'DELETE FROM roles WHERE id = $1';
        const result = await db.query(query, [roleId]);

        logger.info('Role deleted', { roleId });
        return result.rowCount > 0;
    }

    /**
     * Get role permissions
     * @param {string} roleId - Role ID
     * @returns {Promise<Array>} Array of permissions
     */
    static async getPermissions(roleId) {
        const query = `
            SELECT p.id, p.name, p.resource, p.action, p.description
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = $1
            ORDER BY p.resource, p.action
        `;

        const result = await db.query(query, [roleId]);
        return result.rows;
    }

    /**
     * Assign permission to role
     * @param {string} roleId - Role ID
     * @param {string} permissionId - Permission ID
     * @returns {Promise<boolean>} Success status
     */
    static async assignPermission(roleId, permissionId) {
        try {
            const query = `
                INSERT INTO role_permissions (role_id, permission_id)
                VALUES ($1, $2)
                ON CONFLICT (role_id, permission_id) DO NOTHING
            `;

            await db.query(query, [roleId, permissionId]);

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
        const query = `
            DELETE FROM role_permissions
            WHERE role_id = $1 AND permission_id = $2
        `;

        const result = await db.query(query, [roleId, permissionId]);

        logger.info('Permission removed from role', {
            roleId,
            permissionId
        });

        return result.rowCount > 0;
    }

    /**
     * Sync role permissions (replace all permissions)
     * @param {string} roleId - Role ID
     * @param {Array<string>} permissionIds - Array of permission IDs
     * @returns {Promise<boolean>} Success status
     */
    static async syncPermissions(roleId, permissionIds) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Remove all existing permissions
            await client.query(
                'DELETE FROM role_permissions WHERE role_id = $1',
                [roleId]
            );

            // Add new permissions
            if (permissionIds.length > 0) {
                const values = permissionIds.map((permId, index) =>
                    `($1, $${index + 2})`
                ).join(', ');

                const query = `
                    INSERT INTO role_permissions (role_id, permission_id)
                    VALUES ${values}
                `;

                await client.query(query, [roleId, ...permissionIds]);
            }

            await client.query('COMMIT');

            logger.info('Role permissions synced', {
                roleId,
                permissionCount: permissionIds.length
            });

            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get users with this role
     * @param {string} roleId - Role ID
     * @returns {Promise<Array>} Array of users
     */
    static async getUsers(roleId) {
        const query = `
            SELECT 
                id, username, email, first_name, last_name,
                is_active, is_verified, created_at
            FROM users
            WHERE role_id = $1
            ORDER BY created_at DESC
        `;

        const result = await db.query(query, [roleId]);
        return result.rows;
    }
}

module.exports = Role;
