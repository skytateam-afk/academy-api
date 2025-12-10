/**
 * Permission Model
 * Handles permission-related database operations
 */

const db = require('../config/database');
const logger = require('../config/winston');

class Permission {
    /**
     * Create a new permission
     * @param {Object} permissionData - Permission data
     * @returns {Promise<Object>} Created permission
     */
    static async create(permissionData) {
        const { name, resource, action, description } = permissionData;

        try {
            const query = `
                INSERT INTO permissions (name, resource, action, description)
                VALUES ($1, $2, $3, $4)
                RETURNING id, name, resource, action, description, created_at
            `;

            const result = await db.query(query, [
                name,
                resource,
                action,
                description || null
            ]);

            const permission = result.rows[0];

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
        const query = `
            SELECT id, name, resource, action, description, created_at
            FROM permissions
            WHERE id = $1
        `;

        const result = await db.query(query, [permissionId]);
        return result.rows[0] || null;
    }

    /**
     * Find permission by name
     * @param {string} name - Permission name
     * @returns {Promise<Object|null>} Permission object or null
     */
    static async findByName(name) {
        const query = `
            SELECT id, name, resource, action, description, created_at
            FROM permissions
            WHERE name = $1
        `;

        const result = await db.query(query, [name]);
        return result.rows[0] || null;
    }

    /**
     * Get all permissions
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of permissions
     */
    static async getAll(options = {}) {
        const { resource = null, groupByResource = false } = options;

        let query = `
            SELECT 
                p.id, p.name, p.resource, p.action, p.description, p.created_at,
                COUNT(DISTINCT rp.role_id) as role_count
            FROM permissions p
            LEFT JOIN role_permissions rp ON p.id = rp.permission_id
        `;

        const conditions = [];
        const values = [];

        if (resource) {
            conditions.push('p.resource = $1');
            values.push(resource);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += `
            GROUP BY p.id, p.name, p.resource, p.action, p.description, p.created_at
            ORDER BY p.resource, p.action
        `;

        const result = await db.query(query, values);

        if (groupByResource) {
            // Group permissions by resource
            const grouped = {};
            result.rows.forEach(perm => {
                if (!grouped[perm.resource]) {
                    grouped[perm.resource] = [];
                }
                grouped[perm.resource].push(perm);
            });
            return grouped;
        }

        return result.rows;
    }

    /**
     * Get all unique resources
     * @returns {Promise<Array>} Array of resource names
     */
    static async getResources() {
        const query = `
            SELECT DISTINCT resource
            FROM permissions
            ORDER BY resource
        `;

        const result = await db.query(query);
        return result.rows.map(row => row.resource);
    }

    /**
     * Update permission
     * @param {string} permissionId - Permission ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated permission
     */
    static async update(permissionId, updates) {
        const { name, resource, action, description } = updates;

        const fields = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            fields.push(`name = $${paramCount}`);
            values.push(name);
            paramCount++;
        }

        if (resource !== undefined) {
            fields.push(`resource = $${paramCount}`);
            values.push(resource);
            paramCount++;
        }

        if (action !== undefined) {
            fields.push(`action = $${paramCount}`);
            values.push(action);
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

        values.push(permissionId);

        const query = `
            UPDATE permissions
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, name, resource, action, description
        `;

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            throw new Error('Permission not found');
        }

        logger.info('Permission updated', {
            permissionId,
            updatedFields: Object.keys(updates)
        });

        return result.rows[0];
    }

    /**
     * Delete permission
     * @param {string} permissionId - Permission ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(permissionId) {
        // Check if permission is assigned to any roles
        const roleCheck = await db.query(
            'SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = $1',
            [permissionId]
        );

        if (parseInt(roleCheck.rows[0].count) > 0) {
            throw new Error('Cannot delete permission assigned to roles');
        }

        // Check if permission is assigned to any users
        const userCheck = await db.query(
            'SELECT COUNT(*) as count FROM user_permissions WHERE permission_id = $1',
            [permissionId]
        );

        if (parseInt(userCheck.rows[0].count) > 0) {
            throw new Error('Cannot delete permission assigned to users');
        }

        const query = 'DELETE FROM permissions WHERE id = $1';
        const result = await db.query(query, [permissionId]);

        logger.info('Permission deleted', { permissionId });
        return result.rowCount > 0;
    }

    /**
     * Get roles that have this permission
     * @param {string} permissionId - Permission ID
     * @returns {Promise<Array>} Array of roles
     */
    static async getRoles(permissionId) {
        const query = `
            SELECT r.id, r.name, r.description, r.is_system_role
            FROM roles r
            JOIN role_permissions rp ON r.id = rp.role_id
            WHERE rp.permission_id = $1
            ORDER BY r.name
        `;

        const result = await db.query(query, [permissionId]);
        return result.rows;
    }

    /**
     * Get users that have this permission (directly assigned)
     * @param {string} permissionId - Permission ID
     * @returns {Promise<Array>} Array of users
     */
    static async getUsers(permissionId) {
        const query = `
            SELECT 
                u.id, u.username, u.email, u.first_name, u.last_name,
                up.granted
            FROM users u
            JOIN user_permissions up ON u.id = up.user_id
            WHERE up.permission_id = $1
            ORDER BY u.username
        `;

        const result = await db.query(query, [permissionId]);
        return result.rows;
    }

    /**
     * Bulk create permissions
     * @param {Array<Object>} permissions - Array of permission objects
     * @returns {Promise<Array>} Array of created permissions
     */
    static async bulkCreate(permissions) {
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            const created = [];

            for (const perm of permissions) {
                const query = `
                    INSERT INTO permissions (name, resource, action, description)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (resource, action) DO NOTHING
                    RETURNING id, name, resource, action, description
                `;

                const result = await client.query(query, [
                    perm.name,
                    perm.resource,
                    perm.action,
                    perm.description || null
                ]);

                if (result.rows.length > 0) {
                    created.push(result.rows[0]);
                }
            }

            await client.query('COMMIT');

            logger.info('Bulk permissions created', {
                count: created.length
            });

            return created;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Check if permission exists
     * @param {string} resource - Resource name
     * @param {string} action - Action name
     * @returns {Promise<boolean>} Existence status
     */
    static async exists(resource, action) {
        const query = `
            SELECT id FROM permissions
            WHERE resource = $1 AND action = $2
        `;

        const result = await db.query(query, [resource, action]);
        return result.rows.length > 0;
    }
}

module.exports = Permission;
