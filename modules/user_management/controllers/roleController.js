/**
 * Role Controller
 * Handles HTTP requests for role management
 */

const Role = require('../../../models/Role');
const logger = require('../../../config/winston');

class RoleController {
    /**
     * Get all roles
     * GET /api/roles
     */
    async getAll(req, res) {
        try {
            const roles = await Role.getAll();

            res.json({
                success: true,
                data: roles
            });
        } catch (error) {
            logger.error('Error getting roles', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error retrieving roles',
                error: error.message
            });
        }
    }

    /**
     * Get role by ID
     * GET /api/roles/:id
     */
    async getById(req, res) {
        try {
            const { id } = req.params;

            const role = await Role.findById(id);

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }

            // Get role permissions
            const permissions = await Role.getPermissions(id);

            res.json({
                success: true,
                data: {
                    ...role,
                    permissions
                }
            });
        } catch (error) {
            logger.error('Error getting role', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error retrieving role',
                error: error.message
            });
        }
    }

    /**
     * Create new role
     * POST /api/roles
     */
    async create(req, res) {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Role name is required'
                });
            }

            const role = await Role.create({ name, description });

            res.status(201).json({
                success: true,
                message: 'Role created successfully',
                data: role
            });
        } catch (error) {
            logger.error('Error creating role', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error creating role'
            });
        }
    }

    /**
     * Update role
     * PUT /api/roles/:id
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const role = await Role.update(id, updates);

            res.json({
                success: true,
                message: 'Role updated successfully',
                data: role
            });
        } catch (error) {
            logger.error('Error updating role', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error updating role'
            });
        }
    }

    /**
     * Delete role
     * DELETE /api/roles/:id
     */
    async delete(req, res) {
        try {
            const { id } = req.params;

            const deleted = await Role.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }

            res.json({
                success: true,
                message: 'Role deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting role', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error deleting role'
            });
        }
    }

    /**
     * Get role permissions
     * GET /api/roles/:id/permissions
     */
    async getPermissions(req, res) {
        try {
            const { id } = req.params;

            const permissions = await Role.getPermissions(id);

            res.json({
                success: true,
                data: permissions
            });
        } catch (error) {
            logger.error('Error getting role permissions', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error retrieving role permissions',
                error: error.message
            });
        }
    }

    /**
     * Sync role permissions
     * PUT /api/roles/:id/permissions
     */
    async syncPermissions(req, res) {
        try {
            const { id } = req.params;
            const { permission_ids } = req.body;

            if (!Array.isArray(permission_ids)) {
                return res.status(400).json({
                    success: false,
                    message: 'permission_ids must be an array'
                });
            }

            await Role.syncPermissions(id, permission_ids);

            res.json({
                success: true,
                message: 'Role permissions updated successfully'
            });
        } catch (error) {
            logger.error('Error syncing role permissions', { error: error.message });
            res.status(400).json({
                success: false,
                message: error.message || 'Error updating role permissions'
            });
        }
    }

    /**
     * Get users with this role
     * GET /api/roles/:id/users
     */
    async getUsers(req, res) {
        try {
            const { id } = req.params;

            const users = await Role.getUsers(id);

            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            logger.error('Error getting role users', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error retrieving role users',
                error: error.message
            });
        }
    }
}

module.exports = new RoleController();
